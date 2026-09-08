import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { DetailShell } from '@/shared/ui/DetailShell'
import { EmptyState } from '@/shared/ui/EmptyState'
import { MapPlaceholder } from '@/shared/ui/MapPlaceholder'
import { RelatedPanel } from '@/shared/ui/RelatedPanel'
import { Section } from '@/shared/ui/Section'

export const Route = createFileRoute('/travel/offers/$offerId')({ component: OfferDetailPage })

function OfferDetailPage() {
  const { offerId } = Route.useParams()
  const { t } = useTranslation('travel')
  const { t: tCommon } = useTranslation()

  return (
    <DetailShell
      title={t('offer.title')}
      description={t('offer.id', { id: offerId })}
      aside={
        <>
          <MapPlaceholder />
          <RelatedPanel />
        </>
      }
    >
      {(['route', 'window', 'price', 'conditions'] as const).map((key) => (
        <Section key={key} title={t(`offer.${key}`)}>
          <EmptyState description={tCommon('empty.noData')} />
        </Section>
      ))}
    </DetailShell>
  )
}
