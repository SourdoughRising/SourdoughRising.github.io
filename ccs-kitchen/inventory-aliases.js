'use strict';
function aliasKey(name){return String(name||'').trim().replace(/\s+/g,' ').toLowerCase()}
function validInventoryAliases(aliases){if(aliases===undefined)return true;if(!Array.isArray(aliases))return false;const keys=new Set();return aliases.every(row=>{if(!row||typeof row.receiptName!=='string'||typeof row.inventoryName!=='string'||!row.receiptName.trim()||!row.inventoryName.trim())return false;const key=aliasKey(row.receiptName);if(keys.has(key))return false;keys.add(key);return true})}
function resolveInventoryAlias(name){return (db.inventoryAliases||[]).find(row=>aliasKey(row.receiptName)===aliasKey(name))?.inventoryName.trim()||String(name).trim()}
function aliasedInventoryKey(item){return receiptItemKey({...item,name:resolveInventoryAlias(item.name)})}
function openInventoryAliases(){
  let rows=structuredClone(db.inventoryAliases||[]);
  const dialog=document.createElement('dialog');dialog.className='receipt-dialog';dialog.setAttribute('aria-labelledby','aliasTitle');
  dialog.innerHTML=`<form><div class="section-head"><h2 id="aliasTitle">Inventory aliases</h2><button type="button" data-close aria-label="Close aliases">×</button></div><p>Map a receipt’s abbreviated item name to the name you want in inventory. Matching ignores capitalization and extra spaces; package sizes and other wording must match.</p><div class="receipt-table-scroll"><table class="receipt-table"><thead><tr><th>Receipt item name</th><th>Inventory name (alias)</th><th></th></tr></thead><tbody data-rows></tbody></table></div><button type="button" data-add>+ Add alias</button><p class="menu-hint">Aliases apply before matching stock quantities. Each name is mapped once. Saving this table does not rename existing stock until a matching receipt item is imported.</p><p data-error role="alert"></p><div class="menu-confirm-actions"><button type="button" data-close>Cancel</button><button class="primary" type="submit">Save aliases</button></div></form>`;
  function renderRows(){dialog.querySelector('[data-rows]').innerHTML=rows.map((row,i)=>`<tr><td><input required aria-label="Receipt name ${i+1}" data-index="${i}" data-field="receiptName" value="${esc(row.receiptName)}" placeholder="e.g. WHL MLK 1GAL"></td><td><input required aria-label="Inventory alias ${i+1}" data-index="${i}" data-field="inventoryName" value="${esc(row.inventoryName)}" placeholder="e.g. Whole milk, 1 gallon"></td><td><button type="button" data-remove="${i}" aria-label="Remove alias ${i+1}">Remove</button></td></tr>`).join('')||'<tr><td colspan="3">No aliases yet. Add a receipt name and its preferred inventory name.</td></tr>';
    dialog.querySelectorAll('[data-index]').forEach(input=>input.oninput=()=>{rows[+input.dataset.index][input.dataset.field]=input.value});
    dialog.querySelectorAll('[data-remove]').forEach(button=>button.onclick=()=>{rows.splice(+button.dataset.remove,1);renderRows()});
  }
  dialog.querySelector('[data-add]').onclick=()=>{rows.push({receiptName:'',inventoryName:''});renderRows();dialog.querySelector(`[aria-label="Receipt name ${rows.length}"]`).focus()};
  dialog.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>dialog.close());dialog.onclose=()=>dialog.remove();
  dialog.querySelector('form').onsubmit=event=>{event.preventDefault();const cleaned=rows.map(row=>({receiptName:row.receiptName.trim(),inventoryName:row.inventoryName.trim()}));
    if(!validInventoryAliases(cleaned)){dialog.querySelector('[data-error]').textContent='Enter both names and use each receipt name only once.';return}
    const previous=db.inventoryAliases;db.inventoryAliases=cleaned;if(!save()){db.inventoryAliases=previous;dialog.querySelector('[data-error]').textContent='Could not save aliases on this device.';return}
    dialog.close();notify('Inventory aliases saved');
  };
  renderRows();document.body.append(dialog);dialog.showModal();
}
