import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { FilterPanel } from '@/shared/filters/FilterPanel'
import { SelectFilterField, TextFilterField } from '@/shared/filters/fields'
import { plansSearchSchema, type PlansSearch } from '@/shared/filters/plans'
import { countActiveFilters } from '@/shared/filters/schema'
import { EmptyState } from '@/shared/ui/EmptyState'
import { NotConnectedAction } from '@/shared/ui/NotConnected'
import { PageHeader } from '@/shared/ui/PageHeader'

export const Route = createFileRoute('/plans/')({
  validateSearch: (search: Record<string, unknown>): PlansSearch => plansSearchSchema.parse(search),
  component: PlansPage,
})

function PlansPage() {
  const { t } = useTranslation('plans')
  const { t: tFilters } = useTranslation('filters')
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={<NotConnectedAction label={t('new')} />}
      />
      <FilterPanel
        activeCount={countActiveFilters(search)}
        onClear={() => {
          void navigate({ search: {} })
        }}
      >
        <TextFilterField
          label={tFilters('query')}
          placeholder={tFilters('queryPlaceholder')}
          value={search.q}
          onChange={(q) => {
            void navigate({ search: (previous) => ({ ...previous, q }) })
          }}
        />
        <SelectFilterField
          label={tFilters('participation.label')}
          neutralLabel={tFilters('participation.all')}
          value={search.participation}
          options={[{ value: 'mine', label: tFilters('participation.mine') }]}
          onChange={(value) => {
            const participation = value === 'mine' ? value : undefined
            void navigate({ search: (previous) => ({ ...previous, participation }) })
          }}
        />
      </FilterPanel>
      <EmptyState description={t('empty')} />
    </>
  )
}
