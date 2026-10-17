const {chromium}=require('playwright');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 for(const device of [
  {name:'desktop',width:1440,height:900},
  {name:'mobile',width:390,height:844}
 ]){
  const page=await browser.newPage({viewport:{width:device.width,height:device.height},deviceScaleFactor:1});
  page.on('pageerror',e=>console.log('RHA_PAGE_ERROR '+device.name+' '+e.message.slice(0,250)));
  await page.goto('https://usarockhounding.com/gear/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForTimeout(1200);

  console.log('RHA_TOP_DIAG '+device.name+' '+JSON.stringify(await page.evaluate(()=>{
    const sels=['header','#main','.rha-page-heading','.entry-content','.usarh-gear-app','.usarh-breadcrumbs'];
    return sels.map(sel=>{
      const el=document.querySelector(sel);if(!el)return {sel,missing:true};
      const r=el.getBoundingClientRect(),c=getComputedStyle(el);
      return {sel,top:Math.round(r.top+scrollY),height:Math.round(r.height),
        paddingTop:c.paddingTop,marginTop:c.marginTop,minHeight:c.minHeight,
        visibility:c.visibility,display:c.display,position:c.position};
    });
  })));
  const imgCheck=page.locator('.usarh-shop-card img.usarh-product-photo').first();
  await imgCheck.scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  console.log('RHA_IMAGE_DIAG '+device.name+' '+JSON.stringify(await page.evaluate(()=>{
    return [...document.querySelectorAll('.usarh-shop-card img.usarh-product-photo')].slice(0,9).map(n=>({
      alt:n.alt,complete:n.complete,naturalWidth:n.naturalWidth,
      loading:n.loading,src:n.currentSrc||n.src,
      rect:n.getBoundingClientRect().toJSON()
    }));
  })));
  await page.evaluate(()=>window.scrollTo(0,0));
  const result=await page.evaluate(()=>{
    const app=document.querySelector('.usarh-gear-app');
    const entries=['.usarh-hero','.usarh-answer','#practical-buying-guide','.usarh-toc',
      '.usarh-buying-decisions','#amazon-gear','#rha-buyer-comparisons',
      '.usarh-shop-controls','#usarh-shop-products','.usarh-catgrid',
      '#gear-finder','#rock-to-gear','#common-questions','.usarh-evidence-policy','.usarh-trust'];
    const blocks=[...new Set(entries)].map(selector=>{
     const e=document.querySelector(selector);
     if(!e)return {selector,exists:false};
     const r=e.getBoundingClientRect();
     return {selector,exists:true,top:Math.round(r.top+scrollY),height:Math.round(r.height),width:Math.round(r.width),left:Math.round(r.left)};
    });
    const sections=[...document.querySelectorAll('.usarh-gear-app > *, .usarh-gear-app > .usarh-section')].map(el=>{
      const r=el.getBoundingClientRect();
      const title=el.querySelector('h1,h2')?.textContent.trim().slice(0,70)||el.className?.toString().slice(0,60);
      return {type:el.tagName,title,top:Math.round(r.top+scrollY),height:Math.round(r.height),width:Math.round(r.width)};
    });
    return {documentHeight:document.documentElement.scrollHeight,documentWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,
      appBox:app&&{left:Math.round(app.getBoundingClientRect().left),width:Math.round(app.getBoundingClientRect().width)},
      cards:document.querySelectorAll('.usarh-shop-card').length,visibleCards:[...document.querySelectorAll('.usarh-shop-card')].filter(c=>getComputedStyle(c).display!=='none').length,
      sections,blocks};
  });
  console.log('RHA_LAYOUT '+device.name+' '+JSON.stringify(result));
  const shots=[
    ['top',0],
    ['shop',Math.max(0,Math.round((await page.locator('.usarh-shop-controls').boundingBox()).y-160))],
    ['finder',Math.max(0,Math.round((await page.locator('#gear-finder').boundingBox()).y-160))]
  ];
  for(const [section,y] of shots){
    await page.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),y);
    await page.waitForTimeout(250);
    const binary=await page.screenshot({type:'jpeg',quality:66,animations:'disabled'});
    const folder='qa/screenshots/gear';fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(folder+'/'+device.name+'_'+section+'.jpg',binary);
    const b64=binary.toString('base64');
    const chunk=3800;let idx=0;
    console.log('RHA_IMAGE_BEGIN '+device.name+'_'+section+' '+Math.ceil(b64.length/chunk)+' '+b64.length);
    for(let off=0;off<b64.length;off+=chunk)console.log('RHA_IMAGE_PART '+device.name+'_'+section+' '+(idx++)+' '+b64.slice(off,off+chunk));
    console.log('RHA_IMAGE_END '+device.name+'_'+section);
  }
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error('RHA_ERROR',e);process.exitCode=1});
