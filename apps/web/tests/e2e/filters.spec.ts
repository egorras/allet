import { expect, test } from '@playwright/test'

test.describe('filters in the address', () => {
  test.skip(({ isMobile }) => isMobile, 'Same behaviour on both widths; run once')

  test('survive a reload, back and forward, and can be cleared', async ({ page }) => {
    await page.goto('/stage/playbill')
    await expect(page.getByText('No filter applied.')).toBeVisible()

    await page.getByLabel('City').fill('Wien')
    await expect(page).toHaveURL(/city=Wien/)

    await page.getByLabel('From').fill('2026-10-01')
    await expect(page).toHaveURL(/from=2026-10-01/)
    await expect(page.getByText('2 filters applied')).toBeVisible()

    await page.reload()
    await expect(page.getByLabel('City')).toHaveValue('Wien')
    await expect(page.getByLabel('From')).toHaveValue('2026-10-01')

    // The date filter pushed a history entry, so Back removes it and Forward returns it.
    await page.goBack()
    await expect(page).not.toHaveURL(/from=/)
    await expect(page.getByLabel('City')).toHaveValue('Wien')

    await page.goForward()
    await expect(page.getByLabel('From')).toHaveValue('2026-10-01')

    await page.getByRole('button', { name: 'Clear all' }).click()
    await expect(page).toHaveURL('/stage/playbill')
    await expect(page.getByText('No filter applied.')).toBeVisible()
  })

  test('ignores a malformed address instead of failing', async ({ page }) => {
    await page.goto('/stage/playbill?from=yesterday')

    await expect(page.getByRole('heading', { level: 1, name: 'Playbill' })).toBeVisible()
    await expect(page.getByText('No filter applied.')).toBeVisible()
  })

  test('keeps the calendar month in the address', async ({ page }) => {
    await page.goto('/calendar?month=2026-02')

    await expect(page.getByRole('heading', { level: 2, name: 'February 2026' })).toBeVisible()
    await page.getByRole('button', { name: 'Next month' }).click()
    await expect(page).toHaveURL(/month=2026-03/)

    await page.reload()
    await expect(page.getByRole('heading', { level: 2, name: 'March 2026' })).toBeVisible()
  })
})
