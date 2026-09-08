import { expect, test } from '@playwright/test'

test.describe('per-device preferences', () => {
  test.skip(({ isMobile }) => isMobile, 'Uses the desktop sidebar to observe the effect')

  test('hides a module from navigation and remembers it', async ({ page }) => {
    await page.goto('/settings/modules')

    const sidebar = page.getByRole('navigation', { name: 'Main navigation' })
    await expect(sidebar.getByRole('link', { name: 'Offers' })).toBeVisible()
    // The page says plainly that this is display only, not access control.
    await expect(
      page.getByText('Hiding a module only changes navigation on this device.'),
    ).toBeVisible()

    await page.getByRole('checkbox', { name: 'Travel' }).uncheck()
    await expect(sidebar.getByRole('link', { name: 'Offers' })).toBeHidden()

    await page.reload()
    await expect(sidebar.getByRole('link', { name: 'Offers' })).toBeHidden()
    // The pages themselves stay reachable: this is not permission.
    await page.goto('/travel/offers')
    await expect(page.getByRole('heading', { level: 1, name: 'Offers' })).toBeVisible()

    await page.goto('/settings/modules')
    await page.getByRole('checkbox', { name: 'Travel' }).check()
    await expect(sidebar.getByRole('link', { name: 'Offers' })).toBeVisible()
  })

  test('remembers the display density', async ({ page }) => {
    await page.goto('/settings/profile')

    await page.getByRole('radio', { name: 'Compact' }).check()
    await expect(page.locator('html')).toHaveAttribute('data-density', 'compact')

    await page.reload()
    await expect(page.getByRole('radio', { name: 'Compact' })).toBeChecked()
    await expect(page.locator('html')).toHaveAttribute('data-density', 'compact')
  })
})
