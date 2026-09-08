import { describe, expect, it } from 'vitest'

import de from '@/i18n/locales/de'
import en from '@/i18n/locales/en'
import ru from '@/i18n/locales/ru'

type Dict = Record<string, unknown>

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/

function flatten(value: Dict, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, entry]) => {
    const path = prefix === '' ? key : `${prefix}.${key}`
    return typeof entry === 'object' && entry !== null ? flatten(entry as Dict, path) : [path]
  })
}

/** Plural forms differ per language, so keys are compared without their suffix. */
function baseKeys(dict: Dict): Set<string> {
  return new Set(flatten(dict).map((key) => key.replace(PLURAL_SUFFIX, '')))
}

function pluralKeys(dict: Dict): Set<string> {
  return new Set(
    flatten(dict)
      .filter((key) => PLURAL_SUFFIX.test(key))
      .map((key) => key.replace(PLURAL_SUFFIX, '')),
  )
}

const bundles = { en, ru, de } as unknown as Record<string, Record<string, Dict>>
const namespaces = Object.keys(en)

describe('translations', () => {
  it('define the same namespaces in every language', () => {
    expect(Object.keys(ru).sort()).toEqual(namespaces.slice().sort())
    expect(Object.keys(de).sort()).toEqual(namespaces.slice().sort())
  })

  for (const namespace of namespaces) {
    for (const language of ['ru', 'de'] as const) {
      it(`${language}/${namespace} has exactly the keys of en/${namespace}`, () => {
        const expected = baseKeys(bundles.en?.[namespace] ?? {})
        const actual = baseKeys(bundles[language]?.[namespace] ?? {})

        const missing = [...expected].filter((key) => !actual.has(key)).sort()
        const extra = [...actual].filter((key) => !expected.has(key)).sort()

        expect({ missing, extra }).toEqual({ missing: [], extra: [] })
      })
    }
  }

  for (const language of ['en', 'ru', 'de'] as const) {
    it(`${language} provides every plural form its language needs`, () => {
      const categories = new Intl.PluralRules(language).resolvedOptions().pluralCategories
      const bundle = bundles[language] ?? {}

      for (const namespace of namespaces) {
        const dict = bundle[namespace] ?? {}
        const keys = new Set(flatten(dict))
        for (const key of pluralKeys(bundles.en?.[namespace] ?? {})) {
          for (const category of categories) {
            expect(
              keys.has(`${key}_${category}`),
              `${language}: ${namespace}:${key}_${category}`,
            ).toBe(true)
          }
        }
      }
    })
  }
})
