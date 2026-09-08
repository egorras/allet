// Parses English month-scoped opera.hu programme pages. Selectors and
// derived-URL rules are documented in opera-tracker's docs/opera-hu-source.md
// (this scraper is a TypeScript port of that project's parser.py/importer.py,
// verified against a real captured page — see ./fixtures).
import * as cheerio from 'cheerio'

const TIME_RE = /^(\d{1,2}):(\d{2})$/
const DAY_RE = /^(\d{1,2})\.?$/
const PERFORMANCE_SUFFIX_RE = /-\d{4}-\d{2}-\d{2}-\d{4}$/
const TICKET_REDIRECT_PREFIX = '/ticketredirect/'
const EXCLUDED_TAG_CLASSES = new Set(['tag--age', 'tag--premier'])

export class ParseError extends Error {}

export interface MonthEvent {
  startDate: string // "YYYY-MM-DD"
  startTime: string // "HH:MM"
  venue: string
  building: string
  categoryTags: string[]
  composer: string | null
  title: string
  performanceUrlPath: string
  ticketUrl: string | null
}

export function parseMonth(html: string, year: number, month: number): MonthEvent[] {
  if (
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 2099 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new ParseError(`invalid requested month: ${month}`)
  }
  // htmlparser2, not the spec-compliant parse5 default: parse5 puts
  // <template> children into a detached content fragment (invisible to
  // normal traversal), but the static markup below <template> is exactly
  // what we need to reach into, same as opera-tracker's custom parser.
  const $ = cheerio.load(html, { xml: {} })
  const daysList = $('ul.block-list').first()
  if (daysList.length === 0) {
    throw new ParseError('month page is missing the day list')
  }

  const events: MonthEvent[] = []
  daysList.find('li.day').each((_, dayEl) => {
    const day = $(dayEl)
    const dayCounter = day.find('span.day-counter').first()
    if (dayCounter.length === 0) {
      throw new ParseError('month day is missing span.day-counter')
    }
    const dayNumber = parseDay(dayCounter.text())
    if (dayNumber < 1 || dayNumber > new Date(year, month, 0).getDate())
      throw new ParseError('Invalid calendar date')
    const startDate = `${year}-${String(month).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`

    day.find('wt-event.block-list-post').each((_, eventEl) => {
      const article = $(eventEl).find('template article.post').first()
      if (article.length === 0) {
        throw new ParseError('month event is missing template article.post')
      }
      events.push(parseMonthEvent($, article, startDate))
    })
  })
  return events
}

function parseMonthEvent(
  $: cheerio.CheerioAPI,
  article: ReturnType<cheerio.CheerioAPI>,
  startDate: string,
): MonthEvent {
  const building = article.attr('data-building')
  if (!building) {
    throw new ParseError('month event article is missing data-building')
  }

  const timeNode = article.find('div.post-time').first()
  const locationNode = article.find('span.post-location-name').first()
  const titleLink = article.find('a.post-title-link').first()
  if (timeNode.length === 0 || locationNode.length === 0 || titleLink.length === 0) {
    throw new ParseError('month event is missing time, venue, or title fields')
  }
  const performanceUrlPath = titleLink.attr('href') ?? ''
  if (!performanceUrlPath) {
    throw new ParseError('month event title link is missing href')
  }

  const authorNode = article.find('div.post-author').first()
  const footer = article.find('footer.post-footer').first()
  let ticketUrl: string | null = null
  if (footer.length > 0) {
    const candidate = footer
      .find('ui-button')
      .toArray()
      .map((el) => $(el).attr('href') ?? '')
      .find((href) => href.startsWith(TICKET_REDIRECT_PREFIX))
    if (candidate) {
      ticketUrl = decodeTicketUrl(candidate)
    }
  }

  return {
    startDate,
    startTime: parseStartTime(timeNode.text()),
    venue: locationNode.text().trim(),
    building,
    categoryTags: extractCategoryTags($, article.find('div.post-category').first()),
    composer: authorNode.length > 0 ? authorNode.text().trim() : null,
    title: titleLink.text().trim(),
    performanceUrlPath,
    ticketUrl,
  }
}

function parseDay(text: string): number {
  const match = DAY_RE.exec(text.trim())
  if (!match) {
    throw new ParseError(`unrecognized day text: ${JSON.stringify(text)}`)
  }
  return Number(match[1])
}

function parseStartTime(text: string): string {
  const match = TIME_RE.exec(text.trim())
  if (!match) {
    throw new ParseError(`unrecognized time text: ${JSON.stringify(text)}`)
  }
  if (Number(match[1]) > 23 || Number(match[2]) > 59) throw new ParseError('Invalid time')
  return `${(match[1] ?? '').padStart(2, '0')}:${match[2]}`
}

function extractCategoryTags(
  $: cheerio.CheerioAPI,
  categoryNode: ReturnType<cheerio.CheerioAPI>,
): string[] {
  if (categoryNode.length === 0) return []
  return categoryNode
    .find('span.tag')
    .toArray()
    .map((el) => $(el))
    .filter((node) => {
      const classes = (node.attr('class') ?? '').split(/\s+/)
      return node.text().trim().length > 0 && !classes.some((c) => EXCLUDED_TAG_CLASSES.has(c))
    })
    .map((node) => node.text().trim())
}

function decodeTicketUrl(href: string): string | null {
  if (!href.startsWith(TICKET_REDIRECT_PREFIX)) return null
  const payload = href.slice(TICKET_REDIRECT_PREFIX.length)
  const decoded = Buffer.from(payload, 'base64url').toString('utf-8')
  if (!decoded.startsWith('http')) {
    throw new ParseError(`invalid ticket redirect payload: ${JSON.stringify(href)}`)
  }
  return decoded
}

/** Strip the trailing `{venue}-{date}-{time}` segment from a performance URL path. */
export function deriveProductionUrlPath(performanceUrlPath: string): string {
  const path = performanceUrlPath.replace(/^\/+|\/+$/g, '')
  const parts = path.split('/')
  const last = parts[parts.length - 1] ?? ''
  if (parts.length < 4 || !PERFORMANCE_SUFFIX_RE.test(last)) {
    throw new ParseError(
      `unrecognized opera.hu performance URL: ${JSON.stringify(performanceUrlPath)}`,
    )
  }
  return `/${parts.slice(0, -1).join('/')}/`
}

/** Locale-independent dedup key: drop the `{locale}/{section}` prefix, e.g. "en/programme". */
export function sourceKeyForPath(performanceUrlPath: string): string {
  const path = performanceUrlPath.replace(/^\/+|\/+$/g, '')
  const parts = path.split('/')
  const last = parts[parts.length - 1] ?? ''
  if (parts.length < 4 || !PERFORMANCE_SUFFIX_RE.test(last)) {
    throw new ParseError(
      `unrecognized opera.hu performance URL: ${JSON.stringify(performanceUrlPath)}`,
    )
  }
  return parts.slice(2).join('/')
}
