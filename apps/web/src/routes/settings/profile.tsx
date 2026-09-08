import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { LanguageSwitcher } from '@/app/shell/LanguageSwitcher'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Section } from '@/shared/ui/Section'

export const Route = createFileRoute('/settings/profile')({ component: ProfilePage })

function ProfilePage() {
  const { t } = useTranslation('settings')

  return (
    <>
      <PageHeader title={t('profile.title')} description={t('profile.description')} />
      <Section title={t('profile.account')}>
        <EmptyState description={t('profile.accountEmpty')} />
      </Section>
      <Section title={t('profile.preferences')}>
        <LanguageSwitcher />
      </Section>
    </>
  )
}
