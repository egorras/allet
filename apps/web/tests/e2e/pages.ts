/** Every address v0 answers, including the detail templates. */
export const STATIC_PAGES = [
  '/',
  '/calendar',
  '/inbox',
  '/plans',
  '/stage/playbill',
  '/stage/watchlist',
  '/stage/works',
  '/stage/visits',
  '/travel/offers',
  '/travel/saved',
  '/settings/household',
  '/settings/modules',
  '/settings/notifications',
  '/settings/profile',
] as const

export const DETAIL_PAGES = [
  '/plans/example-plan',
  '/stage/works/example-work',
  '/stage/productions/example-production',
  '/travel/offers/example-offer',
] as const

export const ALL_PAGES = [...STATIC_PAGES, ...DETAIL_PAGES]
