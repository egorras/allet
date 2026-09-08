import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { productionSchema } from '@allet/contracts'
import { useApi } from '@/shared/api/useApi'
import { PerformanceList } from '@/modules/stage/PerformanceList'
import { DetailShell } from '@/shared/ui/DetailShell'
import { Section } from '@/shared/ui/Section'

export const Route = createFileRoute('/stage/productions/$productionId')({
  component: ProductionDetailPage,
})

function ProductionDetailPage() {
  const { productionId } = Route.useParams()
  const { t } = useTranslation('stage')
  const result = useApi(`/api/productions/${encodeURIComponent(productionId)}`, productionSchema)
  return (
    <DetailShell
      title={result.status === 'ready' ? result.data.title : t('production.title')}
      description={
        result.status === 'ready'
          ? (result.data.composer ?? '')
          : t('production.id', { id: productionId })
      }
    >
      {result.status === 'loading' && <p role="status">{t('catalogue.loading')}</p>}
      {result.status === 'error' && (
        <p role="status">
          {t(result.message === 'notFound' ? 'catalogue.notFound' : 'catalogue.unavailable')}
        </p>
      )}
      {result.status === 'ready' && (
        <>
          <Section title={t('production.performances')}>
            <PerformanceList performances={result.data.performances} />
          </Section>
          <Section title={t('production.availability')}>
            <p>{t('catalogue.noAvailability')}</p>
          </Section>
        </>
      )}
    </DetailShell>
  )
}
