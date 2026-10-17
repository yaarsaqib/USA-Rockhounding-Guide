const { test, expect } = require('@playwright/test');

test('national map keeps original map and adds an optional geology layer', async ({ page }) => {
  await page.goto('/rockhounding-map/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#geoMap')).toHaveCount(1);
  const geology = page.locator('#rh-app button[data-rha-geology="toggle"]');
  await expect(geology).toBeVisible();
  await geology.click();
  await expect(geology).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#mapWrap .rha-geology-panel')).toBeVisible();
  await expect(page.locator('#geoMap')).toHaveCount(1);
});

for (const [name, path, hasExactGuidePoint] of [
  ['Montana Ruby Reservoir', '/rockhounding-map/montana/ruby-reservoir-garnet-shoreline/', true],
  ['Alabama Gold Camp', '/rockhounding-map/alabama/alabama-gold-camp-public-prospecting-program/', false]
]) {
  test(name + ' retains exactly one field map and geological research panel', async ({ page }) => {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('section.rha-mt-location-map-section')).toHaveCount(1);
    await expect(page.locator('#rha-mt-location-map')).toHaveCount(1);
    const geology = page.locator('.rha-geology-guide-controls button').filter({ hasText: 'Geology layer' });
    await expect(geology).toBeVisible();
    await geology.click();
    await expect(geology).toHaveAttribute('aria-pressed', 'true');
    const panel = page.locator('section.rha-mt-location-map-section .rha-geology-guide-panel');
    await expect(panel).toBeVisible();
    await expect(panel).toContainText('not evidence of accessible specimens');
    if (hasExactGuidePoint) {
      await expect(panel.getByRole('button', { name: 'Geology at guide point' })).toBeVisible();
    } else {
      await expect(panel.getByRole('button', { name: 'Geology at guide point' })).toHaveCount(0);
    }
    await expect(page.locator('#rha-mt-location-map')).toHaveCount(1);
    const rect = await panel.boundingBox();
    if (rect) {
      const viewport = page.viewportSize();
      expect(rect.x).toBeGreaterThanOrEqual(-5);
      expect(rect.x + rect.width).toBeLessThanOrEqual(viewport.width + 8);
    }
  });
}
