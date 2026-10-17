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


test('guide filters actual inspected units and reveals original source citation', async ({page}) => {
  await page.route('**/wp-json/rha-geology/v1/point?**',route=>route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({source:'Macrostrat',units:[
      {name:'Example sandstone',t_int_name:'Eocene',lith:'sandstone',source_id:'133',map_id:'1001'},
      {name:'Example basalt',t_int_name:'Jurassic',lith:'basalt',source_id:'7',map_id:'1002'},
      {name:'Example gneiss',t_int_name:'Precambrian',lith:'gneiss',source_id:'25',map_id:'1003'}
    ],note:'Geological context only. Not collecting permission.'})
  }));
  await page.route('**/wp-json/rha-geology/v1/source?**',route=>route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({source_id:133,provider:'Macrostrat',name:'Test reference source',authors:'Research Team',catalog_url:'https://macrostrat.org/api/v2/defs/sources?source_id=133'})
  }));
  await page.goto('/rockhounding-map/montana/ruby-reservoir-garnet-shoreline/',{waitUntil:'domcontentloaded'});
  await page.locator('.rha-geology-guide-controls button').filter({hasText:'Geology layer'}).click();
  const panel=page.locator('.rha-geology-guide-panel');
  await panel.getByRole('button',{name:'Geology at guide point'}).click();
  const units=panel.locator('.rha-geo-guide-unit');
  await expect(units).toHaveCount(3);
  const era=panel.getByRole('combobox',{name:'Geological era filter for inspected rock units'});
  const type=panel.getByRole('combobox',{name:'Rock type filter for inspected rock units'});
  await era.selectOption('precambrian');
  await expect(panel.locator('.rha-geo-guide-unit:visible')).toHaveCount(1);
  await era.selectOption('paleozoic');
  await expect(panel.locator('.rha-geo-guide-unit:visible')).toHaveCount(0);
  await era.selectOption('cenozoic');
  await expect(panel.locator('.rha-geo-guide-unit:visible')).toHaveCount(1);
  await type.selectOption('igneous');
  await expect(panel.locator('.rha-geo-guide-unit:visible')).toHaveCount(0);
  await type.selectOption('sedimentary');
  await expect(panel.locator('.rha-geo-guide-unit:visible')).toHaveCount(1);
  const source=panel.locator('.rha-geo-guide-unit:visible').first();
  await source.getByRole('button',{name:'Show original map reference'}).click();
  await expect(source.locator('.rha-geo-v3-citation')).toContainText('Test reference source');
});
