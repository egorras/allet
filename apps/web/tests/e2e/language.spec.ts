import { expect, test } from '@playwright/test'

test.describe('language', () => {
  test.skip(({ isMobile }) => isMobile, 'The sidebar switcher is a desktop control')

  test('switches the whole interface and survives a reload', async ({ page }) => {
    await page.goto('/stage/playbill')

    await expect(page.getByRole('heading', { level: 1, name: 'Playbill' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')

    await page.locator('[data-testid="language-select"]:visible').selectOption('ru')

    await expect(page.getByRole('heading', { level: 1, name: 'Афиша' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru')
    // Empty states and filter labels are translated too, not only the navigation.
    await expect(page.getByText('Показов нет: источник афиши не подключён.')).toBeVisible()
    await expect(page.getByText('Фильтры не заданы.')).toBeVisible()

    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: 'Афиша' })).toBeVisible()

    await page.locator('[data-testid="language-select"]:visible').selectOption('de')
    await expect(page.getByRole('heading', { level: 1, name: 'Spielplan' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'de')
  })
})
