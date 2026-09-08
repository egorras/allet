import { useTranslation } from 'react-i18next'

interface FilterPanelProps {
  activeCount: number
  onClear: () => void
  children: React.ReactNode
}

/** Filter state lives in the URL, so reload and back/forward restore it (ALLET_PLAN.md §6). */
export function FilterPanel({ activeCount, onClear, children }: FilterPanelProps) {
  const { t } = useTranslation('filters')

  return (
    <section aria-label={t('title')} className="mb-4 rounded-card border border-line bg-raised p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p aria-live="polite" className="text-sm text-ink-muted">
          {activeCount === 0 ? t('none') : t('active', { count: activeCount })}
        </p>
        <button
          type="button"
          onClick={onClear}
          disabled={activeCount === 0}
          className="rounded border border-line px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:text-ink-muted"
        >
          {t('clearAll')}
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
      <p className="mt-3 text-xs text-ink-muted">{t('note')}</p>
    </section>
  )
}
