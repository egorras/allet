import { useSyncExternalStore } from 'react'

import { readPref, writePref } from './storage'

/**
 * Desktop lists are meant to be dense (ALLET_PLAN.md §3). The choice is a per-device
 * display preference, applied as a data attribute the stylesheet reads.
 */
export const densities = ['comfortable', 'compact'] as const
export type Density = (typeof densities)[number]

const KEY = 'density'

function isDensity(value: unknown): value is Density {
  return typeof value === 'string' && (densities as readonly string[]).includes(value)
}

const stored = readPref(KEY)
let density: Density = isDensity(stored) ? stored : 'comfortable'
const listeners = new Set<() => void>()

function apply(): void {
  document.documentElement.dataset.density = density
}

export function getDensity(): Density {
  return density
}

export function setDensity(next: Density): void {
  density = next
  writePref(KEY, next)
  apply()
  for (const listener of listeners) listener()
}

export function useDensity(): Density {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getDensity,
    getDensity,
  )
}

apply()
