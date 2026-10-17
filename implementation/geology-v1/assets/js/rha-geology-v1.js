/* USA Rockhounding geological intelligence overlay v1 */
(function(){
  'use strict';
  if (!window.L || !L.Map || typeof L.Map.addInitHook !== 'function') return;
  L.Map.addInitHook(function(){
    var map = this;
    if (!map.getContainer || map.getContainer().id !== 'geoMap' || map._rhaGeologyReady) return;
    map._rhaGeologyReady = true;
    var mapWrap = document.getElementById('mapWrap');
    var toolbar = document.querySelector('#rh-app .rh-layerbar');
    if (!mapWrap || !toolbar) return;
    map.createPane('rhaGeologyPane');
    var pane = map.getPane('rhaGeologyPane');
    pane.style.zIndex = '315';
    pane.style.pointerEvents = 'none';
    var layer = L.tileLayer('https://tiles.macrostrat.org/carto/{z}/{x}/{y}.png', {
      pane:'rhaGeologyPane', opacity:.60, minZoom:3, maxZoom:19, maxNativeZoom:15,
      attribution:'Geological map: Macrostrat (CC BY 4.0)'
    });
    var button = document.createElement('button');
    button.type='button';
    button.dataset.rhaGeology='toggle';
    button.textContent='Geology';
    button.setAttribute('aria-pressed','false');
    button.title='Show mapped geological units (research context, not collecting permission)';
    toolbar.appendChild(button);
    var panel=document.createElement('section');
    panel.className='rha-geology-panel';
    panel.hidden=true;
    panel.setAttribute('aria-label','Geological intelligence');
    panel.innerHTML='<div class="rha-geo-head"><strong>Geological intelligence</strong><button type="button" data-geo-close aria-label="Hide geology overlay">×</button></div>'+
      '<p class="rha-geo-disclaimer">Mapped rock units are geological context only. They do not establish specimen locations, land access, or collecting permission.</p>'+
      '<div class="rha-geo-actions"><button type="button" data-geo-inspect aria-pressed="false">Inspect rock units: Off</button><label>Opacity <input type="range" data-geo-opacity min="20" max="90" value="60"></label></div>'+
      '<div class="rha-geo-status" role="status" aria-live="polite">Enable inspection, then tap open ground on the map to identify mapped geology.</div>'+
      '<div class="rha-geo-result" hidden></div>'+
      '<div class="rha-geo-credit">Geologic map and unit interpretation: Macrostrat, CC BY 4.0. Check original source-map references before field use.</div>';
    mapWrap.appendChild(panel);
    L.DomEvent.disableClickPropagation(panel);
    L.DomEvent.disableScrollPropagation(panel);
    var inspectButton=panel.querySelector('[data-geo-inspect]');
    var opacity=panel.querySelector('[data-geo-opacity]');
    var status=panel.querySelector('.rha-geo-status');
    var result=panel.querySelector('.rha-geo-result');
    var isInspecting=false;
    var activeRequest=null;
    function setInspection(active){
      isInspecting=active;
      inspectButton.textContent='Inspect rock units: '+(active?'On':'Off');
      inspectButton.setAttribute('aria-pressed',String(active));
      map.getContainer().classList.toggle('rha-geology-inspecting',active);
      status.textContent=active?'Tap open ground to see the mapped rock unit. Tap a pin to see its normal location popup.':'Enable inspection, then tap open ground on the map.';
    }
    function setVisible(on){
      if (on) {layer.addTo(map);panel.hidden=false;}
      else {if(map.hasLayer(layer))map.removeLayer(layer);panel.hidden=true;setInspection(false); if(activeRequest)activeRequest.abort();}
      button.classList.toggle('is-active',on);
      button.setAttribute('aria-pressed',String(on));
    }
    button.addEventListener('click',function(){setVisible(!map.hasLayer(layer));});
    panel.querySelector('[data-geo-close]').addEventListener('click',function(){setVisible(false);});
    inspectButton.addEventListener('click',function(){setInspection(!isInspecting);});
    opacity.addEventListener('input',function(){layer.setOpacity(Number(opacity.value)/100);});
    function addText(container,label,value){
      if(value===undefined||value===null||value==='')return;
      var line=document.createElement('div');
      line.className='rha-geo-line';
      var b=document.createElement('b'); b.textContent=label+': ';
      var s=document.createElement('span');s.textContent=Array.isArray(value)?value.join(', '):String(value);
      line.appendChild(b);line.appendChild(s);container.appendChild(line);
    }
    map.on('click',async function(e){
      if(!map.hasLayer(layer)||!isInspecting)return;
      if(activeRequest)activeRequest.abort();
      activeRequest=new AbortController();
      result.hidden=true;result.replaceChildren();
      status.textContent='Checking geological map data…';
      var endpoint=window.RHA_GEOLOGY_POINT_ENDPOINT;
      if(typeof endpoint!=='string' || !endpoint.startsWith('/wp-json/') && !endpoint.startsWith(location.origin+'/wp-json/')){
        status.textContent='Geological lookup is not configured.';
        return;
      }
      var qs='?lat='+encodeURIComponent(e.latlng.lat.toFixed(5))+'&lng='+encodeURIComponent(e.latlng.lng.toFixed(5));
      try {
        var response=await fetch(endpoint+qs,{signal:activeRequest.signal,credentials:'same-origin',headers:{Accept:'application/json'}});
        if(!response.ok)throw new Error('Lookup unavailable');
        var data=await response.json();
        if(!Array.isArray(data.units)||!data.units.length){
          status.textContent='No mapped rock-unit description was returned for this point.';
          return;
        }
        status.textContent='Mapped geology at '+e.latlng.lat.toFixed(4)+', '+e.latlng.lng.toFixed(4);
        data.units.slice(0,3).forEach(function(u,index){
          var card=document.createElement('div');card.className='rha-geo-unit';
          var heading=document.createElement('strong');heading.textContent='Map source '+(index+1);card.appendChild(heading);
          addText(card,'Unit',u.name||u.unit_name||u.strat_name);
          addText(card,'Age',u.t_int_name||u.age);
          addText(card,'Oldest interval',u.b_int_name);
          addText(card,'Youngest age (Ma)',u.best_t_age??u.best_age_top);
          addText(card,'Oldest age (Ma)',u.best_b_age??u.best_age_bottom);
          addText(card,'Rock type',u.lith||u.liths);
          addText(card,'Description',u.descrip);
          addText(card,'Source',u.source);
          addText(card,'Source ID',u.source_id);
          addText(card,'Map ID',u.map_id);
          result.appendChild(card);
        });
        result.hidden=false;
      } catch(err) {
        if(err.name!=='AbortError')status.textContent='Geological lookup temporarily unavailable. Existing rockhounding map is unaffected.';
      }
    });
    window.RHA_GEOLOGY_LAYER_READY=true;
  });
})();
