export interface ProductionListItem {
  id: number
  title: string
  subtitle: string | null
  imageUrl: string | null
  season: string
  category: string | null
  tags: string[]
  showCount: number
  runningTimeMinutes: number | null
}

export interface ProductionDetail {
  id: number
  title: string
  subtitle: string | null
  description: string | null
  synopsis: string | null
  guide: string | null
  imageUrl: string | null
  galleryUrls: string[]
  sourceUrl: string | null
  season: string
  category: string | null
  tags: string[]
  runningTimeMinutes: number | null
  source: string
  createdAt: string
  shows: ShowDto[]
}

export interface ShowDto {
  id: number
  title: string
  date: string | null
  venueName: string | null
  url: string | null
  isRehearsal: boolean
  productionId: number | null
  productionTitle: string | null
}

export interface FiltersDto {
  seasons: string[]
  categories: string[]
}

export interface CalendarDay {
  date: string
  shows: ShowDto[]
}
