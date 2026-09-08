import { useId } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * An action that cannot work yet. It is visibly disabled and states why, rather than
 * simulating a successful save (ALLET_PLAN.md §8).
 */
export function NotConnectedAction({
  label,
  reason,
}: {
  label: string
  reason?: string | undefined
}) {
  const { t } = useTranslation()
  const reasonId = useId()
  const text = reason ?? t('notConnected.reason')

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        disabled
        aria-describedby={reasonId}
        className="cursor-not-allowed rounded border border-line bg-sunken px-3 py-1.5 text-sm text-ink-muted"
      >
        {label}
      </button>
      <span id={reasonId} className="text-xs text-ink-muted">
        {text}
      </span>
    </span>
  )
}
