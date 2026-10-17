/* Read-only production atlas audit. No classification changes. */
'use strict';
const https=require('node:https'),vm=require('node:vm'),fs=require('node:fs');
const url='https://usarockhounding.com/wp-content/plugins/rockhounding-map-explorer/rockhounding-map-v1/data/map_bundle.js';
function download(url){
 return new Promise((resolve,reject)=>{
  https.get(url,{headers:{'User-Agent':'USA-Rockhounding-Audit/1.0 (public transparency)','Accept':'application/javascript'},timeout:55000},res=>{
   if([301,302,307,308].includes(res.statusCode)){res.resume();return resolve(download(new URL(res.headers.location,url).href));}
   if(res.statusCode!==200){res.resume();return reject(Error('HTTP '+res.statusCode))}
   const chunks=[];let size=0;
   res.on('data',c=>{size+=c.length;if(size>50000000){res.destroy(Error('Too large'));return;}chunks.push(c)});
   res.on('end',()=>resolve(Buffer.concat(chunks).toString('utf8')));
  }).on('error',reject);
 });
}
function group(items,key,limit=100){
 return Object.entries(items.reduce((o,r)=>{const v=String((typeof key==='function'?key(r):r[key])??'∅').trim()||'∅';o[v]=(o[v]||0)+1;return o},{})).sort((a,b)=>b[1]-a[1]).slice(0,limit);
}
function sample(r){return Object.fromEntries(['record_id','state_code','entity_name','status','source_bucket','reason','public_reason','primary_blocker','source_url','source_key','checked_at','navigation_active','near_me_eligible','coordinate_safe','latitude','longitude','display_mode','safe_to_recommend_now'].map(k=>[k,r[k]??null]))}
(async()=>{
 const code=await download(url);
 const context={window:{},console:{log(){},warn(){}}};
 vm.runInNewContext(code,context,{timeout:25000,filename:'map_bundle.js'});
 const d=context.window.RH_MAP_BUNDLE||{},records=d.records||[];
 const statuses=group(records,'status');
 const notReady=records.filter(r=>r.status!=='ready');
 const sourceBuckets=group(notReady,'source_bucket',60);
 const conditional=group(records.filter(r=>r.status==='conditional'),'source_bucket');
 const research=group(records.filter(r=>r.status==='research'),'source_bucket');
 const navYesNotReady=notReady.filter(r=>r.navigation_active===true);
 const recYesNotReady=notReady.filter(r=>r.safe_to_recommend_now===true);
 const readyNavFalse=records.filter(r=>r.status==='ready'&&r.navigation_active!==true);
 const sourceByStatus={};
 for(const key of ['ready','conditional','research','protected','policy']){
  const arr=records.filter(r=>r.status===key);
  sourceByStatus[key]={count:arr.length,withSourceUrl:arr.filter(r=>r.source_url&&/^https?:\/\//.test(r.source_url)).length,withCheckedAt:arr.filter(r=>r.checked_at).length,withExactPoint:arr.filter(r=>Number.isFinite(Number(r.latitude))&&Number.isFinite(Number(r.longitude))&&r.latitude!==null&&r.longitude!==null).length,navigationEnabled:arr.filter(r=>r.navigation_active===true).length};
 }
 const out={date:new Date().toISOString(),bundleBytes:Buffer.byteLength(code),bundleKeys:Object.keys(d),recordCount:records.length,statuses,statusSummary:sourceByStatus,nonReadySourceBuckets:sourceBuckets,conditionalBuckets:conditional,researchBuckets:research,
  navigationEnabledButNotReady:navYesNotReady.length,navEnabledExamples:navYesNotReady.slice(0,25).map(sample),
  safeRecommendTrueButNotReady:recYesNotReady.length,recommendedExamples:recYesNotReady.slice(0,25).map(sample),
  readyWithoutNavigation:readyNavFalse.length,readyWithoutNavigationExamples:readyNavFalse.slice(0,15).map(sample),
  staleRechecks:records.filter(r=>r.checked_at&&String(r.checked_at)<"2025-10-17").length,
  stateCount:group(records,'state_code',65),sourceBucketUniverse:group(records,'source_bucket',85),
  samplesByStatus:Object.fromEntries(['ready','conditional','research','protected'].map(k=>[k,records.filter(r=>r.status===k).slice(0,7).map(sample)]))};
 const path='audit/location-status/current-atlas-audit.json';
 fs.mkdirSync('audit/location-status',{recursive:true});
 fs.writeFileSync(path,JSON.stringify(out,null,2));
 console.log('ATLAS_AUDIT_SUMMARY '+JSON.stringify({recordCount:out.recordCount,statuses,nonReadySourceBuckets:sourceBuckets,conditionalBuckets:conditional,sourceSummary:sourceByStatus,navNotReady:navYesNotReady.length,recNotReady:recYesNotReady.length,readyWithoutNavigation:readyNavFalse.length,stale:out.staleRechecks}));
 console.log('ATLAS_NAV_NOT_READY_EXAMPLES '+JSON.stringify(out.navEnabledExamples.slice(0,8)));
 console.log('ATLAS_RECOMMEND_NOT_READY_EXAMPLES '+JSON.stringify(out.recommendedExamples.slice(0,8)));
 console.log('ATLAS_SOURCE_SAMPLE '+JSON.stringify(out.samplesByStatus.ready.slice(0,3)));
})().catch(e=>{console.error('ATLAS_AUDIT_ERROR',e.stack);process.exitCode=1;});
