import { coreSections, modules, settingsSection } from '@/modules/registry'
import type { NavSection } from '@/modules/types'
import { useHiddenModules } from '@/shared/prefs/moduleVisibility'

/** Navigation as the user currently sees it: core sections, visible modules, settings. */
export function useVisibleSections(): {
  core: NavSection[]
  modules: NavSection[]
  settings: NavSection
} {
  const hidden = useHiddenModules()
  return {
    core: coreSections,
    modules: modules.filter((module) => !hidden.includes(module.id)),
    settings: settingsSection,
  }
}
