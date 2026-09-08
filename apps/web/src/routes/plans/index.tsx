import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/shared/ui/EmptyState'
import { NotConnectedAction } from '@/shared/ui/NotConnected'
import { PageHeader } from '@/shared/ui/PageHeader'

export const Route = createFileRoute('/plans/')({ component: PlansPage })

function PlansPage() {
  const { t } = useTranslation('plans')

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={<NotConnectedAction label={t('new')} />}
      />
      <EmptyState description={t('empty')} />
    </>
  )
}
