import { get } from './client'
import type { ProductionListItem, ProductionDetail, FiltersDto } from '../types'

export function fetchProductions(params: {
  search?: string
  season?: string
  category?: string
  sort?: string
}) {
  return get<ProductionListItem[]>('/productions', params as Record<string, string>)
}

export function fetchProductionFilters() {
  return get<FiltersDto>('/productions/filters')
}

export function fetchProduction(id: number) {
  return get<ProductionDetail>(`/productions/${id}`)
}
