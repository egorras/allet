import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import {
  addMonths,
  currentMonth,
  formatMonth,
  parseMonth,
  MONTH_PATTERN,
} from '@/shared/calendar/month'
import { MonthGrid } from '@/shared/calendar/MonthGrid'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ChevronLeftIcon, ChevronRightIcon } from '@/shared/ui/icons'

/** The shown month lives in the URL, so a month is linkable and survives reload. */
const searchSchema = z
  .object({ month: z.string().regex(MONTH_PATTERN).optional() })
  .catch({ month: undefined })

export const Route = createFileRoute('/calendar')({
  validateSearch: searchSchema,
  component: CalendarPage,
})

function CalendarPage() {
  const { t, i18n } = useTranslation('calendar')
  const { month: monthParam } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const month = parseMonth(monthParam) ?? currentMonth()
  const locale = i18n.resolvedLanguage ?? 'en'
  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
    new Date(month.year, month.month - 1, 1),
  )

  const goTo = (next: { year: number; month: number }) => {
    void navigate({ search: { month: formatMonth(next) } })
  }

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-label={t('previousMonth')}
          onClick={() => {
            goTo(addMonths(month, -1))
          }}
          className="rounded border border-line bg-raised p-1.5 hover:bg-sunken"
        >
          <ChevronLeftIcon />
        </button>
        <button
          type="button"
          aria-label={t('nextMonth')}
          onClick={() => {
            goTo(addMonths(month, 1))
          }}
          className="rounded border border-line bg-raised p-1.5 hover:bg-sunken"
        >
          <ChevronRightIcon />
        </button>
        <button
          type="button"
          onClick={() => {
            goTo(currentMonth())
          }}
          className="rounded border border-line bg-raised px-3 py-1.5 text-sm hover:bg-sunken"
        >
          {t('today')}
        </button>
        <h2 aria-live="polite" className="ml-1 text-sm font-semibold">
          {monthLabel}
        </h2>
      </div>

      <MonthGrid month={month} locale={locale} />

      <p className="mt-3 flex flex-wrap gap-4 text-xs text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full border border-dashed border-ink-muted" />
          {t('legend.option')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" />
          {t('legend.confirmed')}
        </span>
      </p>

      <div className="mt-3">
        <EmptyState description={t('empty')} />
      </div>
    </>
  )
}
