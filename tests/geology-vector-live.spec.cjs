const {test,expect}=require('@playwright/test');
const pages=[
 ['national map','/rockhounding-map/','national'],
 ['Montana Ruby Reservoir','/rockhounding-map/montana/ruby-reservoir-garnet-shoreline/','guide'],
 ['Alabama Gold Camp','/rockhounding-map/alabama/alabama-gold-camp-public-prospecting-program/','guide'],
 ['Alaska Bertha Creek','/rockhounding-map/alaska/bertha-creek-recreational-gold-panning-area/','guide']
];
for(const [name,path,type] of pages){
test(name+' renders filtered geological shapes without duplicating maps',async({page})=>{
 const jsErrors=[];page.on('pageerror',err=>jsErrors.push(err.message));
 await page.goto(path,{waitUntil:'domcontentloaded'});
 const map=type==='national'?page.locator('#geoMap'):page.locator('#rha-mt-location-map');
 await expect(map).toHaveCount(1);
 const geology=type==='national'?page.locator('#rh-app [data-rha-geology="toggle"]'):
  page.locator('.rha-geology-guide-controls button').filter({hasText:'Geology layer'});
 await expect(geology).toBeVisible();
 await geology.click();
 const panel=type==='national'?page.locator('.rha-geology-panel'):page.locator('.rha-geology-guide-panel');
 await expect(panel).toBeVisible();
 const polygon=panel.getByRole('button',{name:'Filter geological polygons on the map'});
 await expect(polygon).toBeVisible();
 const era=panel.getByRole('combobox',{name:'Geological era filter for inspected rock units'});
 const rock=panel.getByRole('combobox',{name:'Rock type filter for inspected rock units'});
 await expect(era).toBeVisible();
 await expect(rock).toBeVisible();
 await era.selectOption('paleozoic');
 await rock.selectOption('sedimentary');
 await polygon.click();
 await expect(polygon).toHaveAttribute('aria-pressed','true');
 if(type==='national'){
  // National view may be below vector minimum zoom; zoom into a state.
  for(let i=0;i<3;i++)await page.locator('#zoomIn').click();
 }
 await expect.poll(async()=>page.evaluate(()=>{
   const pane=document.querySelector('[class*="rhaGeoVectorV4-pane"]');
   return !!pane && pane.querySelectorAll('canvas').length>0;
 }),{timeout:18000}).toBe(true);
 await expect(panel.locator('.rha-geo-v4-status')).toContainText(/Showing|Loading|updating/);
 await expect(map).toHaveCount(1);
 expect(jsErrors.filter(e=>e.includes('rha-geology-vector-v4'))).toEqual([]);
 await polygon.click();
 await expect(polygon).toHaveAttribute('aria-pressed','false');
 await expect(map).toHaveCount(1);
});
}
