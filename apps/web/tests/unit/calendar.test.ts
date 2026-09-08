import { describe, expect, it } from 'vitest'

import {
  addMonths,
  currentMonth,
  formatMonth,
  monthGridDays,
  parseMonth,
} from '@/shared/calendar/month'

describe('calendar months', () => {
  it('parses and formats a month', () => {
    expect(parseMonth('2026-09')).toEqual({ year: 2026, month: 9 })
    expect(parseMonth('2026-13')).toBeNull()
    expect(parseMonth('september')).toBeNull()
    expect(parseMonth(undefined)).toBeNull()
    expect(formatMonth({ year: 2026, month: 9 })).toBe('2026-09')
  })

  it('crosses year boundaries in both directions', () => {
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 })
    expect(addMonths({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 })
    expect(addMonths({ year: 2026, month: 6 }, -18)).toEqual({ year: 2024, month: 12 })
  })

  it('builds six Monday-based weeks that contain the whole month', () => {
    const days = monthGridDays({ year: 2026, month: 2 })

    expect(days).toHaveLength(42)
    expect(days[0]?.getDay()).toBe(1)
    expect(days.filter((day) => day.getMonth() === 1)).toHaveLength(28)
    // Local calendar days, not UTC midnights.
    expect(days[0]?.getHours()).toBe(0)
  })

  it('reads the current month from a local date', () => {
    expect(currentMonth(new Date(2026, 8, 8))).toEqual({ year: 2026, month: 9 })
  })
})
