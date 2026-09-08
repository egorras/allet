import { useTranslation } from 'react-i18next'

import { EmptyState } from './EmptyState'
import { Section } from './Section'

/** Typed links between records exist from v0.1 on; here the area is honestly empty. */
export function RelatedPanel() {
  const { t } = useTranslation()
  return (
    <Section title={t('related.title')}>
      <EmptyState description={t('related.empty')} />
    </Section>
  )
}
