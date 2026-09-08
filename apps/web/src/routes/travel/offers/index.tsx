import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'

export const Route = createFileRoute('/travel/offers/')({ component: TravelOffersPage })

function TravelOffersPage() {
  const { t } = useTranslation('travel')

  return (
    <>
      <PageHeader title={t('offers.title')} description={t('offers.description')} />
      <EmptyState description={t('offers.empty')} />
    </>
  )
}
