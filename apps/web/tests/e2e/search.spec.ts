import { expect, test } from '@playwright/test'

test.describe('page search', () => {
  test.skip(({ isMobile }) => isMobile, 'Keyboard shortcut is a desktop path')

  test('opens with the keyboard and navigates to a page', async ({ page }) => {
    await page.goto('/')
    // Wait for the app to mount before using a shortcut it registers on mount.
    await expect(page.getByRole('button', { name: 'Search pages' }).first()).toBeVisible()

    await page.keyboard.press('ControlOrMeta+k')
    const dialog = page.getByRole('dialog', { name: 'Search' })
    await expect(dialog).toBeVisible()
    // The dialog states its own limit: it finds pages, not data.
    await expect(dialog.getByText('v0 searches the pages of this app only')).toBeVisible()

    await page.keyboard.type('play')
    await expect(dialog.getByRole('option', { name: /Playbill/ })).toBeVisible()
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL('/stage/playbill')
    await expect(dialog).toBeHidden()
  })

  test('says so when nothing matches', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Search pages' }).first()).toBeVisible()

    await page.keyboard.press('ControlOrMeta+k')
    await page.keyboard.type('zzzz')

    await expect(page.getByText('No page matches this text.')).toBeVisible()
  })

  test('returns focus to the trigger after Escape', async ({ page }) => {
    await page.goto('/')

    const trigger = page.getByRole('button', { name: 'Search pages' }).first()
    await trigger.click()
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeHidden()
    await expect(trigger).toBeFocused()
  })
})
