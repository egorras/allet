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

test('source history reports the real fixture import, down to what it wrote', async ({ page }) => {
  await page.goto('/settings/modules')
  await expect(page.getByRole('heading', { name: 'Hungarian State Opera' })).toBeVisible()
  await expect(page.getByText(/2026-10 · Completed · Started by hand/)).toBeVisible()
  await page.getByRole('group').filter({ hasText: 'Details' }).getByText('Details').click()
  await expect(page.getByText(/Performances read: \d+/)).toBeVisible()
  await expect(page.getByText(/New: \d+, updated: \d+, unchanged: \d+/)).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test.describe('schedule', () => {
  // One shared in-memory server backs both projects, so only one of them
  // writes to it. Mobile layout for this page is covered by routes.spec.ts.
  test.skip(({ isMobile }) => isMobile, 'Writes would race the desktop project')

  test('changes the schedule and keeps it after a reload', async ({ page }) => {
    await page.goto('/settings/modules')
    const interval = page.getByLabel('Refresh each month at most')
    await expect(interval).toHaveValue('1440')
    const save = page.getByRole('button', { name: 'Save schedule' })
    await expect(save).toBeDisabled()
    await interval.selectOption('720')
    await page.getByLabel('Months kept fresh').fill('2')
    await save.click()
    await expect(save).toBeDisabled()
    await page.reload()
    await expect(page.getByLabel('Refresh each month at most')).toHaveValue('720')
    await expect(page.getByLabel('Months kept fresh')).toHaveValue('2')
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  })

  test('queues a month, shows why it is there, and removes it again', async ({ page }) => {
    await page.goto('/settings/modules')
    await expect(page.getByText('No months are queued.')).toBeVisible()
    await page.getByLabel('Import another month').fill('2027-04')
    await page.getByRole('button', { name: 'Add to the queue' }).click()
    const queued = page.getByRole('listitem').filter({ hasText: '2027-04' })
    await expect(queued).toContainText('Asked for')
    await expect(queued).toContainText('Due')
    // Queueing asks for a month; it does not import one. Nothing new has run.
    await expect(page.getByText(/2027-04 · (Completed|Running|Failed)/)).toHaveCount(0)
    await queued.getByRole('button', { name: 'Remove' }).click()
    await expect(page.getByText('No months are queued.')).toBeVisible()
  })
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
