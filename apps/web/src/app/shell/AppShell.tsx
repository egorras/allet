import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { MobileNav } from './MobileNav'
import { SidebarNav } from './SidebarNav'

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation('nav')

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <a
        href="#main"
        className="sr-only rounded bg-accent px-3 py-2 text-accent-ink focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-20"
      >
        {t('skipToContent')}
      </a>
      <SidebarNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <main id="main" className="flex-1 px-4 py-4 md:px-8 md:py-6">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  )
}
