import { StageIcon } from '@/shared/ui/icons'

import type { AppModule } from '../types'

export const stageModule: AppModule = {
  id: 'stage',
  labelKey: 'stage',
  icon: StageIcon,
  pages: [
    { path: '/stage/playbill', labelKey: 'stagePlaybill', searchable: true },
    { path: '/stage/watchlist', labelKey: 'stageWatchlist', searchable: true },
    { path: '/stage/works', labelKey: 'stageWorks', searchable: true },
    { path: '/stage/visits', labelKey: 'stageVisits', searchable: true },
  ],
}
