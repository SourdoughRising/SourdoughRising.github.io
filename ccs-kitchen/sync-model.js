import {emptyState,validateBackup} from './model.js';

// Compare object contents, never timestamps or property insertion order.
export function canonical(value){
 if(value===undefined)return 'undefined';
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
 return JSON.stringify(value);
}
export function mergeStates(base,local,remote,choices={}){
 base=base||emptyState();
 const conflicts=[];
 function pick(key,b,l,r){
  if(canonical(l)===canonical(r))return l;
  if(canonical(l)===canonical(b))return r;
  if(canonical(r)===canonical(b))return l;
  if(choices[key]==='browser')return l;
  if(choices[key]==='database')return r;
  conflicts.push({key,browser:l,database:r});return l;
 }
 function collection(name,key){
  const maps=[base,local,remote].map(s=>new Map((s[name]||[]).map(x=>[x[key],x])));
  return [...new Set(maps.flatMap(m=>[...m.keys()]))].map(id=>pick(name+':'+id,...maps.map(m=>m.get(id)))).filter(x=>x!==undefined);
 }
 const next=emptyState();next.revision=local.revision;
 next.records=collection('records','id');next.history=collection('history','id');
 next.categories=[...new Set([...remote.categories,...local.categories])];
 next.menus=Object.fromEntries([...new Set([...Object.keys(base.menus),...Object.keys(local.menus),...Object.keys(remote.menus)])].map(k=>[k,pick('menu:'+k,base.menus[k],local.menus[k],remote.menus[k])]).filter(([,v])=>v!==undefined));
 for(const key of ['demoFrom','demoThrough','childrenMin','childrenMax','infantsMin','infantsMax','adultsMin','adultsMax']){
  const v=pick('setting:'+key,base[key],local[key],remote[key]);if(v!==undefined)next[key]=v;
 }
 if(!conflicts.length)validateBackup(next);
 return {state:next,conflicts};
}
export function assertEnvironment(state,environment){
 validateBackup(state);
 if(environment==='prod'&&(state.demoFrom||state.records.some(r=>r.role==='Debug'||r.id.startsWith('DEMO-'))))throw Error('Synthetic Debug data cannot be uploaded to Production.');
}
