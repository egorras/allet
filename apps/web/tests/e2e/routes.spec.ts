import { expect, test } from '@playwright/test'

import { ALL_PAGES } from './pages'

for (const path of ALL_PAGES) {
  test(`opens ${path} directly, with a heading and no console error`, async ({ page }) => {
    const errors: string[] = []
    page.on('console', (message) => {
      // The deliberately nonexistent production returns a real API 404.
      if (
        message.type() === 'error' &&
        !(path === '/stage/productions/example-production' && message.text().includes('404'))
      )
        errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(error.message))

    await page.goto(path)

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(errors).toEqual([])
  })

  test(`shows no horizontal scrollbar on ${path}`, async ({ page }) => {
    await page.goto(path)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)
  })
}

test('answers an unknown address with the not-found page', async ({ page }) => {
  await page.goto('/stage/does-not-exist')

  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
  await page.getByRole('link', { name: 'Go to home' }).click()
  await expect(page).toHaveURL('/')
})
