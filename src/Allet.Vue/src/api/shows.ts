import { get } from './client'
import type { ShowDto } from '../types'

export function fetchShows(params: {
  year?: string
  month?: string
  productionId?: string
}) {
  return get<ShowDto[]>('/shows', params as Record<string, string>)
}

export function fetchShowTags() {
  return get<string[]>('/shows/tags')
}
