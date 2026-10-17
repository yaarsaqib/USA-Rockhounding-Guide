const {test,expect}=require('@playwright/test');
test('Gear Hub visual hierarchy is coherent on desktop and mobile',async({page},testInfo)=>{
  const errs=[];
  page.on('pageerror',e=>errs.push(e.message));
  await page.goto('https://usarockhounding.com/gear/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.RHA_GEAR_VISUAL_V2_READY===true);
  const info=await page.evaluate(()=>{
    const app=document.querySelector('.usarh-gear-app');
    const ids=['gear-finder','choose-path','amazon-gear','practical-buying-guide'];
    const sections=ids.map(id=>document.getElementById(id));
    const map=sections.map(el=>({id:el.id,top:Math.round(el.getBoundingClientRect().top+scrollY)}));
    const hero=document.querySelector('.usarh-hero');
    const steps=[...document.querySelectorAll('.usarh-journey span')].map(el=>Math.round(el.getBoundingClientRect().top));
    const cards=[...document.querySelectorAll('.usarh-shop-card')];
    const button=cards[0].querySelector('.usarh-btn--merchant');
    return {
      mainTop:Math.round(document.querySelector('#main').getBoundingClientRect().top),
      contentTop:Math.round(app.getBoundingClientRect().top+scrollY),
      totalHeight:document.documentElement.scrollHeight,
      docWidth:document.documentElement.scrollWidth,
      viewportWidth:innerWidth,
      sections:map,heroHeight:Math.round(hero.getBoundingClientRect().height),
      visibleProducts:cards.filter(c=>getComputedStyle(c).display!=='none').length,
      cards:cards.length,steps,buttonColor:getComputedStyle(button).backgroundColor,
      details:document.querySelector('.rha-gear-comparison-details')?.open
    };
  });
  console.log('RHA_VISUAL_QA',testInfo.project.name,JSON.stringify(info));
  expect(info.sections.map(x=>x.top)).toEqual([...info.sections.map(x=>x.top)].sort((a,b)=>a-b));
  expect(info.mainTop).toBeLessThan(110);
  expect(info.contentTop).toBeLessThan(180);
  expect(info.cards).toBe(128);
  expect(info.details).toBe(false);
  expect(new Set(info.steps).size).toBe(1);
  expect(info.docWidth).toBeLessThanOrEqual(info.viewportWidth+10);
  if(testInfo.project.name.includes('mobile')){
    expect(info.visibleProducts).toBe(6);
    expect(info.sections[0].top).toBeLessThan(2100);
    expect(info.totalHeight).toBeLessThan(25000);
  }else{
    expect(info.visibleProducts).toBe(9);
    expect(info.sections[0].top).toBeLessThan(1600);
    expect(info.totalHeight).toBeLessThan(15000);
  }
  await page.locator('#gear-finder select[name="activity"]').selectOption('tumble');
  await page.locator('#gear-finder button[type="submit"]').click();
  await expect(page.locator('#gear-finder [data-gear-result]')).not.toContainText('Start with the job—not the product.');
  const shop=page.locator('#usarh-shop-products');
  await shop.scrollIntoViewIfNeeded();
  await expect.poll(async()=>shop.locator('img.usarh-product-photo').first().evaluate(img=>img.complete&&img.naturalWidth>0),{timeout:20000}).toBe(true);
  expect(errs).toEqual([]);
});
