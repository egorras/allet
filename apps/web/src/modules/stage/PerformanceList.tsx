import { Link } from '@tanstack/react-router'
import type { Performance } from '@allet/contracts'
import { useTranslation } from 'react-i18next'

export function PerformanceList({ performances }: { performances: Performance[] }) {
  const { t, i18n } = useTranslation('stage')
  return (
    <ul className="divide-y divide-line">
      {performances.map((performance) => (
        <li key={performance.id} className="py-3">
          <Link
            className="font-semibold text-accent underline"
            to="/stage/productions/$productionId"
            params={{ productionId: performance.productionId }}
          >
            {performance.title}
          </Link>
          {performance.composer && <p className="text-sm">{performance.composer}</p>}
          <p className="text-sm">
            <time dateTime={`${performance.date}T${performance.time}`}>
              {performance.date} · {performance.time}
            </time>{' '}
            · {performance.venue}, {performance.city}
          </p>
          <p className="text-xs text-ink-muted">
            {t('catalogue.localTime', { zone: performance.timeZone })}
          </p>
          <p className="text-xs text-ink-muted">
            {t('catalogue.observed', {
              date: new Intl.DateTimeFormat(i18n.resolvedLanguage, {
                dateStyle: 'medium',
                timeStyle: 'short',
                hour12: false,
              }).format(new Date(performance.observedAt)),
            })}
          </p>
        </li>
      ))}
    </ul>
  )
}
