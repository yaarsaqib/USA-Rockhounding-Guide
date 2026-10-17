/* USA Rockhounding — geology inspection filters and source bibliography v3 */
(function(){
'use strict';
const AGE=[['all','All ages'],['precambrian','Precambrian'],['paleozoic','Paleozoic'],['mesozoic','Mesozoic'],['cenozoic','Cenozoic'],['unknown','Unclassified']];
const ROCK=[['all','All rock types'],['sedimentary','Sedimentary'],['igneous','Igneous'],['metamorphic','Metamorphic'],['surficial','Unconsolidated'],['unknown','Unclassified']];
const ERAS={
 precambrian:/\b(?:precambrian|hadean|archaean|archean|proterozoic|neoproterozoic|mesoproterozoic|paleoproterozoic|ediacaran|cryogenian|tonian)\b/i,
 paleozoic:/\b(?:paleozoic|cambrian|ordovician|silurian|devonian|carboniferous|mississippian|pennsylvanian|permian|kasimovian|gzhelian|moscovian|bashkirian|serpukhovian|visean|tournaisian)\b/i,
 mesozoic:/mesozoic|triassic|jurassic|cretaceous|campanian|maastrichtian|cenomanian|turonian|albian|aptian|berriasian|tithonian|kimmeridgian/i,
 cenozoic:/cenozoic|paleogene|palaeogene|neogene|quaternary|paleocene|eocene|oligocene|miocene|pliocene|pleistocene|holocene|burdigalian|aquitanian|tortonian|langhian|danian|rupelian|zanclean|gelasian/i
};
const ROCKS={
 sedimentary:/sedimentary|sandstone|siltstone|mudstone|shale|limestone|dolomite|dolostone|conglomerate|chert|chalk|marlstone|marl|coal|gypsum|halite|claystone|arkose/i,
 igneous:/igneous|volcanic|plutonic|basalt|rhyolite|andesite|dacite|granite|granodiorite|diorite|gabbro|syenite|peridotite|obsidian|tuff|lava|kimberlite|pegmatite/i,
 metamorphic:/metamorphic|gneiss|schist|phyllite|slate|marble|quartzite|migmatite|amphibolite|granulite|eclogite|hornfels|serpentinite/i,
 surficial:/unconsolidated|surficial|alluvium|alluvial|colluvium|glacial till|outwash|loess|sand dune|soil|gravel deposit|terrace deposit/i
};
function field(card,key){
 const rows=card.querySelectorAll('.rha-geo-line,.rha-geo-guide-field');
 for(const row of rows){
  const b=row.querySelector('b');
  if(b && b.textContent.trim().replace(/:$/,'').toLowerCase()===key.toLowerCase()){
   const v=row.querySelector('span');return v?v.textContent.trim():'';
  }
 }
 return '';
}
function categories(card,kind){
 const out=new Set(),terms=kind==='age'?ERAS:ROCKS;
 const source=kind==='age'?[field(card,'Age'),field(card,'Oldest interval'),field(card,'Older interval')].join(' '):
  [field(card,'Rock type'),field(card,'Lithology'),field(card,'Unit')].join(' ');
 Object.keys(terms).forEach(k=>{if(terms[k].test(source))out.add(k);});
 if(kind==='age'){
  const a=Number(field(card,'Youngest age (Ma)')),b=Number(field(card,'Oldest age (Ma)'));
  if(Number.isFinite(a)&&Number.isFinite(b)&&a>=0&&b>=0&&a+b>0&&Math.max(a,b)<4700){
   const lo=Math.min(a,b),hi=Math.max(a,b);
   [['cenozoic',0,66],['mesozoic',66,252],['paleozoic',252,541],['precambrian',541,4600]].forEach(g=>{if(lo<g[2]&&hi>=g[1])out.add(g[0]);});
  }
 }
 if(!out.size)out.add('unknown');return out;
}
function dropdown(choices,description){
 const input=document.createElement('select');input.setAttribute('aria-label',description);
 for(const [value,label] of choices){const opt=document.createElement('option');opt.value=value;opt.textContent=label;input.appendChild(opt);}
 return input;
}
function labeled(input,text){
 const label=document.createElement('label');label.className='rha-geo-v3-label';
 const span=document.createElement('span');span.textContent=text;label.append(span,input);return label;
}
function sourceLink(id){
 return 'https://macrostrat.org/api/v2/defs/sources?source_id='+encodeURIComponent(id);
}
function linkElement(id,text){
 const a=document.createElement('a');a.href=sourceLink(id);a.target='_blank';a.rel='noopener noreferrer';a.textContent=text;return a;
}
function cite(card){
 if(card.dataset.rhaGeoV3Source)return;
 const id=field(card,'Source ID');
 if(!/^[0-9]{1,8}$/.test(id))return;
 card.dataset.rhaGeoV3Source='yes';
 const wrap=document.createElement('div');wrap.className='rha-geo-v3-source';
 const toggle=document.createElement('button');toggle.type='button';toggle.textContent='Show original map reference';
 const detail=document.createElement('div');detail.className='rha-geo-v3-citation';detail.hidden=true;
 wrap.append(toggle,detail);card.appendChild(wrap);
 toggle.addEventListener('click',async()=>{
  if(!detail.hidden){detail.hidden=true;toggle.textContent='Show original map reference';return;}
  toggle.disabled=true;toggle.textContent='Loading citation…';detail.replaceChildren();
  try{
   const endpoint=window.RHA_GEOLOGY_SOURCE_ENDPOINT;
   if(typeof endpoint!=='string'||!endpoint.startsWith(location.origin+'/wp-json/'))throw Error('Not configured');
   const response=await fetch(endpoint+'?source_id='+encodeURIComponent(id),{headers:{Accept:'application/json'},credentials:'same-origin'});
   if(!response.ok)throw Error('Source unavailable');
   const data=await response.json();
   const parts=[data.ref,data.title||data.name,data.authors,data.year||data.pub_year,data.publisher]
    .filter(x=>typeof x==='string'&&x.trim());
   const p=document.createElement('p');p.textContent=parts.length?[...new Set(parts)].join(' · '):'Macrostrat map source ID '+id;
   detail.appendChild(p);
  }catch(e){
   const p=document.createElement('p');p.textContent='Full bibliography unavailable for Macrostrat source '+id+'.';detail.appendChild(p);
  }
  detail.appendChild(linkElement(id,'Open original map catalog record'));
  detail.hidden=false;toggle.disabled=false;toggle.textContent='Hide original map reference';
 });
}
function mount(panel){
 if(panel.dataset.rhaGeologyV3==='ready')return;
 const results=panel.querySelector('.rha-geo-result,.rha-geo-guide-results');
 const controls=panel.querySelector('.rha-geo-actions,.rha-geo-guide-actions');
 if(!results||!controls)return;
 panel.dataset.rhaGeologyV3='ready';
 const box=document.createElement('div');box.className='rha-geo-v3-controls';
 const era=dropdown(AGE,'Geological era filter for inspected rock units');
 const rock=dropdown(ROCK,'Rock type filter for inspected rock units');
 box.append(labeled(era,'Geological era'),labeled(rock,'Rock type'));
 const note=document.createElement('p');note.className='rha-geo-v3-note';
 note.textContent='These filters apply only to the inspected units below. The colored map layer is unchanged; access and collecting rules are separate.';
 box.appendChild(note);controls.insertAdjacentElement('afterend',box);
 const summary=document.createElement('div');summary.className='rha-geo-v3-count';summary.setAttribute('role','status');
 results.insertAdjacentElement('beforebegin',summary);
 function filter(){
  const cards=[...results.querySelectorAll(':scope > .rha-geo-unit,:scope > .rha-geo-guide-unit')];
  let showing=0;
  for(const c of cards){
   cite(c);
   const pass=(era.value==='all'||categories(c,'age').has(era.value))&&(rock.value==='all'||categories(c,'rock').has(rock.value));
   c.hidden=!pass;if(pass)showing++;
  }
  summary.textContent=cards.length?'Showing '+showing+' of '+cards.length+' inspected unit records.'+(showing===0?' Change filters or inspect another point.':''):'';
 }
 era.addEventListener('change',filter);rock.addEventListener('change',filter);
 let queued=false;
 new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(()=>{queued=false;filter();});}}).observe(results,{childList:true});
 filter();
}
function scan(){document.querySelectorAll('.rha-geology-panel,.rha-geology-guide-panel').forEach(mount);}
function ready(){
 scan();
 if(document.querySelector('.rha-geology-panel,.rha-geology-guide-panel'))return;
 const observer=new MutationObserver(()=>{scan();if(document.querySelector('.rha-geology-panel,.rha-geology-guide-panel'))observer.disconnect();});
 observer.observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
