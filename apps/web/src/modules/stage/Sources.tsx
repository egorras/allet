import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { sourcesSchema, type ScheduleInput, type Sources as SourcesData } from '@allet/contracts'
import { sendApi } from '@/shared/api/client'
import { useApi } from '@/shared/api/useApi'

type Source = SourcesData['sources'][number]

// Literal tuple: the interval labels are translation keys, checked against the
// namespace at build time rather than composed from an arbitrary number.
const INTERVALS = [60, 360, 720, 1440, 10080] as const
const inputClass = 'rounded border border-line bg-raised px-2 py-1.5 text-sm text-ink'
const buttonClass =
  'rounded border border-line px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:text-ink-muted'

export function Sources() {
  const { t } = useTranslation('stage')
  const result = useApi('/api/sources', sourcesSchema)
  if (result.status === 'loading') return <p role="status">{t('catalogue.loading')}</p>
  if (result.status === 'error') return <p role="status">{t('catalogue.unavailable')}</p>
  return (
    <div className="space-y-6">
      {result.data.sources.map((source) => (
        <Source key={source.key} source={source} onChange={result.reload} />
      ))}
    </div>
  )
}

function useFormatters() {
  const { i18n } = useTranslation()
  const moment = new Intl.DateTimeFormat(i18n.resolvedLanguage, {
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: false,
  })
  return { moment: (value: string) => moment.format(new Date(value)) }
}

function Source({ source, onChange }: { source: Source; onChange: () => void }) {
  const { t } = useTranslation('stage')
  const { moment } = useFormatters()
  return (
    <section className="space-y-3" aria-label={source.name}>
      <h3 className="font-semibold">{source.name}</h3>
      <p className="text-sm">{t('catalogue.sourceDescription')}</p>
      <p className="text-sm">
        {source.lastSuccessAt
          ? t('catalogue.observed', { date: moment(source.lastSuccessAt) })
          : t('catalogue.neverImported')}
      </p>
      {source.schedule && (
        <Schedule sourceKey={source.key} schedule={source.schedule} onChange={onChange} />
      )}
      <Tasks source={source} onChange={onChange} />
      <History source={source} />
    </section>
  )
}

