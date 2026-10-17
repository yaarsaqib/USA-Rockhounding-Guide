/* Geological Intelligence Guide Map v2 — reuse original location map; no second map */
(function(){
  'use strict';
  if (!window.L || !L.Map || typeof L.Map.addInitHook!=='function') return;
  L.Map.addInitHook(function(){
    var map=this, container=map.getContainer && map.getContainer();
    if(!container || container.id!=='rha-mt-location-map' || map._rhaGuideGeology)return;
    map._rhaGuideGeology=true;
    var section=container.closest('.rha-mt-location-map-section');
    var controls=section && section.querySelector('.rha-mt-location-map-controls');
    if(!section || !controls) return;
    var block=document.createElement('div');
    block.className='rha-geology-guide-controls';
    var title=document.createElement('strong');
    title.textContent='Geological research';
    var layerBtn=document.createElement('button');
    layerBtn.type='button';layerBtn.textContent='Geology layer';layerBtn.setAttribute('aria-pressed','false');
    layerBtn.title='Mapped bedrock/rock units; not collecting permission';
    var inspectBtn=document.createElement('button');
    inspectBtn.type='button';inspectBtn.textContent='Inspect: Off';inspectBtn.setAttribute('aria-pressed','false');
    block.append(title,layerBtn,inspectBtn);
    controls.appendChild(block);
    var panel=document.createElement('aside');
    panel.className='rha-geology-guide-panel';
    panel.hidden=true;
    panel.setAttribute('aria-label','Mapped geological context');
    var head=document.createElement('div');head.className='rha-geo-guide-head';
    var label=document.createElement('strong');label.textContent='Mapped geological context';
    var close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Close geology panel');
    head.append(label,close);panel.appendChild(head);
    var info=document.createElement('p');info.textContent='Rock formations and ages are scientific map context, not evidence of accessible specimens or legal collecting permission.';
    panel.appendChild(info);
    var actions=document.createElement('div');actions.className='rha-geo-guide-actions';
    var guideBtn=document.createElement('button');guideBtn.type='button';guideBtn.textContent='Geology at guide point';
    // Read the source payload of the existing guide map, never a guessed pin.
    var stateData=['MT','AL','AR','AZ','AK','CO','CA','OR','WA','WY','NV','UT','ID','NM','TX']
      .map(function(code){return window['RHA'+code+'LocationMap'];})
      .find(function(value){return value && (value.primary || value.center);});
    var primary=stateData && stateData.primary;
    var hasGuidePoint=!!(primary && primary.exact===true && Number.isFinite(+primary.lat) && Number.isFinite(+primary.lon));
    if(hasGuidePoint)actions.appendChild(guideBtn);
    var opacityLabel=document.createElement('label');opacityLabel.textContent='Layer opacity ';
    var opacity=document.createElement('input');opacity.type='range';opacity.min='20';opacity.max='90';opacity.value='60';opacity.setAttribute('aria-label','Geology opacity');
    opacityLabel.appendChild(opacity);actions.appendChild(opacityLabel);
    panel.appendChild(actions);
    var status=document.createElement('p');status.className='rha-geo-guide-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.textContent='Select “Inspect: On”, then tap open ground on the existing map.';
    panel.appendChild(status);
    var result=document.createElement('div');result.className='rha-geo-guide-results';result.hidden=true;panel.appendChild(result);
    var credit=document.createElement('p');credit.className='rha-geo-guide-credit';credit.textContent='Geological maps and descriptions: Macrostrat (CC BY 4.0). Check source documentation before field use.';
    panel.appendChild(credit);
    container.insertAdjacentElement('afterend',panel);
    map.createPane('rhaGuideGeologyPane');
    var pane=map.getPane('rhaGuideGeologyPane');pane.style.zIndex='315';pane.style.pointerEvents='none';
    var geology=L.tileLayer('https://tiles.macrostrat.org/carto/{z}/{x}/{y}.png',{
      pane:'rhaGuideGeologyPane',opacity:.60,minZoom:4,maxZoom:19,maxNativeZoom:15,
      attribution:'Geological map: Macrostrat (CC BY 4.0)'
    });
    var inspecting=false,controller=null,sequence=0;
    function setInspection(enabled){
      inspecting=enabled;
      inspectBtn.textContent='Inspect: '+(enabled?'On':'Off');
      inspectBtn.setAttribute('aria-pressed',String(enabled));
      container.classList.toggle('rha-geo-guide-inspect',enabled);
      status.textContent=enabled?'Tap open ground to see mapped geology; existing location pins still open their usual popups.':'Choose “Inspect: On” to identify mapped geology at any visible point.';
    }
    function setVisible(enabled){
      if(enabled){geology.addTo(map);panel.hidden=false;}
      else{if(map.hasLayer(geology))map.removeLayer(geology);panel.hidden=true;setInspection(false);if(controller)controller.abort();}
      layerBtn.classList.toggle('is-on',enabled);
      layerBtn.setAttribute('aria-pressed',String(enabled));
    }
    function line(root,heading,value){
      if(value===undefined||value===null||value==='')return;
      var row=document.createElement('p');row.className='rha-geo-guide-field';
      var b=document.createElement('b');b.textContent=heading+': ';
      var span=document.createElement('span');span.textContent=Array.isArray(value)?value.join(', '):String(value);
      row.append(b,span);root.appendChild(row);
    }
    async function inspect(lat,lng,fromGuide){
      if(controller)controller.abort();
      controller=new AbortController();
      var callId=++sequence;
      result.replaceChildren();result.hidden=true;
      status.textContent='Loading mapped rock units…';
      var url=window.RHA_GEOLOGY_GUIDE_API;
      if(typeof url!=='string'||!(url.startsWith('/wp-json/')||url.startsWith(location.origin+'/wp-json/'))){
        status.textContent='Geology lookup is not configured.';return;
      }
      var qs='?lat='+encodeURIComponent(lat.toFixed(5))+'&lng='+encodeURIComponent(lng.toFixed(5));
      try{
        var response=await fetch(url+qs,{signal:controller.signal,credentials:'same-origin',headers:{Accept:'application/json'}});
        if(!response.ok)throw new Error('Data unavailable');
        var data=await response.json();
        if(callId!==sequence)return;
        var units=Array.isArray(data.units)?data.units:[];
        status.textContent=(fromGuide?'Guide point':'Selected map point')+': '+lat.toFixed(4)+', '+lng.toFixed(4);
        if(!units.length){status.textContent+=' — No mapped formation information returned.';return;}
        units.slice(0,3).forEach(function(unit,index){
          var card=document.createElement('div');card.className='rha-geo-guide-unit';
          var heading=document.createElement('strong');heading.textContent='Mapped geology · source '+(index+1);
          card.appendChild(heading);
          line(card,'Unit',unit.name||unit.unit_name||unit.strat_name);
          line(card,'Age',unit.t_int_name||unit.age);
          line(card,'Older interval',unit.b_int_name);
          line(card,'Youngest age (Ma)',unit.best_t_age??unit.best_age_top);
          line(card,'Oldest age (Ma)',unit.best_b_age??unit.best_age_bottom);
          line(card,'Lithology',unit.lith||unit.liths);
          line(card,'Description',unit.descrip);
          line(card,'Source',unit.source);
          line(card,'Source ID',unit.source_id);
          line(card,'Map ID',unit.map_id);
          result.appendChild(card);
        });
        result.hidden=false;
      }catch(err){
        if(err.name!=='AbortError' && callId===sequence){
          status.textContent='Geological lookup is temporarily unavailable. The location map and its collecting-status information are unaffected.';
        }
      }
    }
    layerBtn.addEventListener('click',function(){setVisible(!map.hasLayer(geology));});
    close.addEventListener('click',function(){setVisible(false);});
    inspectBtn.addEventListener('click',function(){if(!map.hasLayer(geology))setVisible(true);setInspection(!inspecting);});
    opacity.addEventListener('input',function(){geology.setOpacity(Number(opacity.value)/100);});
    if(hasGuidePoint)guideBtn.addEventListener('click',function(){
      if(!map.hasLayer(geology))setVisible(true);
      inspect(+primary.lat,+primary.lon,true);
    });
    map.on('click',function(event){
      if(!inspecting||!map.hasLayer(geology))return;
      // Marker events are handled by Leaflet's original handlers. Geology only
      // responds to map clicks, leaving existing pin popups untouched.
      inspect(event.latlng.lat,event.latlng.lng,false);
    });
    window.RHA_GEOLOGY_GUIDE_V2_READY=true;
  });
})();
