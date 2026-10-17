/* Atlas status safety: research context is not a navigable collecting destination. */
(function(){
'use strict';
function init(){
 const app=document.getElementById('rh-app');
 if(!app||app.dataset.rhaStatusSafety==='yes')return;
 const popup=document.getElementById('mapPopup'),cards=document.getElementById('resultList');
 if(!popup||!cards)return;
 app.dataset.rhaStatusSafety='yes';
 function correctPopup(){
  const badge=popup.querySelector('.rh-popup-status .badge.research');
  if(!badge)return;
  const nav=popup.querySelector('.rh-popup-actions');
  if(nav)nav.remove();
  const plot=popup.querySelector('[data-plot]');
  if(plot)plot.remove();
  if(!popup.querySelector('.rha-status-disclaimer')){
   const note=document.createElement('p');note.className='rha-status-disclaimer';
   note.textContent='Research record only. No public collecting destination or legal access has been established.';
   const foot=popup.querySelector('.rh-popup-foot');
   if(foot)foot.before(note);else popup.appendChild(note);
  }
 }
 function correctCards(){
  for(const card of cards.querySelectorAll('.rh-card')){
   if(!card.querySelector('.badge.research'))continue;
   const nav=card.querySelector('.rh-actions');
   if(!nav)continue;
   for(const el of nav.querySelectorAll('a[href], [data-plot]'))el.remove();
   if(!nav.querySelector('.rha-status-disclaimer')){
    const note=document.createElement('span');note.className='rha-status-disclaimer';
    note.textContent='Research lead · collecting access unverified';
    nav.prepend(note);
   }
  }
 }
 new MutationObserver(correctPopup).observe(popup,{childList:true});
 new MutationObserver(correctCards).observe(cards,{childList:true});
 correctPopup();correctCards();
 const note=document.createElement('div');note.className='rha-status-meaning';
 note.textContent='Ready = collecting activity supported by site-specific evidence. Research = mineral/geology lead, not permission or a travel destination. Conditional = verify restrictions before collecting.';
 const statusFilters=document.getElementById('statusFilters');
 if(statusFilters)statusFilters.insertAdjacentElement('afterend',note);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
