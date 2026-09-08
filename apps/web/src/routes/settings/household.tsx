import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/shared/ui/EmptyState'
import { NotConnectedAction } from '@/shared/ui/NotConnected'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Section } from '@/shared/ui/Section'

export const Route = createFileRoute('/settings/household')({ component: HouseholdPage })

function HouseholdPage() {
  const { t } = useTranslation('settings')

  return (
    <>
      <PageHeader title={t('household.title')} description={t('household.description')} />
      <Section title={t('household.members')}>
        <EmptyState description={t('household.empty')} />
        <div className="mt-3">
          <NotConnectedAction label={t('household.invite')} />
        </div>
      </Section>
    </>
  )
}
