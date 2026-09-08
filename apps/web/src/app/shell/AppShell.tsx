import { useCallback, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { SearchDialog } from '@/shared/search/SearchDialog'
import { useSearchShortcut } from '@/shared/search/useSearchShortcut'

import { MobileNav } from './MobileNav'
import { SearchButton } from './SearchButton'
import { SidebarNav } from './SidebarNav'

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation('nav')
  const [searchOpen, setSearchOpen] = useState(false)

  const openSearch = useCallback(() => {
    setSearchOpen(true)
  }, [])
  const closeSearch = useCallback(() => {
    setSearchOpen(false)
  }, [])

  useSearchShortcut(openSearch)

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <a
        href="#main"
        className="sr-only rounded bg-accent px-3 py-2 text-accent-ink focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-20"
      >
        {t('skipToContent')}
      </a>

      <SidebarNav onOpenSearch={openSearch} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-line bg-raised px-4 py-2 md:hidden">
          <span className="text-base font-semibold">Allet</span>
          <div className="ml-auto w-40">
            <SearchButton onOpen={openSearch} />
          </div>
        </header>

        <main
          id="main"
          className="flex-1 px-4 py-[var(--spacing-card)] md:px-[var(--spacing-page)] md:py-[var(--spacing-page)]"
        >
          {children}
        </main>

        <MobileNav />
      </div>

      {searchOpen ? <SearchDialog onClose={closeSearch} /> : null}
    </div>
  )
}
