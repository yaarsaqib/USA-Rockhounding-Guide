/* USA Rockhounding Gear Hub: intentional visual hierarchy v2 */
(function(){
'use strict';
function init(){
 const app=document.querySelector('.usarh-gear-app');
 if(!app||app.dataset.rhaVisualV2)return;
 const finder=app.querySelector('#gear-finder');
 const paths=app.querySelector('#choose-path');
 const shop=app.querySelector('#amazon-gear');
 const buying=app.querySelector('#practical-buying-guide');
 const matrix=app.querySelector('#rock-to-gear');
 if(!finder||!paths||!shop||!buying||!matrix)return;
 app.dataset.rhaVisualV2='ready';
 // The previous page hid the equipment finder behind an immense shopping wall.
 // New sequence: quick answer -> finder -> paths -> shopping -> buying guidance.
 app.insertBefore(finder,shop);
 app.insertBefore(paths,shop);
 app.insertBefore(buying,matrix);
 const toc=app.querySelector('.usarh-toc');
 if(toc){
   const map=new Map([...toc.querySelectorAll('a[href^="#"]')].map(a=>[a.getAttribute('href'),a]));
   const order=['#gear-finder','#choose-path','#amazon-gear','#practical-buying-guide','#rha-buyer-comparisons'];
   for(const href of [...order].reverse()){
     const a=map.get(href);
     if(a && a.parentNode && a.parentNode.parentNode===toc.querySelector('div'))a.parentNode.parentNode.prepend(a.parentNode);
     else if(a && a.parentNode)a.parentNode.prepend(a);
   }
 }
 // Move the very long comparison library behind a clearly labelled disclosure,
 // keeping all comparison content server-rendered and indexable in <details>.
 const comparisons=app.querySelector('#rha-buyer-comparisons');
 if(comparisons && !comparisons.closest('details.rha-gear-comparison-details')){
   const holder=document.createElement('details');
   holder.className='rha-gear-comparison-details';
   const summary=document.createElement('summary');
   summary.textContent='View detailed head-to-head gear comparisons';
   const hint=document.createElement('p');
   hint.className='rha-gear-comparison-hint';
   hint.textContent='Explore the full decision tables and model differences when you need them.';
   comparisons.before(holder);
   holder.append(summary,hint,comparisons);
   const openForHash=()=>{
     const raw=decodeURIComponent(location.hash.slice(1));
     if(!raw)return;
     const target=document.getElementById(raw);
     if(target && (target===holder||holder.contains(target)))holder.open=true;
   };
   openForHash();
   window.addEventListener('hashchange',openForHash);
 }
 // The beginning of this page is now directly actionable instead of forcing
 // visitors to scroll through technical tables and the product inventory.
 const shopLink=app.querySelector('.rha-gear-toplink');
 if(shopLink)shopLink.textContent='Jump to product grid ↓';
 const visible=document.querySelectorAll('.usarh-shop-card:not(.rha-gear-page-hidden):not([hidden])');
 visible.forEach((c,i)=>{
   const img=c.querySelector('img.usarh-product-photo');
   if(img){img.loading='eager';if(i<3)img.fetchPriority='high';}
 });
 window.RHA_GEAR_VISUAL_V2_READY=true;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();