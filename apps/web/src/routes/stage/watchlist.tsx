import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'

export const Route = createFileRoute('/stage/watchlist')({ component: WatchlistPage })

function WatchlistPage() {
  const { t } = useTranslation('stage')

  return (
    <>
      <PageHeader title={t('watchlist.title')} description={t('watchlist.description')} />
      <EmptyState description={t('watchlist.empty')} />
    </>
  )
}
