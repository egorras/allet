import { useTranslation } from 'react-i18next'

import { SearchIcon } from '@/shared/ui/icons'

export function SearchButton({ onOpen }: { onOpen: () => void }) {
  const { t } = useTranslation('search')

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      className="flex w-full items-center gap-2 rounded border border-line px-2 py-1.5 text-sm text-ink-muted hover:bg-sunken hover:text-ink"
    >
      <SearchIcon />
      <span className="truncate">{t('open')}</span>
      <span aria-hidden="true" className="ml-auto hidden text-xs md:inline">
        {t('shortcutHint')}
      </span>
    </button>
  )
}
