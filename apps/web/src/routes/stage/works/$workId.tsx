import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { DetailShell } from '@/shared/ui/DetailShell'
import { EmptyState } from '@/shared/ui/EmptyState'
import { RelatedPanel } from '@/shared/ui/RelatedPanel'
import { Section } from '@/shared/ui/Section'

export const Route = createFileRoute('/stage/works/$workId')({ component: WorkDetailPage })

function WorkDetailPage() {
  const { workId } = Route.useParams()
  const { t } = useTranslation('stage')
  const { t: tCommon } = useTranslation()

  return (
    <DetailShell
      title={t('work.title')}
      description={t('work.id', { id: workId })}
      aside={<RelatedPanel />}
    >
      {(['synopsis', 'libretto', 'recordings', 'productions'] as const).map((key) => (
        <Section key={key} title={t(`work.${key}`)}>
          <EmptyState description={tCommon('empty.noData')} />
        </Section>
      ))}
    </DetailShell>
  )
}
