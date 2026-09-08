/**
 * Local, per-device preferences. Nothing here is shared between users or devices —
 * v0 has no server (ALLET_PLAN.md §8). Every access is guarded because localStorage
 * throws in private windows and when site data is blocked.
 */
const PREFIX = 'allet.'

export function readPref(key: string): string | null {
  try {
    return window.localStorage.getItem(PREFIX + key)
  } catch {
    return null
  }
}

export function writePref(key: string, value: string): void {
  try {
    window.localStorage.setItem(PREFIX + key, value)
  } catch {
    // Preference simply is not remembered on this device.
  }
}

export function readJsonPref<T>(key: string, isValid: (value: unknown) => value is T): T | null {
  const raw = readPref(key)
  if (raw === null) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return isValid(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function writeJsonPref(key: string, value: unknown): void {
  writePref(key, JSON.stringify(value))
}
