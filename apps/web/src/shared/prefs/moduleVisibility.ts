import { useSyncExternalStore } from 'react'

import { isModuleId, type ModuleId } from '@/modules/types'

import { readJsonPref, writeJsonPref } from './storage'

/**
 * Hiding a module removes it from navigation on this device only. It is a display
 * preference, not an access control mechanism (ALLET_PLAN.md §8, item 10).
 */
const KEY = 'hiddenModules'

function isModuleIdArray(value: unknown): value is ModuleId[] {
  return Array.isArray(value) && value.every(isModuleId)
}

let hidden: readonly ModuleId[] = readJsonPref(KEY, isModuleIdArray) ?? []
const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getHiddenModules(): readonly ModuleId[] {
  return hidden
}

export function setModuleHidden(id: ModuleId, isHidden: boolean): void {
  const next = isHidden ? [...new Set([...hidden, id])] : hidden.filter((entry) => entry !== id)
  hidden = next
  writeJsonPref(KEY, next)
  emit()
}

export function useHiddenModules(): readonly ModuleId[] {
  return useSyncExternalStore(subscribe, getHiddenModules, getHiddenModules)
}
