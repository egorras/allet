import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import type { NavPage } from '@/modules/types'
import type { IconComponent } from '@/shared/ui/icons'

interface NavLinkProps {
  page: NavPage
  icon?: IconComponent | undefined
  onNavigate?: (() => void) | undefined
}

export function NavLink({ page, icon: Icon, onNavigate }: NavLinkProps) {
  const { t } = useTranslation('nav')

  return (
    <Link
      to={page.path}
      onClick={onNavigate}
      activeOptions={{ exact: page.path === '/' }}
      activeProps={{
        'aria-current': 'page',
        className: 'bg-sunken font-medium text-ink',
      }}
      inactiveProps={{ className: 'text-ink-muted hover:bg-sunken hover:text-ink' }}
      className="flex items-center gap-2 rounded px-2 py-1.5 text-sm"
    >
      {Icon ? <Icon className="shrink-0" /> : null}
      <span className="truncate">{t(page.labelKey)}</span>
    </Link>
  )
}
