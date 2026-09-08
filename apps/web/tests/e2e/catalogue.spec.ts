import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('imported playbill filters and opens a real production', async ({ page }) => {
  await page.goto('/stage/playbill')
  const title = page.getByRole('link', { name: 'Symphony No. 8', exact: true })
  await expect(title).toBeVisible()
  await page.getByRole('searchbox', { name: 'Text', exact: true }).fill('Mahler')
  await expect(title).toBeVisible()
  await title.click()
  await expect(page.getByRole('heading', { name: 'Symphony No. 8', level: 1 })).toBeVisible()
  await expect(page.getByText('2026-10-01 · 20:00')).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test('source history reports the real fixture import', async ({ page }) => {
  await page.goto('/settings/modules')
  await expect(page.getByRole('heading', { name: 'Hungarian State Opera' })).toBeVisible()
  await expect(page.getByText(/2026-10 · Completed/)).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test('distinguishes unavailable server, missing production and empty catalogue', async ({
  page,
}) => {
  await page.goto('/stage/productions/missing')
  await expect(page.getByText('This production is not in the imported catalogue.')).toBeVisible()
  await page.route('**/api/performances', (route) =>
    route.fulfill({ status: 503, json: { error: 'unavailable' } }),
  )
  await page.goto('/stage/playbill')
  await expect(
    page.getByText('The catalogue server is unavailable. Try again after it is running.'),
  ).toBeVisible()
  await page.route('**/api/performances', (route) => route.fulfill({ json: { performances: [] } }))
  await page.reload()
  await expect(page.getByText('No performances have been imported yet.')).toBeVisible()
})
