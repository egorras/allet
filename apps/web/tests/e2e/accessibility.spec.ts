import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

/**
 * An automated scan does not prove accessibility (ALLET_PLAN.md §9); keyboard paths are
 * checked by the other specs and by hand. This catches the mechanical regressions.
 */
const SCANNED_PAGES = ['/', '/stage/playbill', '/stage/productions/example', '/settings/modules']

test.describe('accessibility', () => {
  test.skip(({ isMobile }) => isMobile, 'Scan once per screen, on desktop')

  for (const path of SCANNED_PAGES) {
    test(`has no detectable violations on ${path}`, async ({ page }) => {
      await page.goto(path)
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

      expect(results.violations).toEqual([])
    })
  }

  test('has no detectable violations in the open search dialog', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Search pages' }).first()).toBeVisible()
    await page.keyboard.press('ControlOrMeta+k')
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible()

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })
})
