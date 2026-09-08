import { expect, test } from '@playwright/test'

test.describe('phone navigation', () => {
  test.skip(({ isMobile }) => !isMobile, 'Covers the phone layout only')

  test('reaches a module page through the More sheet', async ({ page }) => {
    await page.goto('/')

    const tabs = page.getByRole('navigation', { name: 'Main navigation' })
    await expect(tabs.getByRole('link', { name: 'Calendar' })).toBeVisible()

    await page.getByRole('button', { name: 'Open more navigation' }).click()
    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible()

    await sheet.getByRole('link', { name: 'Playbill' }).click()

    await expect(page).toHaveURL('/stage/playbill')
    await expect(page.getByRole('heading', { level: 1, name: 'Playbill' })).toBeVisible()
    await expect(sheet).toBeHidden()
  })

  test('closes the More sheet with Escape', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Open more navigation' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
  })
})
