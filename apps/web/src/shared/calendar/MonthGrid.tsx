import { isSameDay, monthGridDays, type Month } from './month'

const WEEKDAY_REFERENCE = [1, 2, 3, 4, 5, 6, 7].map((day) => new Date(2024, 0, day))

interface MonthGridProps {
  month: Month
  locale: string
  today?: Date | undefined
}

/** An empty month frame: v0 has no events to place in it (ALLET_PLAN.md §8, item 8). */
export function MonthGrid({ month, locale, today = new Date() }: MonthGridProps) {
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  const dayLabel = new Intl.DateTimeFormat(locale, { dateStyle: 'long' })
  const days = monthGridDays(month)
  const weeks = Array.from({ length: 6 }, (_, index) => days.slice(index * 7, index * 7 + 7))

  return (
    <table className="w-full table-fixed border-collapse text-sm">
      <thead>
        <tr>
          {WEEKDAY_REFERENCE.map((date) => (
            <th key={date.getDay()} scope="col" className="p-1 text-xs font-medium text-ink-muted">
              {weekday.format(date)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week) => (
          <tr key={week[0]?.toDateString()}>
            {week.map((date) => {
              const inMonth = date.getMonth() === month.month - 1
              const isToday = isSameDay(date, today)
              return (
                <td
                  key={date.toDateString()}
                  {...(isToday ? { 'aria-current': 'date' as const } : {})}
                  className={[
                    'h-16 border border-line p-1 align-top',
                    inMonth ? '' : 'text-ink-muted opacity-60',
                    isToday ? 'outline outline-2 -outline-offset-2 outline-accent' : '',
                  ].join(' ')}
                >
                  <span className="sr-only">{dayLabel.format(date)}</span>
                  <span aria-hidden="true">{date.getDate()}</span>
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
