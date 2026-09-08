import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { watchlistSearchSchema, type WatchlistSearch } from '@/modules/stage/filters'
import { FilterPanel } from '@/shared/filters/FilterPanel'
import { SelectFilterField, TextFilterField } from '@/shared/filters/fields'
import { countActiveFilters } from '@/shared/filters/schema'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'

export const Route = createFileRoute('/stage/watchlist')({
  validateSearch: (search: Record<string, unknown>): WatchlistSearch =>
    watchlistSearchSchema.parse(search),
  component: WatchlistPage,
})

function WatchlistPage() {
  const { t } = useTranslation('stage')
  const { t: tFilters } = useTranslation('filters')
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  return (
    <>
      <PageHeader title={t('watchlist.title')} description={t('watchlist.description')} />
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
          label={tFilters('status.label')}
          neutralLabel={tFilters('status.all')}
          value={search.status}
          options={[
            { value: 'watching', label: tFilters('status.watching') },
            { value: 'paused', label: tFilters('status.paused') },
          ]}
          onChange={(value) => {
            const status = value === 'watching' || value === 'paused' ? value : undefined
            void navigate({ search: (previous) => ({ ...previous, status }) })
          }}
        />
      </FilterPanel>
      <EmptyState description={t('watchlist.empty')} />
    </>
  )
}
