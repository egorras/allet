import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { coreSections } from '@/modules/registry'
import type { NavSection } from '@/modules/types'
import { useVisibleSections } from '@/shared/nav/useVisibleSections'
import { Modal } from '@/shared/ui/Modal'
import { MoreIcon } from '@/shared/ui/icons'

import { LanguageSwitcher } from './LanguageSwitcher'
import { NavLink } from './NavLink'

/** Home, Calendar, Plans and "More" — the phone layout from ALLET_PLAN.md §3. */
const TAB_SECTION_IDS = ['home', 'calendar', 'plans']

function MoreSection({ section, onNavigate }: { section: NavSection; onNavigate: () => void }) {
  const { t } = useTranslation('nav')
  const Icon = section.icon

  return (
    <div className="mt-3 first:mt-0">
      <p className="flex items-center gap-2 px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        <Icon className="shrink-0" width="16" height="16" />
        {t(section.labelKey)}
      </p>
      {section.pages.map((page) => (
        <NavLink key={page.path} page={page} onNavigate={onNavigate} />
      ))}
    </div>
  )
}

export function MobileNav() {
  const { t } = useTranslation('nav')
  const { modules, settings } = useVisibleSections()
  const [moreOpen, setMoreOpen] = useState(false)

  const tabs = coreSections.filter((section) => TAB_SECTION_IDS.includes(section.id))
  // Core sections hold a single page, so they belong in the sheet as plain links;
  // only modules and settings are shown as groups.
  const moreLinks = coreSections.filter((section) => !TAB_SECTION_IDS.includes(section.id))
  const moreSections = [...modules, settings]

  return (
    <>
      <nav
        aria-label={t('primary')}
        className="sticky bottom-0 z-10 flex border-t border-line bg-raised md:hidden"
      >
        {tabs.map((section) => {
          const page = section.pages[0]
          if (!page) return null
          const Icon = section.icon
          return (
            <Link
              key={section.id}
              to={page.path}
              activeOptions={{ exact: page.path === '/' }}
              activeProps={{ 'aria-current': 'page', className: 'text-accent' }}
              inactiveProps={{ className: 'text-ink-muted' }}
              className="flex flex-1 flex-col items-center gap-0.5 px-2 py-2 text-xs"
            >
              <Icon />
              <span>{t(section.labelKey)}</span>
            </Link>
          )
        })}
        <button
          type="button"
          onClick={() => {
            setMoreOpen(true)
          }}
          aria-label={t('openMore')}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          className="flex flex-1 flex-col items-center gap-0.5 px-2 py-2 text-xs text-ink-muted"
        >
          <MoreIcon />
          <span>{t('more')}</span>
        </button>
      </nav>

      <Modal
        open={moreOpen}
        onClose={() => {
          setMoreOpen(false)
        }}
        title={t('moreTitle')}
        variant="sheet"
      >
        {moreLinks.map((section) =>
          section.pages.map((page) => (
            <NavLink
              key={page.path}
              page={page}
              icon={section.icon}
              onNavigate={() => {
                setMoreOpen(false)
              }}
            />
          )),
        )}
        {moreSections.map((section) => (
          <MoreSection
            key={section.id}
            section={section}
            onNavigate={() => {
              setMoreOpen(false)
            }}
          />
        ))}
        <div className="mt-4 border-t border-line pt-3">
          <LanguageSwitcher />
        </div>
      </Modal>
    </>
  )
}
