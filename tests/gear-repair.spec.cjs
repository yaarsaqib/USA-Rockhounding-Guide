const {test,expect}=require('@playwright/test');
for (const device of ['desktop','mobile']) {
 test(device+' Gear Hub catalog, product photography and navigation',async({page},testInfo)=>{
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
   if(testInfo.project.name==='mobile')expect(props.gridColumns).toBe(1);
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


test('all 128 Gear Hub product image URLs return real image files',async({page,request})=>{
  await page.goto('/gear/',{waitUntil:'domcontentloaded'});
  const imgs=await page.locator('#usarh-shop-products img.usarh-product-photo').evaluateAll(nodes=>nodes.map(n=>({alt:n.alt,url:n.getAttribute('src')})));
  expect(imgs).toHaveLength(128);
  const problems=[];
  for(let i=0;i<imgs.length;i+=10){
    const batch=imgs.slice(i,i+10);
    await Promise.all(batch.map(async item=>{
      try{
        const response=await request.get(item.url,{timeout:20000});
        const ct=response.headers()['content-type']||'';
        if(!response.ok()||!ct.startsWith('image/'))problems.push({alt:item.alt,url:item.url,status:response.status(),contentType:ct});
      }catch(error){problems.push({alt:item.alt,url:item.url,error:String(error).slice(0,150)});}
    }));
  }
  if(problems.length)console.log('PRODUCT IMAGE ERRORS:',JSON.stringify(problems));
  expect(problems).toEqual([]);
});


test('Gear Finder produces a customized result instead of leaving its initial placeholder',async({page})=>{
 await page.goto('/gear/',{waitUntil:'domcontentloaded'});
 const form=page.locator('form[data-gear-finder]');
 await expect(form).toBeVisible();
 await form.locator('select[name="activity"]').selectOption('tumble');
 await form.locator('select[name="material"]').selectOption('agate');
 await form.locator('select[name="size"]').selectOption('small');
 await form.locator('select[name="budget"]').selectOption('500');
 await form.getByRole('button',{name:'Build my equipment path'}).click();
 const result=page.locator('[data-gear-result]');
 await expect(result).not.toContainText('Start with the job—not the product.');
 await expect(result).toContainText(/tumb|polish|rotary/i);
});
test('Gear page internal guides do not point to 404 destinations',async({page,request})=>{
 await page.goto('/gear/',{waitUntil:'domcontentloaded'});
 const links=await page.locator('.usarh-gear-app a[href]').evaluateAll(a=>
  [...new Set(a.map(x=>x.href).filter(u=>u.startsWith(location.origin+'/')&&!u.includes('#')))]
 );
 const bad=[];
 for(let i=0;i<links.length;i+=8){
  await Promise.all(links.slice(i,i+8).map(async u=>{
   try{
    const r=await request.get(u,{timeout:16000});
    if(r.status()>=400)bad.push({url:u,status:r.status()});
   }catch(e){bad.push({url:u,error:String(e).slice(0,160)});}
  }));
 }
 if(bad.length)console.log('BROKEN INTERNAL GEAR LINKS:',JSON.stringify(bad));
 expect(bad).toEqual([]);
});
