import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'

export const Route = createFileRoute('/stage/playbill')({ component: PlaybillPage })

function PlaybillPage() {
  const { t } = useTranslation('stage')

  return (
    <>
      <PageHeader title={t('playbill.title')} description={t('playbill.description')} />
      <EmptyState description={t('playbill.empty')} />
    </>
  )
}
