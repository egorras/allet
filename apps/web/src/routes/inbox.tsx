import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'

export const Route = createFileRoute('/inbox')({ component: InboxPage })

function InboxPage() {
  const { t } = useTranslation('inbox')

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <EmptyState description={t('empty')} />
    </>
  )
}
