import { sourcesSchema } from '@allet/contracts'
import { useTranslation } from 'react-i18next'
import { useApi } from '@/shared/api/useApi'

export function Sources() {
  const { t, i18n } = useTranslation('stage')
  const result = useApi('/api/sources', sourcesSchema)
  const date = (value: string) =>
    new Intl.DateTimeFormat(i18n.resolvedLanguage, {
      dateStyle: 'medium',
      timeStyle: 'short',
      hour12: false,
    }).format(new Date(value))
  if (result.status === 'loading') return <p role="status">{t('catalogue.loading')}</p>
  if (result.status === 'error') return <p role="status">{t('catalogue.unavailable')}</p>
  return (
    <div>
      {result.data.sources.map((source) => (
        <div key={source.key} className="space-y-2">
          <h3 className="font-semibold">{source.name}</h3>
          <p className="text-sm">{t('catalogue.sourceDescription')}</p>
          <p className="text-sm">
            {source.lastSuccessAt
              ? t('catalogue.observed', { date: date(source.lastSuccessAt) })
              : t('catalogue.neverImported')}
          </p>
          <p className="text-sm text-ink-muted">{t('catalogue.adminOnly')}</p>
          <h4 className="font-semibold">{t('catalogue.history')}</h4>
          {source.runs.length === 0 && <p>{t('catalogue.noRuns')}</p>}
          <ul className="divide-y divide-line">
            {source.runs.map((run) => (
              <li key={run.id} className="py-2 text-sm">
                <p>
                  {run.month} · {t(`catalogue.run.${run.status}`)} · {date(run.startedAt)}
                </p>
                {run.count !== null && <p>{t('catalogue.imported', { count: run.count })}</p>}
                {run.errorCode && <p>{t(`catalogue.errors.${run.errorCode}`)}</p>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
