import { useTranslation } from 'react-i18next'

import { EmptyState } from './EmptyState'
import { Section } from './Section'

/** No map provider is chosen yet and v0 makes no external request (ALLET_PLAN.md §6, §8). */
export function MapPlaceholder() {
  const { t } = useTranslation()
  return (
    <Section title={t('map.title')}>
      <EmptyState description={t('map.empty')} />
    </Section>
  )
}
