import { TravelIcon } from '@/shared/ui/icons'

import type { AppModule } from '../types'

export const travelModule: AppModule = {
  id: 'travel',
  labelKey: 'travel',
  icon: TravelIcon,
  pages: [
    { path: '/travel/offers', labelKey: 'travelOffers', searchable: true },
    { path: '/travel/saved', labelKey: 'travelSaved', searchable: true },
  ],
}
