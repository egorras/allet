import { describe, expect, it } from 'vitest'

import {
  playbillFilterKeys,
  playbillSearchSchema,
  watchlistSearchSchema,
} from '@/modules/stage/filters'
import { plansSearchSchema } from '@/shared/filters/plans'
import { countActiveFilters } from '@/shared/filters/schema'

describe('list filters', () => {
  it('keeps valid values', () => {
    expect(
      playbillSearchSchema.parse({ q: 'tosca', city: 'Budapest', from: '2026-10-01' }),
    ).toEqual({
      q: 'tosca',
      city: 'Budapest',
      from: '2026-10-01',
    })
  })

  it('drops a malformed address instead of failing the page', () => {
    expect(playbillSearchSchema.parse({ from: 'yesterday' })).toEqual({})
    expect(playbillSearchSchema.parse({ q: '' })).toEqual({})
    expect(watchlistSearchSchema.parse({ status: 'bought' })).toEqual({})
    expect(plansSearchSchema.parse({ participation: 'everyone' })).toEqual({})
  })

  it('ignores parameters it does not know', () => {
    expect(playbillSearchSchema.parse({ q: 'aida', unknown: 'x' })).toEqual({ q: 'aida' })
  })

  it('counts only filters that are actually set', () => {
    expect(countActiveFilters({}, playbillFilterKeys)).toBe(0)
    expect(countActiveFilters({ q: undefined, city: '' }, playbillFilterKeys)).toBe(0)
    expect(countActiveFilters({ q: 'aida', city: 'Wien' }, playbillFilterKeys)).toBe(2)
  })

  it('ignores address parameters the list does not filter by', () => {
    expect(countActiveFilters({ utm_source: 'mail' }, playbillFilterKeys)).toBe(0)
  })
})
