import type navEn from '@/i18n/locales/en/nav.json'
import type { IconComponent } from '@/shared/ui/icons'

/** Keys of the `nav` translation namespace — a typo in a label is a type error. */
export type NavLabelKey = keyof typeof navEn

export interface NavPage {
  /** Must match a route defined under src/routes (checked by a unit test). */
  path: string
  labelKey: NavLabelKey
  /** Offered by the Ctrl/Cmd+K dialog, which in v0 searches app pages only. */
  searchable: boolean
}

export interface NavSection {
  id: string
  labelKey: NavLabelKey
  icon: IconComponent
  pages: NavPage[]
}

/**
 * A feature module registers itself here and nowhere else: navigation, page search
 * and the "hide module" preference all read this registry (ALLET_PLAN.md §5).
 * The registry is static and typed — modules ship with the app, they are not plugins.
 */
export interface AppModule extends NavSection {
  id: ModuleId
}

export const moduleIds = ['stage', 'travel'] as const
export type ModuleId = (typeof moduleIds)[number]

export function isModuleId(value: unknown): value is ModuleId {
  return typeof value === 'string' && (moduleIds as readonly string[]).includes(value)
}
