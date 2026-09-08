import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { DetailShell } from '@/shared/ui/DetailShell'
import { EmptyState } from '@/shared/ui/EmptyState'
import { MapPlaceholder } from '@/shared/ui/MapPlaceholder'
import { RelatedPanel } from '@/shared/ui/RelatedPanel'
import { Section } from '@/shared/ui/Section'

export const Route = createFileRoute('/stage/productions/$productionId')({
  component: ProductionDetailPage,
})

function ProductionDetailPage() {
  const { productionId } = Route.useParams()
  const { t } = useTranslation('stage')
  const { t: tCommon } = useTranslation()

  return (
    <DetailShell
      title={t('production.title')}
      description={t('production.id', { id: productionId })}
      aside={
        <>
          <MapPlaceholder />
          <RelatedPanel />
        </>
      }
    >
      {(['performances', 'venue', 'availability', 'notes'] as const).map((key) => (
        <Section key={key} title={t(`production.${key}`)}>
          <EmptyState description={tCommon('empty.noData')} />
        </Section>
      ))}
    </DetailShell>
  )
}
