import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { LanguageSwitcher } from '@/app/shell/LanguageSwitcher'
import { densities, setDensity, useDensity } from '@/shared/prefs/density'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Section } from '@/shared/ui/Section'

export const Route = createFileRoute('/settings/profile')({ component: ProfilePage })

function ProfilePage() {
  const { t } = useTranslation('settings')
  const density = useDensity()

  return (
    <>
      <PageHeader title={t('profile.title')} description={t('profile.description')} />
      <Section title={t('profile.account')}>
        <EmptyState description={t('profile.accountEmpty')} />
      </Section>
      <Section title={t('profile.preferences')}>
        <LanguageSwitcher />
        <fieldset className="mt-4 border-0 p-0">
          <legend className="text-xs font-medium text-ink-muted">
            {t('profile.density.label')}
          </legend>
          {densities.map((option) => (
            <label key={option} className="mr-4 mt-1 inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="density"
                value={option}
                checked={density === option}
                onChange={() => {
                  setDensity(option)
                }}
              />
              {t(`profile.density.${option}`)}
            </label>
          ))}
          <p className="mt-1 text-xs text-ink-muted">{t('profile.density.hint')}</p>
        </fieldset>
      </Section>
    </>
  )
}
