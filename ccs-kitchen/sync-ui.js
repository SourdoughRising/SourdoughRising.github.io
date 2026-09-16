import {mergeStates,assertEnvironment,canonical} from './sync-model.js';
const keys={}; // Access keys last only for this page session, never in backups or browser storage.
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mountSync(root,adapter){
 const environment=adapter.environment,label=environment==='prod'?'Production':'Debug';
 let savedUrl='';try{savedUrl=localStorage.getItem('ccs-sync-url-'+environment)||'';}catch{}
 root.innerHTML=`${adapter.heading(label+' database sync')}<p>Work offline, then review the database before sharing changes. Production and Debug use separate databases and access keys.</p><form id="sync-connect" class="form-grid"><label>Server address<input name="server" type="url" placeholder="https://kitchen.example.org" value="${esc(savedUrl)}" required></label><label>${label} access key<input name="key" type="password" autocomplete="off" value="${esc(keys[environment]||'')}" required></label><div><button class="primary">Review database</button></div></form><p class="help">Use your hosted Node server address. GitHub Pages itself is not a database server. The key is kept only until this page closes or reloads.</p><p role="status" id="sync-message"></p><div id="sync-plan"></div>`;
 const form=root.querySelector('form'),message=root.querySelector('#sync-message'),preview=root.querySelector('#sync-plan');
 let plan;
 form.oninput=()=>{plan=null;preview.innerHTML='';message.textContent='Connection changed. Review the database to continue.';};
 const busy=value=>{adapter.lock(value);root.querySelectorAll('button,input,select').forEach(el=>el.disabled=value);};
 async function request(url,key,method='GET',body){
  const response=await fetch(url,{method,mode:'cors',cache:'no-store',credentials:'omit',redirect:'error',headers:{Authorization:'Bearer '+key,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(60000)});
  const data=await response.json().catch(()=>{throw Error('This address did not return a sync database response. Check the Node server address.');});
  if(!response.ok)throw Error(data.error||'Database request failed.');
  if(data.environment!==environment||typeof data.instance!=='string'||!Number.isSafeInteger(data.revision))throw Error('Unexpected database identity. No changes applied.');
  assertEnvironment(data.state,environment);return data;
 }
 function changes(before,after){
  const items=s=>new Map([...s.records.map(r=>['record:'+r.id,r]),...Object.entries(s.menus).map(([k,v])=>['menu:'+k,v])]);
  const a=items(before),b=items(after);let added=0,edited=0,removed=0;
  for(const [key,value] of b){if(!a.has(key))added++;else if(canonical(value)!==canonical(a.get(key)))edited++;}
  for(const key of a.keys())if(!b.has(key))removed++;
  return `${added} added � ${edited} changed � ${removed} removed (records and weekly menus)`;
 }
 function showPlan(){
  const result=mergeStates(plan.base,plan.local,plan.remote.state,plan.choices);plan.merged=result.state;
  preview.innerHTML=`<div class="banner"><b>${label} database · revision ${plan.remote.revision}</b><p>Browser: ${plan.local.records.length} records · Database: ${plan.remote.state.records.length} records · Combined: ${result.state.records.length} records, ${Object.keys(result.state.menus).length} weekly menus.</p><p>Changes to browser: ${changes(plan.local,result.state)}<br>Changes to database if pushed: ${changes(plan.remote.state,result.state)}</p>${plan.reset?'<p>This database is new or was reset. Its data will be combined with the browser without assuming earlier deletions.</p>':''}</div>${result.conflicts.map((c,i)=>`<div class="panel"><b>Conflicting edit: ${esc(c.key)}</b><details><summary>Compare both versions</summary><p>Browser</p><pre class="sync-diff">${esc(c.browser===undefined?'Removed':JSON.stringify(c.browser,null,2))}</pre><p>Database</p><pre class="sync-diff">${esc(c.database===undefined?'Removed':JSON.stringify(c.database,null,2))}</pre></details><label>Keep which version?<select data-conflict="${i}"><option value="">Choose…</option><option value="browser">Browser version</option><option value="database">Database version</option></select></label></div>`).join('')}<p class="help">Sync to browser saves the combined records on this device. Push to database saves them in the shared ${label} database and on this device. Conflicting edits need a choice first. Your previous browser data is kept as a recovery backup.</p><div class="toolbar"><button id="sync-pull" ${result.conflicts.length?'disabled':''}>Sync to browser</button><button id="sync-push" class="primary" ${result.conflicts.length?'disabled':''}>Push to ${label} database</button></div>`;
  preview.querySelectorAll('[data-conflict]').forEach(select=>select.onchange=()=>{if(select.value){plan.choices[result.conflicts[+select.dataset.conflict].key]=select.value;try{showPlan();}catch(error){message.textContent=error.message;preview.innerHTML='';plan=null;}}});
  preview.querySelector('#sync-pull').onclick=()=>apply(false);
  preview.querySelector('#sync-push').onclick=()=>apply(true);
 }
 form.onsubmit=async event=>{
  event.preventDefault();const values=new FormData(form);busy(true);preview.innerHTML='';message.textContent='Reading '+label+' database…';
  try{
   const url=new URL(values.get('server'));
   if(url.username||url.password||url.search||url.hash||url.pathname!=='/'||!(url.protocol==='https:'||url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)))throw Error('Use the server origin only, with HTTPS (or HTTP for localhost).');
   const key=String(values.get('key')).trim(),endpoint=url.origin+'/api/sync/'+environment+'/snapshot';
   keys[environment]=key;try{localStorage.setItem('ccs-sync-url-'+environment,url.origin);}catch{}
   const remote=await request(endpoint,key),metaKey='sync:'+environment+':'+url.origin,metadata=await adapter.readMeta(metaKey),local=structuredClone(adapter.getState());
   await adapter.checkLocal(local.revision);assertEnvironment(local,environment);
   plan={endpoint,key,metaKey,local,remote,base:metadata?.instance===remote.instance?metadata.state:null,reset:!!metadata&&metadata.instance!==remote.instance,choices:{},requestId:crypto.randomUUID()};
   busy(false);showPlan();message.textContent='Review complete. No browser or database records have changed.';
  }catch(error){plan=null;message.textContent=error.message;busy(false);}
 };
 async function apply(push){
  if(!plan)return;
  busy(true);message.textContent=push?'Pushing combined data…':'Saving combined data to browser…';
  try{
   if(adapter.getState().revision!==plan.local.revision)throw Error('Browser data changed. Review the database again.');
   await adapter.checkLocal(plan.local.revision);
   const remote=push?await request(plan.endpoint,plan.key,'PUT',{instance:plan.remote.instance,revision:plan.remote.revision,requestId:plan.requestId,state:plan.merged}):plan.remote;
   await adapter.apply(plan.merged,plan.local.revision,plan.metaKey,remote);
   preview.innerHTML='';plan=null;message.textContent=push?label+' database and browser saved.':'Browser synced. Push to database when you are ready to share any browser-only changes.';
  }catch(error){message.textContent=error.message;preview.innerHTML='';plan=null;}finally{busy(false);}
 }
}
