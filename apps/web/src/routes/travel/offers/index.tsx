import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { offersFilterKeys, offersSearchSchema, type OffersSearch } from '@/modules/travel/filters'
import { FilterPanel } from '@/shared/filters/FilterPanel'
import { DateFilterField, TextFilterField } from '@/shared/filters/fields'
import { countActiveFilters } from '@/shared/filters/schema'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'

export const Route = createFileRoute('/travel/offers/')({
  validateSearch: (search: Record<string, unknown>): OffersSearch =>
    offersSearchSchema.parse(search),
  component: TravelOffersPage,
})

function TravelOffersPage() {
  const { t } = useTranslation('travel')
  const { t: tFilters } = useTranslation('filters')
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const setFilter = (patch: OffersSearch, replace = false) => {
    void navigate({ search: (previous) => ({ ...previous, ...patch }), replace })
  }

  return (
    <>
      <PageHeader title={t('offers.title')} description={t('offers.description')} />
      <FilterPanel
        activeCount={countActiveFilters(search, offersFilterKeys)}
        onClear={() => {
          void navigate({ search: {} })
        }}
      >
        <TextFilterField
          label={tFilters('query')}
          placeholder={tFilters('queryPlaceholder')}
          value={search.q}
          onChange={(q) => {
            setFilter({ q }, true)
          }}
        />
        <DateFilterField
          label={tFilters('from')}
          value={search.from}
          onChange={(from) => {
            setFilter({ from })
          }}
        />
        <DateFilterField
          label={tFilters('to')}
          value={search.to}
          onChange={(to) => {
            setFilter({ to })
          }}
        />
      </FilterPanel>
      <EmptyState description={t('offers.empty')} />
    </>
  )
}
