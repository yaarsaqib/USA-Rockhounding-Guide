const { test, expect } = require('@playwright/test');
const pages = [
  ['Montana Ruby Reservoir','/rockhounding-map/montana/ruby-reservoir-garnet-shoreline/',true],
  ['Alabama Gold Camp','/rockhounding-map/alabama/alabama-gold-camp-public-prospecting-program/',false],
  ['Alaska Bertha Creek','/rockhounding-map/alaska/bertha-creek-recreational-gold-panning-area/',null]
];

test('national map keeps its original map and gains geology filters', async ({page}) => {
  await page.goto('/rockhounding-map/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#geoMap')).toHaveCount(1);
  const button=page.locator('#rh-app button[data-rha-geology="toggle"]');
  await expect(button).toBeVisible();
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed','true');
  const panel=page.locator('#mapWrap .rha-geology-panel');
  await expect(panel).toBeVisible();
  const age=panel.getByRole('combobox',{name:'Geological era filter for inspected rock units'});
  const rock=panel.getByRole('combobox',{name:'Rock type filter for inspected rock units'});
  await expect(age).toBeVisible();
  await expect(rock).toBeVisible();
  await age.selectOption('paleozoic');
  await rock.selectOption('sedimentary');
  await expect(age).toHaveValue('paleozoic');
  await expect(rock).toHaveValue('sedimentary');
  await expect(page.locator('#geoMap')).toHaveCount(1);
  await expect(panel).toContainText('colored map layer');
});

for(const [title,url,hasGuidePoint] of pages){
  test(title+' reuses one map and contains geology controls',async ({page}) => {
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await expect(page.locator('.rha-mt-location-map-section')).toHaveCount(1);
    await expect(page.locator('#rha-mt-location-map')).toHaveCount(1);
    const toggle=page.locator('.rha-geology-guide-controls button').filter({hasText:'Geology layer'});
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed','true');
    const panel=page.locator('.rha-mt-location-map-section .rha-geology-guide-panel');
    await expect(panel).toBeVisible();
    await expect(panel.getByRole('combobox',{name:'Geological era filter for inspected rock units'})).toBeVisible();
    await expect(panel.getByRole('combobox',{name:'Rock type filter for inspected rock units'})).toBeVisible();
    if(hasGuidePoint!==null){
      await expect(panel.getByRole('button',{name:'Geology at guide point'})).toHaveCount(hasGuidePoint?1:0);
    }
    const rect=await panel.boundingBox(),viewport=page.viewportSize();
    if(rect&&viewport) {
      expect(rect.x).toBeGreaterThanOrEqual(-5);
      expect(rect.x+rect.width).toBeLessThanOrEqual(viewport.width+8);
    }
    await expect(page.locator('#rha-mt-location-map')).toHaveCount(1);
  });
}
test('geological sources include a citation and Macrostrat origin',async ({request}) => {
  const response=await request.get('/wp-json/rha-geology/v1/source?source_id=133');
  expect(response.ok()).toBeTruthy();
  const data=await response.json();
  expect(data.source_id).toBe(133);
  expect(data.provider).toBe('Macrostrat');
  expect(data.name).toBeTruthy();
  expect(data.catalog_url).toContain('/defs/sources');
});
test('point geological data preserves primary research fields',async ({request}) => {
  const response=await request.get('/wp-json/rha-geology/v1/point?lat=33.6598&lng=-85.8316');
  expect(response.ok()).toBeTruthy();
  const data=await response.json();
  expect(data.source).toBe('Macrostrat');
  expect(Array.isArray(data.units)).toBeTruthy();
  expect(data.units[0]?.source_id).toBeTruthy();
  expect(data.note).toContain('permission');
});
