import { useNavigate } from '@tanstack/react-router'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { AppPath } from '@/modules/types'
import { useVisibleSections } from '@/shared/nav/useVisibleSections'
import { Modal } from '@/shared/ui/Modal'

interface SearchEntry {
  path: AppPath
  label: string
  section: string
}

/**
 * Global search. In v0 it finds pages of this app and nothing else — the dialog says
 * so, because there is no data to search yet (ALLET_PLAN.md §8, item 7).
 */
export function SearchDialog({ onClose }: { onClose: () => void }) {
  const { t, i18n } = useTranslation('search')
  const { t: tNav } = useTranslation('nav')
  const { core, modules, settings } = useVisibleSections()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const entries = useMemo<SearchEntry[]>(
    () =>
      [...core, ...modules, settings].flatMap((section) =>
        section.pages
          .filter((page) => page.searchable)
          .map((page) => ({
            path: page.path,
            label: tNav(page.labelKey),
            section: tNav(section.labelKey),
          })),
      ),
    [core, modules, settings, tNav],
  )

  const locale = i18n.resolvedLanguage ?? 'en'
  const needle = query.trim().toLocaleLowerCase(locale)
  const results = useMemo(
    () =>
      needle === ''
        ? entries
        : entries.filter(
            (entry) =>
              entry.label.toLocaleLowerCase(locale).includes(needle) ||
              entry.section.toLocaleLowerCase(locale).includes(needle),
          ),
    [entries, needle, locale],
  )

  // The dialog is mounted only while it is open, so it always starts empty.
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // A shrinking result list must not leave the highlight pointing past its end.
  const highlighted = activeIndex < results.length ? activeIndex : 0

  const go = (entry: SearchEntry | undefined) => {
    if (!entry) return
    onClose()
    void navigate({ to: entry.path })
  }

  return (
    <Modal open onClose={onClose} title={t('title')}>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded="true"
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label={t('title')}
        aria-activedescendant={
          results[highlighted] ? `${listId}-${String(highlighted)}` : undefined
        }
        value={query}
        placeholder={t('placeholder')}
        onChange={(event) => {
          setQuery(event.target.value)
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setActiveIndex((index) => (results.length === 0 ? 0 : (index + 1) % results.length))
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActiveIndex((index) =>
              results.length === 0 ? 0 : (index - 1 + results.length) % results.length,
            )
          } else if (event.key === 'Enter') {
            event.preventDefault()
            go(results[highlighted])
          }
        }}
        className="w-full rounded border border-line bg-raised px-3 py-2 text-sm"
      />
      <p className="mt-2 text-xs text-ink-muted">{t('scopeNote')}</p>

      {results.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">{t('noResults')}</p>
      ) : (
        <ul
          id={listId}
          role="listbox"
          aria-label={t('title')}
          className="mt-3 max-h-72 overflow-y-auto"
        >
          {results.map((entry, index) => (
            <li
              key={entry.path}
              id={`${listId}-${String(index)}`}
              role="option"
              aria-selected={index === highlighted}
              className={`rounded ${index === highlighted ? 'bg-sunken' : ''}`}
            >
              <button
                type="button"
                onClick={() => {
                  go(entry)
                }}
                onMouseEnter={() => {
                  setActiveIndex(index)
                }}
                className="flex w-full items-baseline justify-between gap-3 px-2 py-1.5 text-left text-sm"
              >
                <span>{entry.label}</span>
                <span className="text-xs text-ink-muted">{entry.section}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
