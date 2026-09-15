import {categories,schemas} from './schema.js';
export function localDate(date=new Date()){return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,10);}
export function monday(date){const d=new Date(date+'T12:00:00');d.setDate(d.getDate()-((d.getDay()+6)%7));return localDate(d);}
export const emptyState=()=>({version:1,revision:0,categories:[...categories],records:[],menus:{},history:[]});
export function encodeMenu(data){return new URLSearchParams(data).toString();}
export function decodeMenu(value){return Object.fromEntries(new URLSearchParams(value));}
export function stock(records,productId,lot){return records.filter(r=>r.productId===productId&&(lot===undefined||r.lot===lot)).reduce((sum,r)=>sum+(r.type==='receiving'&&r.decision==='Accepted'?Number(r.quantity):r.type==='use'||r.type==='waste'&&r.kind==='Stock waste'?-Number(r.quantity):0),0);}
export function validateRecord(record,records){
 const errors=[],schema=schemas[record.type];if(!schema)return ['Unknown record type.'];
 for(const f of [{key:'date',label:'Date',type:'date',required:true},{key:'operator',label:'Staff initials',type:'initials',required:true},...schema.fields]){
  const v=record[f.key];if(f.required&&(v===undefined||v===''))errors.push(`${f.label} is required.`);
  if(v===undefined||v==='')continue;
  if(['integer','positive','decimal','temperature'].includes(f.type)&&(!Number.isFinite(Number(v))||(f.type!=='temperature'&&Number(v)<0)||(f.type==='integer'&&!Number.isInteger(Number(v)))||(f.type==='positive'&&Number(v)<=0)))errors.push(`${f.label} has an invalid number.`);
  if(f.type==='initials'&&!/^[A-Za-z]{1,3}$/.test(v))errors.push(`${f.label}: use 1–3 letters only.`);
  if(f.type==='select'&&!f.options.includes(v))errors.push(`${f.label} has an invalid option.`);
  if(f.type==='date'&&(!/^\d{4}-\d{2}-\d{2}$/.test(v)||Number.isNaN(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v))errors.push(`${f.label} needs a valid date.`);
 }
 const other=records.filter(r=>r.id!==record.id);
 if(record.type==='counts'){
  if(other.some(r=>r.type==='counts'&&r.date===record.date&&r.room===record.room&&r.meal===record.meal))errors.push('A count record already exists for this room, meal and date. Edit that record.');
  if(+record.attendance>+record.enrolled)errors.push('Attendance cannot exceed enrollment.');
  if(+record.served>+record.attendance)errors.push('Served children cannot exceed children present.');
  if(record.reimbursable!==''&&record.reimbursable!==undefined&&+record.reimbursable>+record.served)errors.push('Reimbursable children cannot exceed served children.');
  if(+record.laborAdults>+record.staff + +record.volunteers + +record.visitors)errors.push('Food-service labor meals cannot exceed total adult meals.');
  if(record.review==='Reviewed'&&(!record.reviewer||record.reimbursable===''))errors.push('A reviewed count needs reviewer initials and a reimbursable count.');
  if(record.review==='Pending'&&record.reimbursable!=='')errors.push('Leave reimbursable blank until the count is reviewed.');
  if(record.review==='Reviewed'&&record.family==='Not yet verified')errors.push('Verify family-style service or document an exception before review.');
  if((record.review==='Reviewed'&&+record.reimbursable!==+record.served||+record.served>+record.prepared||record.family==='Exception documented')&&!record.reason)errors.push('Explain the count discrepancy or service exception.');
 }
 if(record.type==='presence'){
  if(!other.some(r=>r.id===record.dietId&&r.type==='diets'))errors.push('Select an existing dietary record.');
  if(other.some(r=>r.type==='presence'&&r.date===record.date&&r.dietId===record.dietId))errors.push('A daily status already exists for this diet. Edit it instead.');
 }
 if(record.type==='diets'&&record.end&&record.end<record.date)errors.push('End date must not precede start date.');
 if(record.type==='cooling'&&record.end<=record.start)errors.push('Finish must be after start.');
 if(record.type==='corrective'&&record.status==='Closed'&&(!record.verification||!record.verifiedBy))errors.push('Closure requires verification and verifier initials.');
 if(record.result==='Action required'&&!record.action)errors.push('Record the corrective action or follow-up reference.');
 if(record.type==='waste'&&record.kind==='Stock waste'&&(!record.productId||!record.lot))errors.push('Stock waste requires a product and lot.');
 if(['receiving','use'].includes(record.type)||record.type==='waste'&&record.kind==='Stock waste'){
  const p=other.find(r=>r.id===record.productId&&r.type==='product');
  if(!p)errors.push('Select an existing product.');
  if(record.type==='waste'&&p&&record.unit!==p.unit)errors.push(`Use the product base unit: ${p.unit}.`);
 }
 const candidate=[...other,record];
 const movements=candidate.filter(r=>r.type==='receiving'||r.type==='use'||r.type==='waste'&&r.kind==='Stock waste').sort((a,b)=>a.date.localeCompare(b.date)||Number(b.type==='receiving')-Number(a.type==='receiving'));
 const balances=new Map();
 for(const r of movements){const key=JSON.stringify([r.productId,r.lot]);const q=r.type==='receiving'?(r.decision==='Accepted'?+r.quantity:0):-Number(r.quantity);const n=(balances.get(key)||0)+q;balances.set(key,n);if(n< -0.000001){errors.push('This change would make a lot’s stock negative. Check quantities, lot references and dates.');break;}}
 if(record.type==='product'&&other.some(r=>r.productId===record.id)&&records.find(r=>r.id===record.id)?.unit!==record.unit)errors.push('A product base unit cannot change after stock movements exist. Create a new product.');
 return errors;
}
export function validateBackup(s){
 if(!s||s.version!==1||!Number.isInteger(s.revision)||!Array.isArray(s.records)||!Array.isArray(s.categories)||!s.categories.every(c=>typeof c==='string')||!Array.isArray(s.history)||!s.menus||typeof s.menus!=='object'||Array.isArray(s.menus))throw Error('Not a supported Spruce backup.');
 const ids=new Set();for(const r of s.records){if(!r||typeof r.id!=='string'||ids.has(r.id)||!schemas[r.type])throw Error('Invalid or duplicate record.');ids.add(r.id);for(const value of Object.values(r))if(typeof value!=='string'&&typeof value!=='number')throw Error('Invalid record value.');const errors=validateRecord(r,s.records);if(errors.length)throw Error(`Invalid ${r.type} record: ${errors[0]}`);}
 for(const [key,value] of Object.entries(s.menus))if(!/^\d{4}-\d{2}-\d{2}$/.test(key)||typeof value!=='string')throw Error('Invalid menu data.');
 return s;
}

