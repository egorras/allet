import { useTranslation } from 'react-i18next'

import type { NavSection } from '@/modules/types'
import { useVisibleSections } from '@/shared/nav/useVisibleSections'

import { LanguageSwitcher } from './LanguageSwitcher'
import { NavLink } from './NavLink'
import { SearchButton } from './SearchButton'

function SectionGroup({ section }: { section: NavSection }) {
  const { t } = useTranslation('nav')
  const Icon = section.icon

  return (
    <div className="mt-4">
      <p className="flex items-center gap-2 px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        <Icon className="shrink-0" width="16" height="16" />
        {t(section.labelKey)}
      </p>
      {section.pages.map((page) => (
        <NavLink key={page.path} page={page} />
      ))}
    </div>
  )
}

export function SidebarNav({ onOpenSearch }: { onOpenSearch: () => void }) {
  const { t } = useTranslation('nav')
  const { core, modules, settings } = useVisibleSections()

  return (
    <nav
      aria-label={t('primary')}
      className="hidden shrink-0 border-r border-line bg-raised md:flex md:w-60 md:flex-col md:overflow-y-auto"
    >
      <div className="px-3 py-3">
        <div className="px-2 pb-2 text-base font-semibold">Allet</div>
        <div className="pb-2">
          <SearchButton onOpen={onOpenSearch} />
        </div>
        {core.map((section) =>
          section.pages.map((page) => <NavLink key={page.path} page={page} icon={section.icon} />),
        )}
        {modules.map((section) => (
          <SectionGroup key={section.id} section={section} />
        ))}
        <SectionGroup section={settings} />
      </div>
      <div className="mt-auto border-t border-line p-3">
        <LanguageSwitcher />
      </div>
    </nav>
  )
}
