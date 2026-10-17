const {test,expect}=require('@playwright/test');
for (const device of ['desktop','mobile']) {
 test(device+' Gear Hub catalog, product photography and navigation',async({page})=>{
   const jsErrors=[];page.on('pageerror',e=>jsErrors.push(e.message));
   await page.goto('/gear/',{waitUntil:'domcontentloaded'});
   const app=page.locator('.usarh-gear-app');
   await expect(app).toBeVisible();
   const cards=app.locator('#usarh-shop-products .usarh-shop-card');
   await expect(cards).toHaveCount(128);
   await expect(page.locator('.rha-gear-catalog-bar')).toBeVisible();
   await expect(page.locator('.rha-gear-more-btn')).toBeVisible();
   await expect.poll(async()=>page.locator('.usarh-shop-card:not(.rha-gear-page-hidden):not([hidden])').count(),{timeout:20000}).toBe(18);
   await expect(app.locator('.rha-gear-page-summary')).toContainText('Showing 18 of 128');
   await expect(app.locator('.rha-gear-photo-link')).toHaveCount(128);
   await expect(app.locator('.rha-gear-title-link')).toHaveCount(128);
   const first=cards.first();
   await expect(first.locator('img.usarh-product-photo')).toBeVisible();
   const url=await first.locator('.usarh-btn--merchant').getAttribute('href');
   expect(await first.locator('.rha-gear-photo-link').getAttribute('href')).toBe(url);
   expect(await first.locator('.rha-gear-title-link').getAttribute('href')).toBe(url);
   await page.locator('.rha-gear-more-btn').click();
   await expect.poll(()=>page.locator('.usarh-shop-card:not(.rha-gear-page-hidden):not([hidden])').count()).toBe(36);
   const input=page.locator('[data-gear-shop-search]');
   await input.fill('CabKing');
   await expect.poll(()=>page.locator('.usarh-shop-card:not(.rha-gear-page-hidden):not([hidden])').count(),{timeout:15000}).toBeGreaterThan(0);
   await expect(page.locator('.usarh-shop-card:not(.rha-gear-page-hidden):not([hidden])').first()).toContainText('CabKing');
   const select=page.locator('[data-gear-shop-category]');
   await input.clear();
   await select.selectOption('tumblers');
   await expect.poll(()=>page.locator('.usarh-shop-card:not(.rha-gear-page-hidden):not([hidden])').count(),{timeout:15000}).toBeGreaterThan(0);
   const props=await page.evaluate(()=>{
     const grid=document.querySelector('#usarh-shop-products'),app=document.querySelector('.usarh-gear-app');
     return {gridColumns:getComputedStyle(grid).gridTemplateColumns.split(' ').length,bodyScroll:document.documentElement.scrollWidth,width:innerWidth,appWidth:app.getBoundingClientRect().width};
   });
   expect(props.bodyScroll).toBeLessThanOrEqual(props.width+10);
   if(device==='mobile')expect(props.gridColumns).toBe(1);
   expect(jsErrors).toEqual([]);
 });
}
test('Gear Hub has accurate merchant link labels and no unrelated external links',async({request})=>{
 const response=await request.get('/gear/');expect(response.ok()).toBeTruthy();
 const html=await response.text();
 const main=html.split('<main')[1]?.split('</main>')[0]||'';
 expect((main.match(/class="rha-gear-title-link"/g)||[]).length).toBe(128);
 expect((main.match(/class="rha-gear-photo-link"/g)||[]).length).toBe(128);
 expect((main.match(/>Search Amazon for this model ↗<\/a>/g)||[]).length).toBe(19);
 expect(main).not.toContain('href="https://www.estwing.com');
 expect(main).not.toContain('href="https://hitechdiamond.com');
});
