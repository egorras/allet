import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { playbillSearchSchema, type PlaybillSearch } from '@/modules/stage/filters'
import { FilterPanel } from '@/shared/filters/FilterPanel'
import { DateFilterField, TextFilterField } from '@/shared/filters/fields'
import { countActiveFilters } from '@/shared/filters/schema'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'

export const Route = createFileRoute('/stage/playbill')({
  validateSearch: (search: Record<string, unknown>): PlaybillSearch =>
    playbillSearchSchema.parse(search),
  component: PlaybillPage,
})

function PlaybillPage() {
  const { t } = useTranslation('stage')
  const { t: tFilters } = useTranslation('filters')
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const setFilter = (patch: PlaybillSearch) => {
    void navigate({ search: (previous) => ({ ...previous, ...patch }) })
  }

  return (
    <>
      <PageHeader title={t('playbill.title')} description={t('playbill.description')} />
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
            setFilter({ q })
          }}
        />
        <TextFilterField
          label={tFilters('city')}
          value={search.city}
          onChange={(city) => {
            setFilter({ city })
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
      <EmptyState description={t('playbill.empty')} />
    </>
  )
}
