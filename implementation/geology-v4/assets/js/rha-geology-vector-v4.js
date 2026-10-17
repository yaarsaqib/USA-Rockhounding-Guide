/* USA Rockhounding - real filtered Macrostrat vector polygons v4 */
(function(){
'use strict';
if(!window.L||!L.Map||typeof L.Map.addInitHook!=='function')return;

const ERAS={
 precambrian:[541,4600],paleozoic:[252,541],mesozoic:[66,252],cenozoic:[0,66]
};
const AGEWORDS={
 precambrian:/\b(?:precambrian|hadean|archaean|archean|proterozoic|ediacaran|cryogenian|tonian)\b/i,
 paleozoic:/\b(?:paleozoic|cambrian|ordovician|silurian|devonian|carboniferous|mississippian|pennsylvanian|permian|kasimovian|gzhelian|moscovian|bashkirian)\b/i,
 mesozoic:/\b(?:mesozoic|triassic|jurassic|cretaceous|campanian|maastrichtian|cenomanian|turonian|albian|aptian)\b/i,
 cenozoic:/\b(?:cenozoic|paleogene|palaeogene|neogene|quaternary|paleocene|eocene|oligocene|miocene|pliocene|pleistocene|holocene|burdigalian|tortonian|danian|rupelian)\b/i
};
const ROCKWORDS={
 sedimentary:/\b(?:sedimentary|sandstone|siltstone|mudstone|shale|limestone|dolomite|dolostone|conglomerate|chert|chalk|marlstone|coal|gypsum|halite|claystone)\b/i,
 igneous:/\b(?:igneous|volcanic|plutonic|basalt|rhyolite|andesite|dacite|granite|granodiorite|diorite|gabbro|syenite|peridotite|obsidian|tuff|lava|pegmatite)\b/i,
 metamorphic:/\b(?:metamorphic|gneiss|schist|phyllite|slate|marble|quartzite|migmatite|amphibolite|granulite|eclogite|hornfels|serpentinite)\b/i,
 surficial:/\b(?:unconsolidated|surficial|alluvium|alluvial|colluvium|glacial till|outwash|loess|sand dune|soil|gravel deposit|terrace deposit)\b/i
};
const TILE='https://tiles.macrostrat.org/carto/{z}/{x}/{y}.mvt';
const RASTER='tiles.macrostrat.org/carto/';
function num(value){
 if(value===null||value===undefined||value==='')return null;
 const n=Number(value);return Number.isFinite(n)&&n>=0&&n<4700?n:null;
}
function ageMatches(f,era){
 if(era==='all')return true;
 const low=num(f.best_t_age??f.best_age_top),high=num(f.best_b_age??f.best_age_bottom);
 if(low!==null&&high!==null){
  const min=Math.min(low,high),max=Math.max(low,high),span=ERAS[era];
  return span?min<span[1]&&max>=span[0]:era==='unknown';
 }
 const raw=[f.age,f.t_int_name,f.b_int_name,f.t_int,f.b_int,f.name].filter(Boolean).join(' ');
 const matched=Object.keys(AGEWORDS).filter(key=>AGEWORDS[key].test(raw));
 return era==='unknown'?matched.length===0:matched.includes(era);
}
function rockMatches(f,rock){
 if(rock==='all')return true;
 const raw=[f.lith,f.name,f.strat_name].filter(Boolean).join(' ');
 const matched=Object.keys(ROCKWORDS).filter(key=>ROCKWORDS[key].test(raw));
 return rock==='unknown'?matched.length===0:matched.includes(rock);
}
function unitColor(color){
 const value=String(color||'').trim();
 if(/^#?[0-9a-f]{6}$/i.test(value))return value[0]==='#'?value:'#'+value;
 return '#347d82';
}
function make(tag,cls,text){
 const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;
}
function waitForSelectors(panel,callback){
 const selectors=['select[aria-label="Geological era filter for inspected rock units"]','select[aria-label="Rock type filter for inspected rock units"]'];
 let observer=null;
 function check(){
  const era=panel.querySelector(selectors[0]),rock=panel.querySelector(selectors[1]);
  if(!era||!rock)return false;
  if(observer)observer.disconnect();
  callback(era,rock);return true;
 }
 if(!check()){
  observer=new MutationObserver(check);
  observer.observe(panel,{subtree:true,childList:true});
 }
}
L.Map.addInitHook(function(){
 const map=this,container=map.getContainer&&map.getContainer();
 if(!container||!['geoMap','rha-mt-location-map'].includes(container.id)||map._rhaVectorV4)return;
 map._rhaVectorV4=true;
 const section=container.id==='geoMap'?container.closest('#rh-app'):container.closest('.rha-mt-location-map-section');
 if(!section)return;
 const panel=section.querySelector('.rha-geology-panel,.rha-geology-guide-panel');
 if(!panel)return;
 const controls=panel.querySelector('.rha-geo-actions,.rha-geo-guide-actions');
 if(!controls)return;
 const block=make('div','rha-geo-v4-block');
 const action=make('button','rha-geo-v4-toggle','Filter actual map polygons: Off');
 action.type='button';action.setAttribute('aria-pressed','false');
 action.setAttribute('aria-label','Filter geological polygons on the map');
 const status=make('div','rha-geo-v4-status','Select this mode to draw only matching geological polygons.');
 status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const expl=make('p','rha-geo-v4-description','Uses real Macrostrat vector polygons. The era and rock-type selectors control both mapped polygons and inspected records while this mode is on. Collecting-permission pins stay unchanged.');
 block.append(action,expl,status);
 controls.insertAdjacentElement('afterend',block);
 let enabled=false,vector=null,tileOK=0,tileErrors=0,era='all',rock='all';
 let originalRaster=new Map(),lastStatus='',hasFiltered=false;
 function notice(value){if(lastStatus!==value){lastStatus=value;status.textContent=value;}}
 function rasterLayers(){
  const matched=[];
  map.eachLayer(function(layer){
   if(typeof layer._url==='string'&&layer._url.includes(RASTER)&&/\.png/.test(layer._url))matched.push(layer);
  });
  return matched;
 }
 function obscureRaster(){
  rasterLayers().forEach(function(layer){
   if(typeof layer.setOpacity!=='function')return;
   if(!originalRaster.has(layer))originalRaster.set(layer,layer.options.opacity==null?1:layer.options.opacity);
   layer.setOpacity(0);
  });
 }
 function restoreRaster(){
  originalRaster.forEach((opacity,layer)=>{
   if(map.hasLayer(layer)&&typeof layer.setOpacity==='function')layer.setOpacity(opacity);
  });
  originalRaster.clear();
 }
 function updateAppearance(){
  action.classList.toggle('is-on',enabled);
  action.setAttribute('aria-pressed',String(enabled));
  action.textContent=enabled?'Filter actual map polygons: On':'Filter actual map polygons: Off';
  const v3Note=panel.querySelector('.rha-geo-v3-note');
  if(v3Note)v3Note.textContent=enabled?
   'The filters now apply to visible map polygons AND inspected records. Unmatched polygons are hidden. Rockhounding pin statuses are unchanged.':
   'The filters apply to inspected rock-unit results only. Enable polygon filtering to filter the actual map shapes.';
 }
 function style(props){
  if(!ageMatches(props,era)||!rockMatches(props,rock))return {fill:false,stroke:false,weight:0,fillOpacity:0,opacity:0};
  return {fill:true,fillColor:unitColor(props.color),fillOpacity:.64,stroke:true,
    color:'#52615e',weight:.35,opacity:.25};
 }
 function redraw(){
  if(!vector||!enabled)return;
  vector.options.vectorTileLayerStyles.units=style;
  if(typeof vector.redraw==='function')vector.redraw();
  hasFiltered=era!=='all'||rock!=='all';
  notice('Updating geological polygons'+(hasFiltered?' for selected filters':'')+'…');
 }
 function toggle(enabledNext){
  if(enabled===enabledNext)return;
  if(enabledNext && (!L.vectorGrid||typeof L.vectorGrid.protobuf!=='function')){
   notice('The vector map engine was not loaded. The original geology raster remains available.');
   return;
  }
  enabled=enabledNext;tileOK=0;tileErrors=0;
  if(enabled){
   try{
    // Vector polygons sit under land/claims overlays and all the existing pins.
    if(!map.getPane('rhaGeoVectorV4')){
     map.createPane('rhaGeoVectorV4');
     const pane=map.getPane('rhaGeoVectorV4');
     pane.style.zIndex='317';pane.style.pointerEvents='none';
    }
    vector=L.vectorGrid.protobuf(TILE,{
      pane:'rhaGeoVectorV4',minZoom:5,maxZoom:19,maxNativeZoom:14,
      rendererFactory:L.canvas.tile,interactive:false,
      vectorTileLayerStyles:{units:style,lines:{weight:0,opacity:0}},
      attribution:'Geological polygon data: Macrostrat / original map providers (CC BY 4.0)'
    });
    vector.on('tileload',()=>{
      tileOK++;
      if(enabled)notice((era==='all'&&rock==='all'?'Showing mapped geological polygons.':'Showing polygons matching the selected geology filters.')+
        ' Geological units are not collecting permissions.');
    });
    vector.on('tileerror',()=>{
      tileErrors++;
      if(enabled&&tileOK===0&&tileErrors>=3){
        toggle(false);
        notice('Geological vector tiles could not load. Original geology layer has been restored.');
      }
    });
    if(map.getZoom()>=5){
      obscureRaster();
      vector.addTo(map);
      notice('Loading real geological polygons…');
    }else notice('Zoom to a state (zoom level 5+) to see filtered geological polygons. Original raster remains visible.');
   }catch(e){
    enabled=false;if(vector&&map.hasLayer(vector))map.removeLayer(vector);vector=null;
    restoreRaster();notice('Unable to load vector polygons; original geology layer preserved.');
   }
  }else{
   if(vector&&map.hasLayer(vector))map.removeLayer(vector);
   vector=null;restoreRaster();
   notice('Polygon filter off. The original geology raster is available; inspection filters remain active.');
  }
  updateAppearance();
 }
 waitForSelectors(panel,function(ageSelect,rockSelect){
  function selected(){
   era=ageSelect.value||'all';rock=rockSelect.value||'all';
   redraw();
  }
  ageSelect.addEventListener('change',selected);
  rockSelect.addEventListener('change',selected);
  selected();
  updateAppearance();
 });
 action.addEventListener('click',()=>toggle(!enabled));
 map.on('zoomend',()=>{
  if(!enabled)return;
  if(map.getZoom()<5){
   if(vector&&map.hasLayer(vector))map.removeLayer(vector);
   restoreRaster();
   notice('Zoom into a state (zoom level 5+) to display filtered polygon shapes.');
  }else{
   if(vector&&!map.hasLayer(vector)){obscureRaster();vector.addTo(map);}
   notice('Loading or updating geological polygons…');
  }
 });
 map.on('layeradd',function(e){
  if(!enabled||!e.layer||typeof e.layer._url!=='string')return;
  if(e.layer._url.includes(RASTER)&&/\.png/.test(e.layer._url))obscureRaster();
 });
 panel.addEventListener('click',function(e){
  if(e.target.closest('[data-geo-close],.rha-geo-guide-head button[aria-label="Close geology panel"]')){
   toggle(false);
  }
 });
 section.addEventListener('click',function(event){
  const t=event.target.closest('[data-rha-geology="toggle"],.rha-geology-guide-controls button');
  if(!t || t===action)return;
  queueMicrotask(function(){if(panel.hidden && enabled)toggle(false);});
 });
 map.on('unload',function(){toggle(false);});
 updateAppearance();
 window.RHA_GEOLOGY_VECTOR_V4_READY=true;
});
})();
