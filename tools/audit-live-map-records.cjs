/* Read-only production atlas audit. No classification changes. */
'use strict';
const https=require('node:https'),vm=require('node:vm'),fs=require('node:fs');
const url='https://usarockhounding.com/wp-content/plugins/rockhounding-map-explorer/rockhounding-map-v1/data/map_bundle.js';
function downloadOnce(url){
 return new Promise((resolve,reject)=>{
  https.get(url,{headers:{'User-Agent':'USA-Rockhounding-Audit/1.0 (public transparency)','Accept':'application/javascript'},timeout:55000},res=>{
   if([301,302,307,308].includes(res.statusCode)){res.resume();return resolve(downloadOnce(new URL(res.headers.location,url).href));}
   if(res.statusCode!==200){res.resume();return reject(Error('HTTP '+res.statusCode))}
   const chunks=[];let size=0;
   res.on('data',c=>{size+=c.length;if(size>50000000){res.destroy(Error('Too large'));return;}chunks.push(c)});
   res.on('end',()=>resolve(Buffer.concat(chunks).toString('utf8')));
  }).on('error',reject);
 });
}
async function download(url){
 let err;
 for(let attempt=0;attempt<4;attempt++){
  try{return await downloadOnce(url)}
  catch(e){err=e;console.error('ATLAS_REMOTE_RETRY '+url+' attempt '+(attempt+1)+' '+String(e.message).slice(0,150));await new Promise(r=>setTimeout(r,4000*(attempt+1)));}
 }
 throw err;
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

 // Full review register: current modeled status, NOT an assertion that an
 // official manager's rules were freshly verified today.
 const columns=['record_id','state_code','entity_name','status','source_bucket','checked_at','source_key','primary_blocker','navigation_active','near_me_eligible','safe_to_recommend_now','review_queue','public_reason'];
 const queueAction=r=>r.status==='ready'?'RECHECK_CURRENT_MANAGER_RULES_AND_CLOSURES':
   r.status==='conditional'?'RESOLVE_STATED_CONDITION_WITH_MANAGER':
   r.status==='research'?'PROVE_EXACT_PARCEL_ACCESS_MINERAL_RIGHTS_AND_COLLECTING_AUTHORITY':
   r.status==='protected'?'PROTECTED_OR_VIEWING_ONLY_DO_NOT_PROMOTE':
   'POLICY_REFERENCE_NOT_PUBLIC_COLLECTING_SITE';
 const csv=(value)=>'"'+String(value??'').replace(/[\r\n]+/g,' ').replace(/"/g,'""').slice(0,1200)+'"';
 const reviewRows=records.map(r=>({
   record_id:r.record_id,state_code:r.state_code,entity_name:r.entity_name,
   status:r.status,source_bucket:r.source_bucket,checked_at:r.checked_at,source_key:r.source_key,
   primary_blocker:r.primary_blocker,navigation_active:!!r.navigation_active,
   near_me_eligible:!!r.near_me_eligible,safe_to_recommend_now:!!r.safe_to_recommend_now,
   review_queue:queueAction(r),public_reason:r.public_reason||r.reason||''
 }));
 const statusReviewCsv=[columns.join(','),...reviewRows.map(r=>columns.map(k=>csv(r[k])).join(','))].join('\n');
 fs.writeFileSync('audit/location-status/all-core-locations-current-status.csv',statusReviewCsv);
 const stateMatrix={};
 for(const r of records){
   const code=r.state_code||'OTHER';
   if(!stateMatrix[code])stateMatrix[code]={state:code,total:0,ready:0,conditional:0,research:0,protected:0,policy:0,researchWithTravelNav:0};
   const row=stateMatrix[code];row.total++;if(Object.hasOwn(row,r.status))row[r.status]++;
   if(r.status==='research'&&r.navigation_active)row.researchWithTravelNav++;
 }
 const col2=['state','total','ready','conditional','research','protected','policy','researchWithTravelNav'];
 fs.writeFileSync('audit/location-status/state-by-state-status-review.csv',
    [col2.join(','),...Object.values(stateMatrix).sort((a,b)=>a.state.localeCompare(b.state)).map(r=>col2.map(k=>csv(r[k])).join(','))].join('\n'));
 console.log('ATLAS_REVIEW_REGISTER '+JSON.stringify({total:reviewRows.length,states:Object.keys(stateMatrix).length,fullRegister:'audit/location-status/all-core-locations-current-status.csv',stateMatrix:'audit/location-status/state-by-state-status-review.csv'}));


 // Pull the live 11,000-record USGS supplement and seven site/operational
 // additions. This export documents all on-map statuses without upgrading
 // a research mineral occurrence into Ready.
 let usgs=[],siteSupplements=[],operational={};
 try{
   usgs=JSON.parse(await download('https://usarockhounding.com/wp-content/uploads/rha-data/usgs-mrds-research.json'));
   if(!Array.isArray(usgs))throw Error('USGS supplement is not an array');
 }catch(e){console.error('ATLAS_USGS_EXPORT_ERROR',e.message);process.exitCode=1;}
 try{
   const markup=await download('https://usarockhounding.com/rockhounding-map/');
   const match=markup.match(/window\.RH_MAP_SUPPLEMENT=(\[[\s\S]*?\]);window\.RH_OPERATIONAL_OVERRIDES=(\{[\s\S]*?\});/);
   if(!match)throw Error('Official supplement inline script missing');
   siteSupplements=JSON.parse(match[1]);
   operational=JSON.parse(match[2]);
 }catch(e){console.error('ATLAS_SUPPLEMENT_EXPORT_ERROR',e.message);process.exitCode=1;}
 const patched=records.map(r=>operational[r.record_id]?{...r,...operational[r.record_id]}:r);
 // Match the map's actual identity rules: different USGS deposit IDs may
 // share a generic name ("Prospect", "Mine") but are distinct locations.
 const unique=new Set(patched.map(r=>String(r.record_id||'').toLowerCase()+'|'+String(r.state_code||'').toLowerCase()+'|'+String(r.entity_name||'').trim().toLowerCase()));
 const coreNames=new Set(patched.map(r=>String(r.state_code||'').toLowerCase()+'|'+String(r.entity_name||'').trim().toLowerCase()));
 const added=[];
 for(const r of [...siteSupplements,...usgs]){
   const key=String(r.state_code||'').toLowerCase()+'|'+String(r.entity_name||'').trim().toLowerCase();
   const identity=String(r.record_id||'').toLowerCase()+'|'+key;
   if(unique.has(identity)||coreNames.has(key))continue;
   unique.add(identity);added.push(r);
 }
 const allRecords=[...patched,...added];
 out.fullDisplayedInventory={
   total:allRecords.length,core:records.length,
   siteSupplement:siteSupplements.length,
   usgsSupplement:usgs.length,
   addedAfterDeduplication:added.length,
   byStatus:group(allRecords,'status',15),
   sourceNotes:'USGS MRDS means research only; none is a verified public collecting destination.'
 };
 const fullCsvRows=allRecords.map(r=>({
   record_id:r.record_id,state_code:r.state_code,entity_name:r.entity_name,
   status:r.status,source_bucket:r.source_bucket,checked_at:r.checked_at,source_key:r.source_key,
   primary_blocker:r.primary_blocker,navigation_active:!!r.navigation_active,
   near_me_eligible:!!r.near_me_eligible,safe_to_recommend_now:!!r.safe_to_recommend_now,
   review_queue:queueAction(r),public_reason:r.public_reason||r.reason||'',
   source_dataset:String(r.record_id||'').startsWith('usgs-mrds::')?'USGS_MRDS_RESEARCH':String(r.record_id||'').startsWith('supplement::')?'SITE_SUPPLEMENT':'CORE_ATLAS'
 }));
 const fullCols=[...columns,'source_dataset'];
 fs.writeFileSync('audit/location-status/all-displayed-locations-current-status.csv',
    [fullCols.join(','),...fullCsvRows.map(row=>fullCols.map(k=>csv(row[k])).join(','))].join('\n'));
 const matrixAll={};
 for(const row of allRecords){
   const st=row.state_code||'OTHER';
   if(!matrixAll[st])matrixAll[st]={state:st,total:0,ready:0,conditional:0,research:0,protected:0,policy:0,usgs:0};
   const target=matrixAll[st];target.total++;if(Object.hasOwn(target,row.status))target[row.status]++;
   if(String(row.record_id||'').startsWith('usgs-mrds::'))target.usgs++;
 }
 const columnsAll=['state','total','ready','conditional','research','protected','policy','usgs'];
 fs.writeFileSync('audit/location-status/all-inventory-by-state.csv',
   [columnsAll.join(','),...Object.values(matrixAll).sort((a,b)=>a.state.localeCompare(b.state)).map(r=>columnsAll.map(k=>csv(r[k])).join(','))].join('\n'));
 console.log('ATLAS_FULL_INVENTORY '+JSON.stringify(out.fullDisplayedInventory));

 const path='audit/location-status/current-atlas-audit.json';
 fs.mkdirSync('audit/location-status',{recursive:true});

 const namedBLM=[
  ['Black Hills Rockhound Area','AZ',/black hills.*rockhound/i],
  ['Round Mountain Rockhound Area','AZ',/round mountain.*rockhound/i],
  ['Wiley Well Geode Beds','CA',/wiley well/i],
  ['Chambless Rock Collecting Area','CA',/chambless/i],
  ['Savahia Peak Rock Collecting Area','CA',/savahia peak/i],
  ['Garnet Hill','NV',/garnet hill/i],
  ['Sunstone Collection Area','OR',/sunstone.*collect/i],
  ['Dugway Geode Beds','UT',/dugway.*geode/i],
  ['Topaz Mountain Rockhound Recreation Area','UT',/topaz mountain/i]
 ];
 const blmMatches=namedBLM.map(([name,state,re])=>{
  const matches=records.filter(r=>r.state_code===state&&re.test(r.entity_name||''));
  return {name,state,matches:matches.map(sample)};
 });
 out.blmNamedMatches=blmMatches;
 console.log('ATLAS_BLM_NAMED_MATCHES '+JSON.stringify(blmMatches));
 fs.writeFileSync(path,JSON.stringify(out,null,2));
 console.log('ATLAS_AUDIT_SUMMARY '+JSON.stringify({recordCount:out.recordCount,statuses,nonReadySourceBuckets:sourceBuckets,conditionalBuckets:conditional,sourceSummary:sourceByStatus,navNotReady:navYesNotReady.length,recNotReady:recYesNotReady.length,readyWithoutNavigation:readyNavFalse.length,stale:out.staleRechecks}));
 console.log('ATLAS_NAV_NOT_READY_EXAMPLES '+JSON.stringify(out.navEnabledExamples.slice(0,8)));
 console.log('ATLAS_RECOMMEND_NOT_READY_EXAMPLES '+JSON.stringify(out.recommendedExamples.slice(0,8)));
 console.log('ATLAS_SOURCE_SAMPLE '+JSON.stringify(out.samplesByStatus.ready.slice(0,3)));
})().catch(e=>{console.error('ATLAS_AUDIT_ERROR',e.stack);process.exitCode=1;});
