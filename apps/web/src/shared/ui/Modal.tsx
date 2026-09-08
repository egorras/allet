import { useEffect, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { CloseIcon } from './icons'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  /** 'sheet' slides up from the bottom edge (mobile navigation), 'center' is a dialog. */
  variant?: 'sheet' | 'center' | undefined
  children: ReactNode
}

/**
 * Built on <dialog>, so Escape, focus containment and returning focus to the trigger
 * are handled by the browser instead of by hand.
 */
export function Modal({ open, onClose, title, variant = 'center', children }: ModalProps) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    /* The click handler only closes the dialog when the backdrop itself is clicked.
       The keyboard equivalent is Escape, which <dialog> handles natively. */
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
      className={
        variant === 'sheet'
          ? 'm-0 mt-auto w-full max-w-full rounded-t-card bg-raised p-0 text-ink backdrop:bg-black/40'
          : 'm-auto w-[min(36rem,calc(100vw-2rem))] rounded-card bg-raised p-0 text-ink backdrop:bg-black/40'
      }
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('actions.close')}
          className="rounded p-1 text-ink-muted hover:bg-sunken hover:text-ink"
        >
          <CloseIcon />
        </button>
      </div>
      <div className="p-4">{children}</div>
    </dialog>
  )
}
