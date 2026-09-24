'use strict';
function cycleDefaultName(week){return `Cycle Week of ${parse(week).toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'})}`}
function cycleName(menu,week){return menu.name||cycleDefaultName(week)}
function menuCycleLibrary(){const cycles=Object.entries(db.menus||{}).sort(([a],[b])=>b.localeCompare(a));return `<section class="panel" aria-labelledby="cyclesHeading"><div class="section-head"><div><div class="eyebrow">MENU LIBRARY</div><h2 id="cyclesHeading">Saved menu cycles</h2></div><span class="badge">${cycles.length} ${cycles.length===1?'cycle':'cycles'}</span></div><p>Save a weekly menu to post it here. Preview, rename, or reuse a saved cycle.</p>${cycles.length?`<div class="cycle-list">${cycles.map(([week,m])=>`<article class="record"><div><strong>${esc(cycleName(m,week))}</strong><p>Menu week: ${esc(week)} · ${m.cells.flat().filter(v=>v.trim()).length}/15 meals${m.savedAt?' · Saved '+esc(m.savedAt):''}</p></div><div class="record-actions"><button data-preview-cycle="${esc(week)}">Preview & rename</button><button data-use-cycle="${esc(week)}" ${menuBusy?'disabled':''}>Use this cycle</button></div></article>`).join('')}</div>`:'<div class="empty">No saved cycles yet. Add meal entries below, then select Save menu cycle.</div>'}</section>`}
function bindMenuCycles(){document.querySelectorAll('[data-preview-cycle]').forEach(b=>b.onclick=()=>previewMenuCycle(b.dataset.previewCycle));document.querySelectorAll('[data-use-cycle]').forEach(b=>b.onclick=async()=>{
  if(menuBusy)return;
  if(menuDraft.cells.flat().some(Boolean)&&!await confirmMenu('Load this saved cycle into the selected week? This replaces the draft; the saved cycle stays in your library.'))return;
  const source=db.menus[b.dataset.useCycle];
  resetMenu();menuDraft={cells:structuredClone(source.cells),text:source.text,source:source.source,name:cycleName(source,b.dataset.useCycle)};menuDirty=true;
  menuStatus('Cycle loaded into the selected week. Review it, then save to post this week’s menu.');renderMenu();
})}
function saveMenuCycle(){const previous=db.menus;
  const record={...structuredClone(menuDraft),name:menuDraft.name?.trim()||cycleDefaultName(menuMonday(today())),savedAt:today()};
  db.menus={...(db.menus||{}),[menuWeek]:record};
  if(!save()){db.menus=previous;return}
  menuDraft=structuredClone(record);menuDirty=false;renderMenu();notify('Menu cycle saved to the library');
}
function previewMenuCycle(week){const record=db.menus[week];if(!record)return;
  const dialog=document.createElement('dialog');dialog.className='cycle-dialog';dialog.setAttribute('aria-labelledby','cyclePreviewTitle');
  dialog.innerHTML=`<form><div class="section-head"><h2 id="cyclePreviewTitle">Menu cycle preview</h2><button type="button" data-close aria-label="Close cycle preview">×</button></div><label class="field">Cycle name<input name="cycleName" maxlength="160" required value="${esc(cycleName(record,week))}"></label><p>Menu week: ${esc(week)}${record.savedAt?' · Saved '+esc(record.savedAt):''}</p><div class="menu-table-scroll"><table class="menu-table cycle-preview-table"><caption class="sr-only">Saved cycle meal plan</caption><thead><tr><th scope="col">Meal service</th>${menuDays.map(d=>`<th scope="col">${d}</th>`).join('')}</tr></thead><tbody>${menuMeals.map((meal,r)=>`<tr><th scope="row">${meal}</th>${menuDays.map((_,c)=>`<td>${esc(record.cells[r][c])||'<span class="cycle-missing">No meal entered</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div><label class="field">Cycle source text<textarea name="cycleSource" class="cycle-source" placeholder="Paste or retain the original menu text here.">${esc(record.text)}</textarea></label><p class="menu-hint">Editing source text preserves your reference; it does not re-parse or change meal entries. Use the menu editor to change meals.</p><p data-error role="alert"></p><div class="menu-confirm-actions"><button type="button" data-close>Close</button><button type="submit" class="primary">Save changes</button></div></form>`;
  dialog.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>dialog.close());
  dialog.onclose=()=>dialog.remove();
  dialog.querySelector('form').onsubmit=e=>{e.preventDefault();const name=dialog.querySelector('[name="cycleName"]').value.trim(),text=dialog.querySelector('[name="cycleSource"]').value;
    if(!name){dialog.querySelector('[data-error]').textContent='Enter a cycle name.';return}
    const previous=db.menus[week];db.menus[week]={...previous,name,text};
    if(!save()){db.menus[week]=previous;dialog.querySelector('[data-error]').textContent='Could not save changes on this device.';return}
    // Preserve food edits already in progress while reflecting changes to this cycle.
    if(menuWeek===week&&menuDraft){if(!menuDirty||menuDraft.name===previous.name)menuDraft.name=name;if(!menuDirty||menuDraft.text===previous.text)menuDraft.text=text}
    dialog.close();renderMenu();notify('Cycle updated');
  };
  document.body.append(dialog);dialog.showModal();
}
