import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import { readPref, writePref } from '@/shared/prefs/storage'

import de from './locales/de'
import en from './locales/en'
import ru from './locales/ru'

export const supportedLanguages = ['en', 'ru', 'de'] as const
export type Language = (typeof supportedLanguages)[number]

export const defaultNS = 'common'
export const LANGUAGE_PREF_KEY = 'language'

export const resources = { en, ru, de } as const
export const namespaces = Object.keys(en) as (keyof typeof en)[]

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (supportedLanguages as readonly string[]).includes(value)
}

/** Stored choice wins; otherwise the first browser language we actually speak; otherwise English. */
export function detectLanguage(): Language {
  const stored = readPref(LANGUAGE_PREF_KEY)
  if (isLanguage(stored)) return stored

  for (const tag of navigator.languages) {
    const base = tag.split('-')[0]
    if (isLanguage(base)) return base
  }
  return 'en'
}

void i18next.use(initReactI18next).init({
  resources,
  lng: detectLanguage(),
  fallbackLng: 'en',
  defaultNS,
  ns: namespaces,
  interpolation: { escapeValue: false },
})

i18next.on('languageChanged', (language) => {
  document.documentElement.lang = language
  if (isLanguage(language)) writePref(LANGUAGE_PREF_KEY, language)
})

document.documentElement.lang = i18next.language

export { i18next }
