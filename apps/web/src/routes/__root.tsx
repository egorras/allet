import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { AppShell } from '@/app/shell/AppShell'
import { PageHeader } from '@/shared/ui/PageHeader'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

function RootLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <>
      <PageHeader title={t('notFound.title')} description={t('notFound.description')} />
      <Link to="/" className="text-sm text-accent underline">
        {t('notFound.goHome')}
      </Link>
    </>
  )
}
