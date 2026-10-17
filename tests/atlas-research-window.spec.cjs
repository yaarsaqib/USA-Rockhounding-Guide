const {test,expect}=require('@playwright/test');

test('public USGS viewport API returns evidence-labelled research points only',async({request})=>{
 const res=await request.get('/wp-json/rha-atlas/v1/research-window?west=-112.1&east=-111.9&south=33.3&north=33.5');
 expect(res.status()).toBe(200);
 const j=await res.json();
 expect(j.status).toBe('research_only');
 expect(j.items.length).toBeGreaterThan(0);
 expect(j.items.length).toBeLessThanOrEqual(300);
 for(const r of j.items){
  expect(r.status).toBe('research');
  expect(r.id).toMatch(/^usgs-mrds::/);
  expect(r.source).toBe('USGS MRDS');
  expect(Number.isFinite(r.latitude)&&Number.isFinite(r.longitude)).toBe(true);
 }
 expect(j.warning).toMatch(/NOT evidence of public ownership/);
});

test('oversized and invalid public queries are rejected',async({request})=>{
 const tooBig=await request.get('/wp-json/rha-atlas/v1/research-window?west=-117&east=-105&south=32&north=40');
 expect(tooBig.status()).toBe(400);
 const injection=await request.get('/wp-json/rha-atlas/v1/research-window?west=x&east=-105&south=32&north=33');
 expect(injection.status()).toBe(400);
});

test('national map retains its collecting-status controls and opt-in research layer',async({page})=>{
 await page.goto('/rockhounding-map/',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#geoMap')).toHaveCount(1);
 await expect(page.locator('#statusFilters')).toBeVisible();
 const research=page.getByRole('button',{name:'USGS mineral leads'});
 await expect(research).toBeVisible();
 await expect(research).toHaveAttribute('aria-pressed','false');
 await research.click();
 await expect(research).toHaveAttribute('aria-pressed','true');
 const panel=page.locator('.rha-usgs-research-v1');
 await expect(panel).toBeVisible();
 await expect(panel).toContainText('not collecting destinations');
 await expect(panel).toContainText('NOT verify access');
 await panel.getByRole('button',{name:'Hide research leads'}).click();
 await expect(research).toHaveAttribute('aria-pressed','false');
 await expect(page.locator('#geoMap')).toHaveCount(1);
});

test('ready totals and research definitions remain distinct',async({page})=>{
 await page.goto('/rockhounding-map/',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#statReady')).toBeVisible();
 await expect(page.locator('.rh-safety')).toContainText('Ready');
 await expect(page.locator('.rh-safety')).toContainText('Research');
 await expect(page.locator('script[src*="map_bundle.js"]')).toHaveCount(1);
});


test('county geology research records never present directions as collecting destinations',async({page})=>{
 await page.goto('/rockhounding-map/',{waitUntil:'domcontentloaded'});
 await page.getByPlaceholder('agate, fossil, gold, mine, beach…').fill('Autauga County Geology');
 const target=page.locator('#resultList .rh-card').filter({hasText:'Autauga County Geology'}).first();
 await expect(target).toBeVisible();
 await expect(target.locator('.badge.research')).toBeVisible();
 await expect(target.locator('.rha-status-disclaimer')).toContainText('collecting access unverified');
 await expect(target.locator('.rh-actions a')).toHaveCount(0);
 await expect(page.locator('.rha-status-meaning')).toContainText('Research');
});
