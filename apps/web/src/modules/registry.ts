import { CalendarIcon, HomeIcon, InboxIcon, PlansIcon, SettingsIcon } from '@/shared/ui/icons'

import { stageModule } from './stage/module'
import { travelModule } from './travel/module'
import type { AppModule, NavPage, NavSection } from './types'

/** Sections that are part of the shell itself and cannot be hidden. */
export const coreSections: NavSection[] = [
  {
    id: 'home',
    labelKey: 'home',
    icon: HomeIcon,
    pages: [{ path: '/', labelKey: 'home', searchable: true }],
  },
  {
    id: 'calendar',
    labelKey: 'calendar',
    icon: CalendarIcon,
    pages: [{ path: '/calendar', labelKey: 'calendar', searchable: true }],
  },
  {
    id: 'inbox',
    labelKey: 'inbox',
    icon: InboxIcon,
    pages: [{ path: '/inbox', labelKey: 'inbox', searchable: true }],
  },
  {
    id: 'plans',
    labelKey: 'plans',
    icon: PlansIcon,
    pages: [{ path: '/plans', labelKey: 'plans', searchable: true }],
  },
]

export const modules: AppModule[] = [stageModule, travelModule]

export const settingsSection: NavSection = {
  id: 'settings',
  labelKey: 'settings',
  icon: SettingsIcon,
  pages: [
    { path: '/settings/household', labelKey: 'settingsHousehold', searchable: true },
    { path: '/settings/modules', labelKey: 'settingsModules', searchable: true },
    { path: '/settings/notifications', labelKey: 'settingsNotifications', searchable: true },
    { path: '/settings/profile', labelKey: 'settingsProfile', searchable: true },
  ],
}

export const allSections: NavSection[] = [...coreSections, ...modules, settingsSection]

export function allPages(): NavPage[] {
  return allSections.flatMap((section) => section.pages)
}
