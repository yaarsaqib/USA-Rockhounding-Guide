/* USA Rockhounding — on-demand USGS mineral research viewport v1 */
(function(){
'use strict';
if(!window.L||!L.Map||typeof L.Map.addInitHook!=='function')return;
L.Map.addInitHook(function(){
 const map=this,canvas=map.getContainer&&map.getContainer();
 if(!canvas||canvas.id!=='geoMap'||map._rhaUSGSV1)return;
 map._rhaUSGSV1=true;
 const bar=document.querySelector('#rh-app .rh-layerbar');
 const outer=document.querySelector('#rh-app .rh-map-panel');
 if(!bar||!outer)return;
 const button=document.createElement('button');
 button.type='button';
 button.textContent='USGS mineral leads';
 button.setAttribute('aria-pressed','false');
 button.title='View additional USGS mineral occurrences; not confirmed public collecting locations';
 button.dataset.usgsResearch='toggle';
 bar.appendChild(button);
 const info=document.createElement('div');info.className='rha-usgs-research-v1';
 info.hidden=true;
 const head=document.createElement('strong');
 head.textContent='USGS mineral-resource research · not collecting destinations';
 const warning=document.createElement('p');
 warning.textContent='These USGS locations document mines, prospects and mineral occurrences. They do NOT verify access, ownership, current claims or collecting permission. Use Ready-status site records for collecting leads.';
 const status=document.createElement('p');
 status.className='rha-usgs-v1-status';
 status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 status.textContent='Zoom in to research individual mineral occurrences.';
 const dismiss=document.createElement('button');dismiss.type='button';dismiss.textContent='Hide research leads';
 info.append(head,warning,status,dismiss);
 outer.appendChild(info);
 const paneName='rhaUSGSResearchV1';
 if(!map.getPane(paneName)){
   map.createPane(paneName);
   map.getPane(paneName).style.zIndex='415';
 }
 const markers=L.layerGroup();
 const known=new Set();
 function buildKnown(){
   const existing=[...((window.RH_MAP_BUNDLE||{}).records||[]),...(window.RH_MAP_SUPPLEMENT||[])];
   for(const row of existing){if(row&&row.record_id)known.add(String(row.record_id));}
 }
 // The existing initial USGS map supplement remains authoritative and is not duplicated.
 buildKnown();
 let enabled=false,request=null,timer=null,serial=0;
 function clear(){markers.clearLayers();}
 function setMessage(message){status.textContent=message;}
 function safeRow(r){
   return r&&r.status==='research'&&typeof r.id==='string'&&
     Number.isFinite(+r.latitude)&&Number.isFinite(+r.longitude)&&
     Math.abs(+r.latitude)<=90&&Math.abs(+r.longitude)<=180;
 }
 function popupElement(r){
   const root=document.createElement('div');root.className='rha-usgs-v1-popup';
   const heading=document.createElement('strong');heading.textContent=String(r.name||'USGS mineral occurrence');
   const source=document.createElement('p');source.textContent='USGS MRDS · RESEARCH ONLY';
   const details=document.createElement('p');
   details.textContent=[r.commodity?'Commodity codes: '+String(r.commodity):'',r.development?'Development: '+String(r.development):''].filter(Boolean).join(' · ');
   const warning=document.createElement('p');
   warning.textContent='Not a verified public collecting site. Confirm land manager, mining claims, closures, ownership and activity rules.';
   root.append(heading,source,details,warning);return root;
 }
 async function refresh(){
   if(!enabled)return;
   const zoom=map.getZoom(),bounds=map.getBounds();
   if(zoom<8||!bounds){clear();setMessage('Zoom to level 8 or closer to reveal individual USGS mineral-resource research records.');return;}
   const west=bounds.getWest(),east=bounds.getEast(),south=bounds.getSouth(),north=bounds.getNorth();
   if(west< -180||east>180||east-west>2.5||north-south>2.5){
     clear();setMessage('Zoom further in. USGS data loads in small geographic windows to keep the map responsive.');return;
   }
   const endpoint=window.RHA_RESEARCH_VIEW_URL;
   if(typeof endpoint!=='string'||!endpoint.startsWith(location.origin+'/wp-json/')){
     setMessage('The research feed is not configured.');return;
   }
   const mySerial=++serial;
   if(request)request.abort();
   request=new AbortController();
   const params=new URLSearchParams({west:west.toFixed(4),east:east.toFixed(4),south:south.toFixed(4),north:north.toFixed(4)});
   setMessage('Loading additional USGS mineral research locations…');
   try{
     const reply=await fetch(endpoint+'?'+params,{signal:request.signal,credentials:'same-origin',headers:{Accept:'application/json'}});
     if(!reply.ok)throw Error('Data request unavailable');
     const payload=await reply.json();
     if(mySerial!==serial||!enabled)return;
     clear();
     let shown=0,already=0;
     for(const r of (Array.isArray(payload.items)?payload.items:[])){
       if(!safeRow(r))continue;
       if(known.has(r.id)){already++;continue;}
       const m=L.circleMarker([+r.latitude,+r.longitude],{
         pane:paneName,radius:5,weight:1,color:'#764d21',fillColor:'#e7b466',fillOpacity:.84,opacity:.85
       }).bindPopup(popupElement(r),{maxWidth:300});
       markers.addLayer(m);shown++;
     }
     let message='Additional research points shown: '+shown+'.';
     if(already)message+=' '+already+' already exist in the main research dataset.';
     if(payload.more_possible)message+=' More records may exist here: zoom in to narrow the search.';
     message+=' Not proof of permission to collect.';
     setMessage(message);
   }catch(e){
     if(e.name!=='AbortError'&&enabled)setMessage('The USGS research feed is temporarily unavailable. Main atlas pins are unaffected.');
   }
 }
 function enqueue(){
   if(!enabled)return;
   if(timer)clearTimeout(timer);
   timer=setTimeout(refresh,250);
 }
 function toggle(next){
   enabled=!!next;
   button.setAttribute('aria-pressed',String(enabled));
   button.classList.toggle('is-active',enabled);
   info.hidden=!enabled;
   if(enabled){
     markers.addTo(map);
     enqueue();
   }else{
     if(timer)clearTimeout(timer);
     if(request)request.abort();
     ++serial;clear();
     if(map.hasLayer(markers))map.removeLayer(markers);
   }
 }
 button.addEventListener('click',()=>toggle(!enabled));
 dismiss.addEventListener('click',()=>toggle(false));
 map.on('moveend',enqueue);
 map.on('unload',()=>toggle(false));
 window.RHA_RESEARCH_VIEWPORT_V1_READY=true;
});
})();