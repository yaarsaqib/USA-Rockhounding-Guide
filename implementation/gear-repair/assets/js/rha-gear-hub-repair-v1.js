/* USA Rockhounding Gear Hub — accessible browsing and missing-image handling v1 */
(function(){
'use strict';
function init(){
 const app=document.querySelector('.usarh-gear-app');
 if(!app||app.dataset.rhaGearEnhanced)return;
 const grid=app.querySelector('#usarh-shop-products');
 if(!grid)return;
 app.dataset.rhaGearEnhanced='true';
 const cards=[...grid.querySelectorAll('.usarh-shop-card')];
 const search=app.querySelector('[data-gear-shop-search]');
 const category=app.querySelector('[data-gear-shop-category]');
 if(!cards.length)return;

 const bar=document.createElement('div');bar.className='rha-gear-catalog-bar';
 const intro=document.createElement('div');
 const title=document.createElement('strong');title.textContent='Browse the gear catalog';
 const subtitle=document.createElement('span');subtitle.textContent=cards.length+' catalog entries · start with the task' ;
 intro.append(title,subtitle);
 const top=document.createElement('a');top.href='#usarh-shop-products';top.textContent='Browse products ↓';top.className='rha-gear-toplink';
 bar.append(intro,top);
 const controls=app.querySelector('.usarh-shop-controls');
 if(controls)controls.insertAdjacentElement('beforebegin',bar);

 const chips=document.createElement('nav');chips.className='rha-gear-quickfilters';chips.setAttribute('aria-label','Popular gear categories');
 const selection=[
  ['','All'],['field_hammers','Rock hammers'],['tumblers','Tumblers'],['tumbling_grit','Tumbling grit'],
  ['field_loupes','Loupes'],['uv_lights','UV lights'],['slab_saws','Slab saws'],
  ['trim_saws','Trim saws'],['treasure_detectors','Detectors'],['gold_sluices','Gold prospecting']
 ];
 const allOptions=category?[...category.options].map(o=>o.value):[];
 for(const [key,name] of selection){
  if(key && !allOptions.includes(key))continue;
  const chip=document.createElement('button');chip.type='button';chip.className='rha-gear-filterchip';chip.dataset.category=key;
  chip.textContent=name;chip.setAttribute('aria-pressed',String(!key));
  chip.addEventListener('click',()=>{
   if(!category)return;
   category.value=key;category.dispatchEvent(new Event('change',{bubbles:true}));
   resetPage();
  });
  chips.appendChild(chip);
 }
 if(controls)controls.insertAdjacentElement('afterend',chips);

 const results=document.createElement('div');results.className='rha-gear-page-summary';
 results.setAttribute('role','status');results.setAttribute('aria-live','polite');
 grid.insertAdjacentElement('beforebegin',results);
 const footer=document.createElement('div');footer.className='rha-gear-more';
 const more=document.createElement('button');more.type='button';more.className='rha-gear-more-btn';more.textContent='Show 18 more products';
 footer.appendChild(more);grid.insertAdjacentElement('afterend',footer);

 const empty=document.createElement('p');empty.className='rha-gear-empty';empty.hidden=true;
 empty.textContent='No products match this search and category. Change the search or select All categories.';
 results.insertAdjacentElement('afterend',empty);

 const chunk=window.matchMedia('(max-width: 640px)').matches?6:9;
 let limit=chunk,queued=false;
 function eligible(card) {
  // Existing plugin search/category behavior owns the hidden property.
  return !card.hidden && card.getAttribute('aria-hidden')!=='true' && card.style.display!=='none';
 }
 function apply(){
  const matching=cards.filter(eligible);
  let displayed=0;
  for(const card of cards){
   const show=eligible(card)&&displayed<limit;
   card.classList.toggle('rha-gear-page-hidden',!show);
   if(show){
    displayed++;
    const image=card.querySelector('img.usarh-product-photo');
    if(image){image.loading='eager';if(displayed<=3)image.fetchPriority='high';}
   }
  }
  results.textContent=matching.length
   ? 'Showing '+displayed+' of '+matching.length+' matching products ('+cards.length+' in catalog).'
   : 'No matching products. Try another search or category.';
  empty.hidden=matching.length>0;
  more.hidden=displayed>=matching.length;
  if(!more.hidden)more.textContent='Show '+Math.min(chunk,matching.length-displayed)+' more products';
  [...chips.querySelectorAll('[data-category]')].forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===(category?category.value:''))));
 }
 function schedule(){
  if(queued)return;queued=true;
  setTimeout(()=>{queued=false;apply();},0);
 }
 function resetPage(){
  limit=chunk;schedule();setTimeout(apply,150);
 }
 if(search){search.addEventListener('input',resetPage);search.addEventListener('search',resetPage);}
 if(category)category.addEventListener('change',resetPage);
 // Listen only for native plugin filter state changes, not our own visibility classes.
 const mo=new MutationObserver(schedule);
 cards.forEach(c=>mo.observe(c,{attributes:true,attributeFilter:['hidden','style','aria-hidden']}));
 more.addEventListener('click',()=>{limit+=chunk;apply();});
 for(const img of grid.querySelectorAll('img.usarh-product-photo')){
  img.loading='lazy';img.decoding='async';
  img.addEventListener('error',()=>{
   if(img.dataset.rhaImageError)return;
   img.dataset.rhaImageError='true';
   img.classList.add('rha-gear-img-failed');
   const box=document.createElement('span');
   box.className='rha-gear-photo-unavailable';
   box.textContent='Product photograph temporarily unavailable';
   img.insertAdjacentElement('afterend',box);
  },{once:true});
 }
 apply();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
