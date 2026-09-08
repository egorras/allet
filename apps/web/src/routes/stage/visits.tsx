import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'

export const Route = createFileRoute('/stage/visits')({ component: VisitsPage })

function VisitsPage() {
  const { t } = useTranslation('stage')

  return (
    <>
      <PageHeader title={t('visits.title')} description={t('visits.description')} />
      <EmptyState description={t('visits.empty')} />
    </>
  )
}
