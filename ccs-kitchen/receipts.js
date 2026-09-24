'use strict';
function receiptUnit(unit){const value=String(unit||'').trim().toLowerCase();return ({ea:'each',each:'each',lbs:'lb',pounds:'lb',pound:'lb',kilograms:'kg',kilogram:'kg',ounces:'oz',ounce:'oz'})[value]||value}
function receiptItemKey(row){return JSON.stringify([String(row.name||'').trim().replace(/\s+/g,' ').toLowerCase(),receiptUnit(row.unit)])}
function receiptMatchMessage(row){const alias=resolveInventoryAlias(row.name),prefix=alias!==row.name?`Import as ${alias}. `:'';const matches=db.inventory.filter(item=>aliasedInventoryKey(item)===receiptItemKey({...row,name:alias}));if(matches.length>1)return prefix+'Multiple inventory matches — make the name or unit unique before importing.';if(matches.length){const stock=Number(matches[0].quantity),incoming=Number(row.quantity);return prefix+(Number.isFinite(stock)&&Number.isFinite(incoming)?`Increase stock: ${stock} → ${Number((stock+incoming).toFixed(6))} ${matches[0].unit}`:'Existing quantity needs correction.')}return prefix+'Add as a new inventory item'}
function planReceiptImport(rows,filename,inventory){
  const records=receiptInventoryRecords(rows,filename);if(!records.length)throw Error('Select at least one item to add.');
  const result=structuredClone(inventory),updated=new Set();const matchKeys=new Map(result.map(item=>[item.id,aliasedInventoryKey(item)]));let added=0;
  for(const record of records){const matches=result.filter(item=>receiptItemKey(item)===receiptItemKey(record)||matchKeys.get(item.id)===receiptItemKey(record));
    if(matches.length>1)throw Error(`More than one inventory item matches ${record.name}. Give the receipt item a unique name or unit, or uncheck it.`);
    if(matches.length){const item=matches[0],stock=Number(item.quantity);if(!Number.isFinite(stock)||stock<0)throw Error(`Correct the existing quantity for ${item.name} before importing.`);
      item.quantity=String(Number((stock+Number(record.quantity)).toFixed(6)));item.lastReceipt=record.receipt;item.name=record.name;
      if(inventory.some(existing=>existing.id===item.id))updated.add(item.id);
    }else{result.push(record);added++}
  }
  return {inventory:result,added,updated:updated.size};
}

