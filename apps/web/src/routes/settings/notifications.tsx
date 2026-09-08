import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Section } from '@/shared/ui/Section'

export const Route = createFileRoute('/settings/notifications')({ component: NotificationsPage })

function NotificationsPage() {
  const { t } = useTranslation('settings')

  return (
    <>
      <PageHeader title={t('notifications.title')} description={t('notifications.description')} />
      <Section title={t('notifications.channels')}>
        <EmptyState description={t('notifications.empty')} />
      </Section>
    </>
  )
}
