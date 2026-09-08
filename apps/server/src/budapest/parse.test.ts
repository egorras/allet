import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { ParseError, parseMonth } from './parse.js'

const fixturePath = fileURLToPath(
  new URL('./fixtures/programme_month_2026-10.html', import.meta.url),
)
const fixtureHtml = readFileSync(fixturePath, 'utf-8')

describe('parseMonth', () => {
  it('extracts event fields and direct URLs from the fixture', () => {
    const events = parseMonth(fixtureHtml, 2026, 10)

    expect(events).toHaveLength(5)
    const first = events[0]
    if (!first) throw new Error('Missing event')
    expect(first.startDate).toBe('2026-10-01')
    expect(first.startTime).toBe('20:00')
    expect(first.building).toBe('opera')
    expect(first.venue).toBe('Hungarian State Opera')
    expect(first.categoryTags).toEqual(['Symphony'])
    expect(first.composer).toBe('Gustav Mahler')
    expect(first.title).toBe('Symphony No. 8')
    expect(first.performanceUrlPath).toBe(
      '/en/programme/2026-2027/symphony-no-8/hungarian-state-opera-2026-10-01-2000/',
    )
    expect(first.ticketUrl).toBe(
      'https://opera.jegy.hu/program/symphony-no-8-160368/1407955?lang=en',
    )
  })

  it('filters only age and premiere tags', () => {
    const events = parseMonth(fixtureHtml, 2026, 10)

    expect(events[1]?.categoryTags).toEqual([
      'classical',
      "Children's performance",
      'Fairy tale ballet',
    ])
    expect(events[2]?.categoryTags).toEqual(['mix', 'Singspiel', "Children's performance"])
    expect(events[3]?.categoryTags).toEqual(['mix', 'Singspiel'])
    expect(events[1]?.ticketUrl).toBeNull()
    expect(events[3]?.ticketUrl).toBeNull()
  })

  it('uses the requested year and month', () => {
    const html = `
      <ul class="block-list"><li class="day">
            <span class="day-counter">7.</span><div class="day-list">
            <wt-event class="block-list-post">
          <template><article class="post" data-building="opera">
            <div class="post-time">09:05</div>
            <div class="post-category"></div>
            <div class="post-author"></div>
            <h2><a class="post-title-link"
                href="/en/programme/2026-2027/a/a-2026-11-07-0905/">A</a></h2>
            <span class="post-location-name">Opera</span>
          </article></template>
        </wt-event></div>
      </li></ul>
    `

    const event = parseMonth(html, 2030, 2)[0]
    if (!event) throw new Error('Missing event')
    expect(event.startDate).toBe('2030-02-07')
    expect(event.startTime).toBe('09:05')
  })

  it('raises on missing day list', () => {
    expect(() => parseMonth('<html><body>no events</body></html>', 2026, 10)).toThrow(ParseError)
  })

  it('raises on missing title link', () => {
    const html =
      '<ul class="block-list"><li class="day"><span class="day-counter">1.</span>' +
      '<wt-event class="block-list-post"><template><article class="post" data-building="opera">' +
      '<div class="post-time">20:00</div><span class="post-location-name">Opera</span>' +
      '</article></template></wt-event></li></ul>'
    expect(() => parseMonth(html, 2026, 10)).toThrow(ParseError)
  })
})
