import { useTranslation } from 'react-i18next'

import { isLanguage, supportedLanguages } from '@/i18n'

export function LanguageSwitcher({ className }: { className?: string | undefined }) {
  const { t, i18n } = useTranslation()

  return (
    <label className={`flex items-center gap-2 text-sm ${className ?? ''}`}>
      <span className="text-ink-muted">{t('language.label')}</span>
      <select
        data-testid="language-select"
        value={i18n.resolvedLanguage}
        onChange={(event) => {
          const next = event.target.value
          if (isLanguage(next)) void i18n.changeLanguage(next)
        }}
        className="rounded border border-line bg-raised px-2 py-1 text-ink"
      >
        {supportedLanguages.map((language) => (
          <option key={language} value={language}>
            {t(`language.${language}`)}
          </option>
        ))}
      </select>
    </label>
  )
}
