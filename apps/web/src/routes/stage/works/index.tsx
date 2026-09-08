import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'

export const Route = createFileRoute('/stage/works/')({ component: WorksPage })

function WorksPage() {
  const { t } = useTranslation('stage')

  return (
    <>
      <PageHeader title={t('works.title')} description={t('works.description')} />
      <EmptyState description={t('works.empty')} />
    </>
  )
}