function Schedule({
  sourceKey,
  schedule,
  onChange,
}: {
  sourceKey: string
  schedule: ScheduleInput
  onChange: () => void
}) {
  const { t } = useTranslation('stage')
  const [draft, setDraft] = useState(schedule)
  const [error, setError] = useState<'catalogue.schedule.failed' | null>(null)
  const [saving, setSaving] = useState(false)
  const dirty = JSON.stringify(draft) !== JSON.stringify(schedule)

  const save = () => {
    setSaving(true)
    setError(null)
    void sendApi(`/api/sources/${sourceKey}/schedule`, 'PUT', draft).then(
      () => {
        setSaving(false)
        onChange()
      },
      () => {
        setSaving(false)
        setError('catalogue.schedule.failed')
      },
    )
  }

  return (
    <div className="space-y-3 rounded-card border border-line p-[var(--spacing-card)]">
      <h4 className="font-semibold">{t('catalogue.schedule.title')}</h4>
      <p className="text-sm text-ink-muted">{t('catalogue.schedule.hint')}</p>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={draft.enabled}
          onChange={(event) => {
            setDraft({ ...draft, enabled: event.target.checked })
          }}
        />
        {t('catalogue.schedule.enabled')}
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-ink-muted">
            {t('catalogue.schedule.window')}
          </span>
          <input
            type="number"
            min={1}
            max={12}
            value={draft.windowMonths}
            onChange={(event) => {
              setDraft({ ...draft, windowMonths: Number(event.target.value) })
            }}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-ink-muted">
            {t('catalogue.schedule.interval')}
          </span>
          <select
            value={draft.intervalMinutes}
            onChange={(event) => {
              setDraft({ ...draft, intervalMinutes: Number(event.target.value) })
            }}
            className={inputClass}
          >
            {INTERVALS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {t(`catalogue.schedule.every.${minutes}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button type="button" onClick={save} disabled={!dirty || saving} className={buttonClass}>
        {t('catalogue.schedule.save')}
      </button>
      {error && (
        <p role="status" className="text-sm">
          {t(error)}
        </p>
      )}
    </div>
  )
}

function Tasks({ source, onChange }: { source: Source; onChange: () => void }) {
  const { t } = useTranslation('stage')
  const { moment } = useFormatters()
  const [month, setMonth] = useState('')
  const [error, setError] = useState<'catalogue.tasks.invalid' | 'catalogue.tasks.failed' | null>(
    null,
  )

  const send = (path: `/api/${string}`, method: 'POST' | 'DELETE', body?: unknown) => {
    setError(null)
    void sendApi(path, method, body).then(onChange, (failure: unknown) => {
      setError(
        failure instanceof Error && failure.message === 'invalid'
          ? 'catalogue.tasks.invalid'
          : 'catalogue.tasks.failed',
      )
    })
  }

  return (
    <div className="space-y-3">
      <h4 className="font-semibold">{t('catalogue.tasks.title')}</h4>
      <p className="text-sm text-ink-muted">{t('catalogue.tasks.hint')}</p>
      {source.tasks.length === 0 && <p className="text-sm">{t('catalogue.tasks.none')}</p>}
      <ul className="divide-y divide-line">
        {source.tasks.map((task) => (
          <li key={task.month} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
            <span className="font-medium">{task.month}</span>
            <span className="text-ink-muted">{t(`catalogue.tasks.origin.${task.origin}`)}</span>
            <span>{t('catalogue.tasks.due', { date: moment(task.dueAt) })}</span>
            {task.lastStatus && <span>{t(`catalogue.tasks.status.${task.lastStatus}`)}</span>}
            {task.failures > 0 && (
              <span>{t('catalogue.tasks.failures', { count: task.failures })}</span>
            )}
            <button
              type="button"
              className={buttonClass}
              onClick={() => {
                send(`/api/sources/${source.key}/tasks`, 'POST', { month: task.month })
              }}
            >
              {t('catalogue.tasks.soon')}
            </button>
            <button
              type="button"
              className={buttonClass}
              onClick={() => {
                send(`/api/sources/${source.key}/tasks/${task.month}`, 'DELETE')
              }}
            >
              {t('catalogue.tasks.remove')}
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-ink-muted">{t('catalogue.tasks.add')}</span>
          <input
            type="month"
            value={month}
            onChange={(event) => {
              setMonth(event.target.value)
            }}
            className={inputClass}
          />
        </label>
        <button
          type="button"
          className={buttonClass}
          disabled={month === ''}
          onClick={() => {
            send(`/api/sources/${source.key}/tasks`, 'POST', { month })
            setMonth('')
          }}
        >
          {t('catalogue.tasks.queue')}
        </button>
      </div>
      {error && (
        <p role="status" className="text-sm">
          {t(error)}
        </p>
      )}
    </div>
  )
}

function History({ source }: { source: Source }) {
  const { t } = useTranslation('stage')
  const { moment } = useFormatters()
  return (
    <div className="space-y-2">
      <h4 className="font-semibold">{t('catalogue.history')}</h4>
      {source.runs.length === 0 && <p className="text-sm">{t('catalogue.noRuns')}</p>}
      <ul className="divide-y divide-line">
        {source.runs.map((run) => (
          <li key={run.id} className="py-2 text-sm">
            <p>
              {run.month} · {t(`catalogue.run.${run.status}`)} ·{' '}
              {t(`catalogue.trigger.${run.trigger}`)} · {moment(run.startedAt)}
            </p>
            {run.count !== null && <p>{t('catalogue.imported', { count: run.count })}</p>}
            {run.errorCode && <p>{t(`catalogue.errors.${run.errorCode}`)}</p>}
            {run.log.length > 0 && (
              <details>
                <summary className="cursor-pointer text-xs text-ink-muted">
                  {t('catalogue.log.title')}
                </summary>
                <ol className="mt-1 space-y-0.5 text-xs text-ink-muted">
                  {run.log.map((line) => (
                    <li key={`${line.at}-${line.code}`}>
                      {moment(line.at)} · {t(`catalogue.log.${line.code}`, line.detail)}
                    </li>
                  ))}
                </ol>
              </details>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
