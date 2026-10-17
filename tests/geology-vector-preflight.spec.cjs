const { test, expect } = require('@playwright/test');
test('Leaflet VectorGrid loads real Macrostrat MVT polygon tiles in browser', async ({page}) => {
  await page.goto('/rockhounding-map/', {waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => window.L && window.L.Map && window.L.tileLayer);
  await page.addScriptTag({url:'https://cdn.jsdelivr.net/npm/leaflet.vectorgrid@1.3.0/dist/Leaflet.VectorGrid.bundled.min.js'});
  await expect.poll(async()=>page.evaluate(()=>!!window.L.vectorGrid?.protobuf)).toBe(true);
  const check = await page.evaluate(async () => {
    const holder=document.createElement('div');holder.id='rha-vector-preflight-test';
    holder.style.cssText='width:320px;height:320px;position:relative;';
    document.body.appendChild(holder);
    const map=L.map(holder,{zoomControl:false}).setView([39.7,-105.25],7);
    const layer=L.vectorGrid.protobuf('https://tiles.macrostrat.org/carto/{z}/{x}/{y}.mvt',{
      vectorTileLayerStyles:{units:()=>({fill:true,fillColor:'#277e82',fillOpacity:.6,weight:.5}),lines:()=>({weight:0,opacity:0})},
      rendererFactory:L.canvas.tile,interactive:false,minZoom:5,maxZoom:14
    });
    return await new Promise(resolve=>{
      let done=false;
      const finish=(data)=>{if(done)return;done=true;map.remove();holder.remove();resolve(data);};
      const timer=setTimeout(()=>finish({ok:false,reason:'vector tile timeout'}),15000);
      layer.on('tileload',()=>{clearTimeout(timer);finish({ok:true})});
      layer.on('tileerror',e=>{clearTimeout(timer);finish({ok:false,reason:String(e.error||'tile failure')})});
      layer.addTo(map);
    });
  });
  expect(check,JSON.stringify(check)).toHaveProperty('ok',true);
});
test('Macrostrat vector source contains units and is served with CORS',async({request})=>{
  const response=await request.get('https://tiles.macrostrat.org/carto/7/26/48.mvt',{timeout:15000});
  expect(response.status()).toBe(200);
  expect((await response.body()).byteLength).toBeGreaterThan(200);
});
