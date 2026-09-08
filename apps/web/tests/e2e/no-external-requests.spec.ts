import { expect, test } from '@playwright/test'

import { ALL_PAGES } from './pages'

/**
 * ALLET_PLAN.md §8: v0 must not reach a ticket site, Telegram, an AI provider, a map
 * service or a font CDN. Every request the app makes has to stay on its own origin.
 */
test('never requests anything outside the app itself', async ({ page, baseURL }) => {
  const external: string[] = []
  page.on('request', (request) => {
    const { origin } = new URL(request.url())
    if (!baseURL || origin !== new URL(baseURL).origin) external.push(request.url())
  })

  for (const path of ALL_PAGES) {
    await page.goto(path)
  }
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.keyboard.press('ControlOrMeta+k')
  await page.keyboard.type('plan')
  await page.keyboard.press('Escape')

  expect(external).toEqual([])
})
