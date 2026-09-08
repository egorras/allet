import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { DetailShell } from '@/shared/ui/DetailShell'
import { EmptyState } from '@/shared/ui/EmptyState'
import { RelatedPanel } from '@/shared/ui/RelatedPanel'
import { Section } from '@/shared/ui/Section'

export const Route = createFileRoute('/plans/$planId')({ component: PlanDetailPage })

function PlanDetailPage() {
  const { planId } = Route.useParams()
  const { t } = useTranslation('plans')
  const { t: tCommon } = useTranslation()

  return (
    <DetailShell
      title={t('detail.title')}
      description={t('detail.id', { id: planId })}
      aside={<RelatedPanel />}
    >
      {(['participants', 'dates', 'items', 'notes'] as const).map((key) => (
        <Section key={key} title={t(`detail.${key}`)}>
          <EmptyState description={tCommon('empty.noData')} />
        </Section>
      ))}
    </DetailShell>
  )
}
