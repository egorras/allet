import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { catalogueSchema } from '@allet/contracts'
import { useApi } from '@/shared/api/useApi'
import { PerformanceList } from '@/modules/stage/PerformanceList'

import {
  playbillFilterKeys,
  playbillSearchSchema,
  type PlaybillSearch,
} from '@/modules/stage/filters'
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
  const catalogue = useApi('/api/performances', catalogueSchema)
  const filtered =
    catalogue.status === 'ready'
      ? catalogue.data.performances.filter(
          (performance) =>
            (!search.q ||
              `${performance.title} ${performance.composer ?? ''}`
                .toLocaleLowerCase()
                .includes(search.q.toLocaleLowerCase())) &&
            (!search.city ||
              performance.city.toLocaleLowerCase().includes(search.city.toLocaleLowerCase())) &&
            (!search.from || performance.date >= search.from) &&
            (!search.to || performance.date <= search.to),
        )
      : []
  const navigate = useNavigate({ from: Route.fullPath })

  const setFilter = (patch: PlaybillSearch, replace = false) => {
    void navigate({ search: (previous) => ({ ...previous, ...patch }), replace })
  }

  return (
    <>
      <PageHeader title={t('playbill.title')} description={t('playbill.description')} />
      <FilterPanel
        activeCount={countActiveFilters(search, playbillFilterKeys)}
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
        <TextFilterField
          label={tFilters('city')}
          value={search.city}
          onChange={(city) => {
            setFilter({ city }, true)
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
      {catalogue.status === 'loading' && <p role="status">{t('catalogue.loading')}</p>}
      {catalogue.status === 'error' && <p role="status">{t('catalogue.unavailable')}</p>}
      {catalogue.status === 'ready' &&
        (filtered.length ? (
          <PerformanceList performances={filtered} />
        ) : (
          <EmptyState
            description={t(
              catalogue.data.performances.length ? 'catalogue.noMatches' : 'playbill.empty',
            )}
          />
        ))}
    </>
  )
}
