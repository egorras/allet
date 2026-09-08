import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'

export const Route = createFileRoute('/travel/saved')({ component: TravelSavedPage })

function TravelSavedPage() {
  const { t } = useTranslation('travel')

  return (
    <>
      <PageHeader title={t('saved.title')} description={t('saved.description')} />
      <EmptyState description={t('saved.empty')} />
    </>
  )
}
