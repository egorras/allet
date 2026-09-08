import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { modules } from '@/modules/registry'
import { setModuleHidden, useHiddenModules } from '@/shared/prefs/moduleVisibility'
import { Sources } from '@/modules/stage/Sources'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Section } from '@/shared/ui/Section'

export const Route = createFileRoute('/settings/modules')({ component: ModulesPage })

function ModulesPage() {
  const { t } = useTranslation('settings')
  const { t: tNav } = useTranslation('nav')
  const hidden = useHiddenModules()

  return (
    <>
      <PageHeader title={t('modules.title')} description={t('modules.description')} />
      <Section title={t('modules.visibility')} description={t('modules.hint')}>
        <ul>
          {modules.map((module) => (
            <li key={module.id} className="py-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!hidden.includes(module.id)}
                  onChange={(event) => {
                    setModuleHidden(module.id, !event.target.checked)
                  }}
                />
                {tNav(module.labelKey)}
              </label>
            </li>
          ))}
        </ul>
      </Section>
      <Section title={t('modules.sources')}>
        <Sources />
      </Section>
    </>
  )
}