// Receipt amounts are prices, never stock quantities. Missing counts are reviewable defaults.
function parseReceiptText(text){
  const rows=[];
  let pending='',previous=null;
  const summary=/^(?:sub\s*total|total|grand\s+total|balance|amount|tax(?:able)?|sales\s+tax|food\s+total|cash|change|credit|debit|visa|mastercard|amex|discover|payment|tender|savings?|discount|coupon|refund|return|void|thank|welcome|receipt|transaction|cashier|register|store\s*(?:#|no|number)|auth|approval|card|account|items?\s*(?:sold|count|total|qty)|qty\s+item|date|time)\b/i;
  const amount=/\s+\$?\d[\d,]*[.,]\d{2}(?:\s*[A-Z*]{1,3})?\s*$/i;
  const quantityLine=/^(\d+(?:\.\d+)?)\s*(lb|lbs|kg|oz|ea)?\s*(?:@|[x×]|at)\s*\$?\d+(?:[.,]\d{2})?(?:\s+.*)?$/i;
  function add(name,quantity=1,unit='each',assumed=true,line=name){
    name=name.replace(/^\d{5,}\s+/,'').replace(/\s+/g,' ').trim();
    if(!/[a-z]{2}/i.test(name)||summary.test(name)||/^[-\d\s.,$@x]+$/i.test(name))return;
    const row={name,quantity,unit,assumed,include:true,line};rows.push(row);previous=row;
  }
  for(const raw of text.replace(/\r\n?/g,'\n').split('\n')){
    const line=raw.trim().replace(/(\d)\s+1b(s?)\b/gi,'$1 lb$2');if(!line)continue;
    if(summary.test(line)||/\bhttps?:|www\.|\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b\d{1,2}:\d{2}\b|(?:^|\s)-\s*\$?\d+[.,]\d{2}/i.test(line)){pending='';previous=null;continue}
    const qty=line.match(quantityLine);
    if(qty){const count=Number(qty[1]),unit=(qty[2]||'each').toLowerCase();if(pending){add(pending,count,unit,false,pending+'\n'+line);pending=''}else if(previous){previous.quantity=count;previous.unit=unit;previous.assumed=false;previous.line+='\n'+line}continue}
    if(!amount.test(' '+line)){
      // A description on its own may be paired with the next price or quantity line.
      pending=/[a-z]{2}/i.test(line)&&!/^[-*=]+$/.test(line)?line:'';continue;
    }
    let name=(' '+line).replace(amount,'').trim();
    if(!name&&pending){name=pending;pending=''}
    else pending='';
    let count=1,unit='each',assumed=true;
    const prefix=name.match(/^(\d{1,2})\s*(?:[x×]\s*|\s+)(?=[A-Za-z])(.+)$/i);
    const suffix=name.match(/^(.+?)\s+(?:[x×]\s*(\d{1,3})|qty\s*[:=]?\s*(\d{1,3}))$/i);
    if(prefix){count=+prefix[1];name=prefix[2];assumed=false}
    else if(suffix){name=suffix[1];count=+(suffix[2]||suffix[3]);assumed=false}
    add(name,count,unit,assumed,line);
  }
  const grouped=new Map();
  for(const row of rows){const key=receiptItemKey(row);if(grouped.has(key)){const existing=grouped.get(key);existing.quantity=Number((existing.quantity+row.quantity).toFixed(6));existing.assumed ||= row.assumed;existing.line+='\n'+row.line;existing.occurrences++}else grouped.set(key,{...row,occurrences:1})}
  return [...grouped.values()];
}

function receiptInventoryRecords(rows,filename){return rows.filter(row=>row.include).map(row=>{
  if(!row.name.trim()||!Number.isFinite(+row.quantity)||+row.quantity<=0||!row.unit.trim())throw Error('Each selected item needs a name, a quantity greater than zero, and a unit.');
  return {id:crypto.randomUUID(),name:resolveInventoryAlias(row.name),quantity:String(+row.quantity),unit:row.unit.trim(),minimum:'',expires:'',location:'',receipt:{filename,originalName:row.name.trim(),line:row.line||'',importedAt:today()}};
})}

function openReceiptScanner(){
  const dialog=document.createElement('dialog');dialog.className='receipt-dialog';dialog.setAttribute('aria-labelledby','receiptTitle');
  let rows=[],sourceName='',sourceText='',photoURL=null,worker=null,busy=false,job=0;
  dialog.innerHTML=`<div class="section-head"><h2 id="receiptTitle">Scan a shopping receipt</h2><button type="button" data-close aria-label="Close receipt scanner">×</button></div><p>Choose a clear receipt photo, then check item names and quantities before adding them.</p><label class="field receipt-file">Receipt image<input type="file" accept="image/png,image/jpeg,image/webp" data-photo></label><p class="menu-hint">PNG, JPEG, or WebP · up to 10 MB. Photo reading happens on this device; internet is needed to load the reader.</p><p data-status role="status" aria-live="polite"></p><div data-review></div><p data-error role="alert"></p>`;
  const status=message=>dialog.querySelector('[data-status]').textContent=message;
  function renderReview(){
    dialog.querySelector('[data-review]').innerHTML=`<div class="note">Review every row. When a receipt does not show a quantity, we suggest <strong>1</strong> and flag it for review. A price is not a quantity. Repeated items are combined and saved aliases are applied. A matching inventory name and unit increases existing stock; other items create new records.</div><div class="receipt-table-scroll"><table class="receipt-table"><thead><tr><th>Add</th><th>Item name</th><th>Quantity</th><th>Unit</th><th>Review</th></tr></thead><tbody>${rows.map((row,i)=>`<tr><td><input type="checkbox" aria-label="Include item ${i+1}" data-row="${i}" data-field="include" ${row.include?'checked':''}></td><td><input aria-label="Item ${i+1} name" data-row="${i}" data-field="name" value="${esc(row.name)}"></td><td><input type="number" min="0.001" step="any" aria-label="Item ${i+1} quantity" data-row="${i}" data-field="quantity" value="${esc(row.quantity)}"></td><td><input aria-label="Item ${i+1} unit" data-row="${i}" data-field="unit" value="${esc(row.unit)}"></td><td><span class="badge ${row.assumed?'yellow':''}">${row.assumed?'Quantity assumed':'Check against receipt'}</span>${row.occurrences>1?`<small>${row.occurrences} receipt entries combined</small>`:''}<small data-match="${i}">${esc(receiptMatchMessage(row))}</small></td></tr>`).join('')}</tbody></table></div>${rows.length?'':'<p>No item rows recognized. Add rows manually using the receipt below, or try another photo.</p>'}<div class="receipt-actions"><button type="button" data-add-row>+ Add row</button><button type="button" class="primary" data-import>Add selected items to inventory</button></div><p class="menu-hint">Existing label photos are kept. Receipt imports can be saved before label photos are available. New items are flagged for front and nutrition label images; add those from Edit.</p><details><summary>Compare with the receipt</summary><div class="menu-source">${photoURL?`<img src="${esc(photoURL)}" alt="Receipt being reviewed">`:''}<div><label for="receiptText">Extracted receipt text</label><textarea id="receiptText" readonly>${esc(sourceText)}</textarea></div></div></details>`;
    dialog.querySelectorAll('[data-row]').forEach(input=>input.oninput=()=>{rows[+input.dataset.row][input.dataset.field]=input.type==='checkbox'?input.checked:input.value;dialog.querySelector(`[data-match="${input.dataset.row}"]`).textContent=receiptMatchMessage(rows[+input.dataset.row])});
    dialog.querySelector('[data-add-row]').onclick=()=>{rows.push({name:'',quantity:1,unit:'each',assumed:true,include:true,line:''});renderReview()};
    dialog.querySelector('[data-import]').onclick=()=>{
      if(busy)return;
      try{const plan=planReceiptImport(rows,sourceName,db.inventory);
        const previous=db.inventory;db.inventory=plan.inventory;
        if(!save()){db.inventory=previous;throw Error('Could not save the items. Free some browser storage or back up your records before trying again.')}
        dialog.close();render();notify(`${plan.added} new items added; ${plan.updated} stock quantities increased.`);
      }catch(error){dialog.querySelector('[data-error]').textContent=error.message}
    };
  }
  dialog.querySelector('[data-close]').onclick=()=>dialog.close();
  dialog.onclose=()=>{job++;if(worker)worker.terminate().catch(()=>{});if(photoURL)URL.revokeObjectURL(photoURL);dialog.remove()};
  dialog.querySelector('[data-photo]').onchange=async event=>{
    const file=event.target.files[0];if(!file||busy)return;
    dialog.querySelector('[data-error]').textContent='';
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10*1024*1024){status('Choose a PNG, JPEG, or WebP receipt under 10 MB.');return}
    busy=true;const current=++job;event.target.disabled=true;dialog.querySelector('[data-review]').innerHTML='';status('Loading receipt reader…');let timer,activeWorker;
    try{
      await loadMenuReader();if(current!==job)return;
      const extraction=(async()=>{
        activeWorker=await Tesseract.createWorker('eng',1,{workerPath:'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js',corePath:'https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0',logger:m=>{if(current===job)status(m.status==='recognizing text'?`Reading receipt… ${Math.round(m.progress*100)}%`:'Preparing receipt reader…')}});
        if(current!==job){await activeWorker.terminate();return null}worker=activeWorker;
        await activeWorker.setParameters({tessedit_pageseg_mode:'6',preserve_interword_spaces:'1'});
        return activeWorker.recognize(file,{}, {text:true});
      })();
      const result=await Promise.race([extraction,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Reading took too long. Try a smaller or clearer receipt photo.')),120000)})]);
      if(current!==job||!result)return;
      sourceName=file.name;sourceText=result.data.text||'';rows=parseReceiptText(sourceText);
      if(photoURL)URL.revokeObjectURL(photoURL);photoURL=URL.createObjectURL(file);
      status(`Found ${rows.length} possible ${rows.length===1?'item':'items'}. Review the draft below.`);renderReview();
    }catch(error){if(current===job){status(error.message||'Could not read this receipt. Try another photo.');if(sourceName)renderReview()}}
    finally{clearTimeout(timer);if(activeWorker)await activeWorker.terminate().catch(()=>{});if(current===job){job++;worker=null;busy=false;event.target.disabled=false}}
  };
  document.body.append(dialog);dialog.showModal();
}
