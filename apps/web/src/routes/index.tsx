import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Section } from '@/shared/ui/Section'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  const { t } = useTranslation('home')

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title={t('changes.title')}>
          <EmptyState description={t('changes.empty')} />
        </Section>
        <Section title={t('availability.title')}>
          <EmptyState description={t('availability.empty')} />
        </Section>
        <Section title={t('plans.title')}>
          <EmptyState description={t('plans.empty')} />
        </Section>
        <Section title={t('offers.title')}>
          <EmptyState description={t('offers.empty')} />
        </Section>
      </div>
    </>
  )
}
