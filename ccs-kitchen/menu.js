'use strict';
const menuDays=['Monday','Tuesday','Wednesday','Thursday','Friday'];
const menuMeals=['Breakfast','Lunch','Snack'];
const emptyMenu=()=>Array.from({length:3},()=>Array(5).fill(''));
function menuMonday(value){const date=parse(value);date.setDate(date.getDate()-(date.getDay()+6)%7);return iso(date)}
function validMenus(menus){return menus===undefined||(menus!==null&&typeof menus==='object'&&!Array.isArray(menus)&&Object.entries(menus).every(([date,m])=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&m&&Array.isArray(m.cells)&&m.cells.length===3&&m.cells.every(row=>Array.isArray(row)&&row.length===5&&row.every(c=>typeof c==='string'))&&typeof m.text==='string'&&typeof m.source==='string'&&(m.name===undefined||typeof m.name==='string')&&(m.savedAt===undefined||typeof m.savedAt==='string')))}
let menuWeek=null, menuDraft=null, menuPhoto=null, menuDirty=false, menuBusy=false, menuMessage='', menuWorker=null, menuJob=0;
function loadMenu(){if(!menuWeek)menuWeek=menuMonday(today());menuDraft=structuredClone(db.menus?.[menuWeek]||{cells:emptyMenu(),text:'',source:''});menuDirty=false}
function resetMenu(){menuJob++;if(menuWorker)menuWorker.terminate();menuWorker=null;menuBusy=false;menuDraft=null;menuDirty=false;if(menuPhoto)URL.revokeObjectURL(menuPhoto);menuPhoto=null;menuMessage=''}
function menuStatus(text){menuMessage=text;if(view==='menu'&&$('#menuStatus'))$('#menuStatus').textContent=text}
function renderMenu(){if(!menuDraft)loadMenu();$('#content').innerHTML=`<div class="page-title"><div><div class="eyebrow">PLAN THE WEEK</div><h1>Menu</h1><p>Five days. Three meals. One place to plan.</p></div><button class="primary" id="saveMenu" ${menuBusy?'disabled':''}>Save menu cycle</button></div><section class="panel"><div class="section-head"><label class="menu-week">Week of Monday<input id="menuWeek" type="date" value="${esc(menuWeek)}" ${menuBusy?'disabled':''}></label><span class="badge" id="menuSaveState">${menuDirty?'Unsaved changes':db.menus?.[menuWeek]?'Saved on this device':'New weekly menu'}</span></div><div class="menu-upload"><div><h2>Start with a menu photo</h2><p>Choose a clear, upright photo of one week, with Monday–Friday across the top and Breakfast, Lunch, and Snack down the side.</p><p class="menu-hint">PNG, JPEG, or WebP · up to 10 MB. Text is read on this device; an internet connection loads the reader. Always review the draft.</p></div><div class="menu-import-buttons"><label class="button primary">${menuBusy?'Reading photo…':'↑ Upload menu photo'}<input id="menuPhoto" type="file" accept="image/png,image/jpeg,image/webp" ${menuBusy?'disabled':''}></label><button type="button" id="toggleMenuText" aria-expanded="${menuTextOpen}" aria-controls="menuTextImport" ${menuBusy?'disabled':''}>Import menu text</button></div></div>${menuTextPanel()}<p id="menuStatus" role="status" aria-live="polite">${esc(menuMessage)}</p>${menuBusy?'<button id="cancelMenuRead">Cancel reading</button>':''}</section><section class="panel"><div class="section-head"><h2>Weekly meal plan</h2><span class="badge yellow">${menuDraft.source?'Review extracted entries':'Editable menu'}</span></div><div class="menu-table-scroll"><table class="menu-table"><caption class="sr-only">Five weekday columns and three meal service rows</caption><thead><tr><th scope="col">Meal service</th>${menuDays.map(d=>`<th scope="col">${d}</th>`).join('')}</tr></thead><tbody>${menuMeals.map((meal,r)=>`<tr><th scope="row">${meal}</th>${menuDays.map((day,c)=>`<td><textarea aria-label="${day} ${meal}" data-menu-row="${r}" data-menu-col="${c}" placeholder="Add meal items" ${menuBusy?'disabled':''}>${esc(menuDraft.cells[r][c])}</textarea></td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="menu-hint">Check each meal against the original. Blank cells need your input. Saving this menu does not mark daily tasks complete.</p></section>${menuPhoto||menuDraft.text||menuDraft.source?`<section class="panel"><h2>Menu source</h2><p class="menu-hint">${esc(menuDraft.source)} · Menu text is included in backups. The original photo is shown for this session only; keep your own copy.</p><div class="menu-source">${menuPhoto?`<a href="${esc(menuPhoto)}" target="_blank" rel="noopener"><img src="${esc(menuPhoto)}" alt="Uploaded menu for comparison"></a>`:''}<div><label for="menuText">Source text</label><textarea id="menuText" readonly placeholder="No readable text found.">${esc(menuDraft.text)}</textarea></div></div></section>`:''}${menuCycleLibrary()}`;
bindMenuText();
bindMenuCycles();
$('#menuPhoto').onchange=e=>{const file=e.target.files[0];if(file)readMenuPhoto(file)};
$('#saveMenu').onclick=saveMenuCycle;
$('#menuWeek').onchange=async e=>{if(!e.target.value)return;if(menuDirty&&!await confirmMenu('Switch weeks and discard unsaved menu changes?')){e.target.value=menuWeek;return}menuWeek=menuMonday(e.target.value);resetMenu();loadMenu();renderMenu()};
document.querySelectorAll('[data-menu-row]').forEach(el=>el.oninput=()=>{menuDraft.cells[+el.dataset.menuRow][+el.dataset.menuCol]=el.value;menuDirty=true;$('#menuSaveState').textContent='Unsaved changes'});
if($('#cancelMenuRead'))$('#cancelMenuRead').onclick=()=>{menuJob++;if(menuWorker)menuWorker.terminate();menuWorker=null;menuBusy=false;menuStatus('Reading canceled. Your menu was not changed.');renderMenu()};}

// TSV word positions keep foods in their original columns, even when OCR reading order interleaves cells.
function parseMenuTsv(tsv){const words=tsv.trim().split(/\r?\n/).slice(1).map(line=>{const p=line.split('\t');return {level:+p[0],x:+p[6],y:+p[7],w:+p[8],h:+p[9],confidence:+p[10],text:p.slice(11).join('\t').trim()}}).filter(w=>w.level===5&&w.text&&[w.x,w.y,w.w,w.h].every(Number.isFinite));
const clean=t=>t.toLowerCase().replace(/[^a-z]/g,'');
const days=menuDays.map(day=>words.filter(w=>clean(w.text)===day.toLowerCase()||clean(w.text)===day.slice(0,3).toLowerCase()));
const firstDay=days[0][0],secondDay=days[1][0];
const labelEdge=firstDay&&secondDay ? firstDay.x+firstDay.w/2-((secondDay.x+secondDay.w/2)-(firstDay.x+firstDay.w/2))/2 : -Infinity;
const meals=menuMeals.map(meal=>words.filter(w=>clean(w.text)===meal.toLowerCase()&&w.x+w.w/2<labelEdge));
const cells=emptyMenu();
if(days.some(a=>a.length!==1)||meals.some(a=>a.length!==1))return {cells,count:0,reason:'Could not identify one set of weekday and meal headings. Copy items from the extracted text into the grid, or try a closer photo of one week.'};
const ds=days.map(a=>a[0]),ms=meals.map(a=>a[0]);const centers=ds.map(w=>w.x+w.w/2);
if(!centers.every((x,i)=>!i||x>centers[i-1])||!ms.every((w,i)=>!i||w.y>ms[i-1].y)||Math.max(...ds.map(w=>w.y))>=ms[0].y)return {cells,count:0,reason:'The layout could not be matched to weekday columns and meal rows. Use the extracted text to complete the grid.'};
const boundaries=[centers[0]-(centers[1]-centers[0])/2,...centers.slice(1).map((x,i)=>(x+centers[i])/2),centers[4]+(centers[4]-centers[3])/2];
const starts=ms.map(w=>w.y-w.h/2),bottom=ms[2].y+(ms[2].y-ms[1].y);
const buckets=Array.from({length:3},()=>Array.from({length:5},()=>[]));
words.forEach(w=>{if(ds.includes(w)||ms.includes(w))return;const x=w.x+w.w/2,y=w.y+w.h/2;const c=boundaries.findIndex((b,i)=>i<5&&x>=b&&x<boundaries[i+1]);const r=starts.findIndex((b,i)=>y>=b&&y<(starts[i+1]??bottom));if(c>=0&&r>=0)buckets[r][c].push(w)});
buckets.forEach((row,r)=>row.forEach((ws,c)=>{ws.sort((a,b)=>Math.abs(a.y-b.y)<Math.min(a.h,b.h)*.6?a.x-b.x:a.y-b.y);let previous=null;cells[r][c]=ws.map(w=>{const separator=previous?(Math.abs(w.y-previous.y)>Math.min(w.h,previous.h)*.6?'\n':' '):'';previous=w;return separator+w.text}).join('')}));
return {cells,count:cells.flat().filter(Boolean).length,reason:''};}

let readerLoading;
// Ruled menus are read cell-by-cell so centered labels, repeated meal names,
// and page footnotes cannot shift foods into neighboring meal services.
function menuGridLines(pixels,width,height){
  const rows=new Uint32Array(height),cols=new Uint32Array(width);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=(y*width+x)*4;
    if(pixels[i+3]>128&&pixels[i]<140&&pixels[i+1]<140&&pixels[i+2]<140){rows[y]++;cols[x]++}
  }
  function lines(counts,threshold){const groups=[];let start=-1;
    for(let i=0;i<=counts.length;i++){if(i<counts.length&&counts[i]>=threshold){if(start<0)start=i}else if(start>=0){groups.push(Math.round((start+i-1)/2));start=-1}}
    return groups;
  }
  const xs=lines(cols,height*.55),ys=lines(rows,width*.65);
  if(xs.length!==7||ys.length!==5)return null;
  const widths=xs.slice(2).map((x,i)=>x-xs[i+1]);
  if(Math.min(...widths)<width*.08||Math.max(...widths)/Math.min(...widths)>1.5)return null;
  if(ys[2]-ys[1]<height*.08||ys[3]-ys[2]<height*.08||ys[4]-ys[3]<height*.08)return null;
  return {xs,ys};
}
async function recognizeMenuImage(worker,file,job){
  const bitmap=await createImageBitmap(file);
  const scale=Math.min(1,2600/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
  const grid=menuGridLines(ctx.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height);
  if(!grid)return worker.recognize(canvas,{}, {text:true,tsv:true});
  // Verify the grid's header orientation before interpreting its 15 body cells.
  await worker.setParameters({tessedit_pageseg_mode:'6'});
  const inset=4;
  const readCell=async(c,r)=>{
    if(job!==menuJob)throw Error('Reading canceled.');
    const left=grid.xs[c]+inset,top=grid.ys[r]+inset;
    const {data}=await worker.recognize(canvas,{rectangle:{left,top,width:grid.xs[c+1]-left-inset,height:grid.ys[r+1]-top-inset}},{text:true});
    return data.text.trim();
  };
  const headers=[];
  for(let c=1;c<=5;c++)headers.push(await readCell(c,0));
  const normalize=t=>t.toLowerCase().replace(/[^a-z]/g,'');
  if(!headers.every((text,i)=>normalize(text).includes(menuDays[i].slice(0,3).toLowerCase()))){
    await worker.setParameters({tessedit_pageseg_mode:'11'});
    return worker.recognize(canvas,{}, {text:true,tsv:true});
  }
  const rowHeaders=[];
  for(let r=1;r<=3;r++)rowHeaders.push(await readCell(0,r));
  if(!rowHeaders.every((text,i)=>normalize(text).includes(menuMeals[i].toLowerCase()))){
    await worker.setParameters({tessedit_pageseg_mode:'11'});
    return worker.recognize(canvas,{}, {text:true,tsv:true});
  }
  const cells=emptyMenu();
  for(let r=0;r<3;r++)for(let c=0;c<5;c++){
    menuStatus(`Reading ${menuDays[c]} ${menuMeals[r].toLowerCase()}… (${r*5+c+1}/15)`);
    cells[r][c]=await readCell(c+1,r+1);
  }
  return {data:{text:menuMeals.map((meal,r)=>meal+'\n'+menuDays.map((day,c)=>day+':\n'+cells[r][c]).join('\n\n')).join('\n\n')},mapped:{cells,count:cells.flat().filter(Boolean).length,reason:'No readable meal text was found inside the table.'}};
}
function loadMenuReader(){if(window.Tesseract)return Promise.resolve();if(readerLoading)return readerLoading;readerLoading=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js';const timer=setTimeout(()=>{script.remove();readerLoading=null;reject(Error('Reader download timed out. Check your connection and try again.'))},45000);script.onload=()=>{clearTimeout(timer);resolve()};script.onerror=()=>{clearTimeout(timer);script.remove();readerLoading=null;reject(Error('Could not load the photo reader. Check your internet connection and try again.'))};document.head.append(script)});return readerLoading}
async function readMenuPhoto(file){if(menuBusy)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024){menuStatus('Choose a PNG, JPEG, or WebP image under 10 MB.');return}if(menuDraft.cells.flat().some(Boolean)&&!await confirmMenu('Read this photo into a new draft? Existing entries will be replaced only if meal cells are detected.'))return;
const job=++menuJob;menuBusy=true;menuStatus('Loading the photo reader…');renderMenu();let worker,timer;
try{await loadMenuReader();if(job!==menuJob)return;
const extraction=(async()=>{worker=await Tesseract.createWorker('eng',1,{workerPath:'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js',corePath:'https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0',logger:m=>{if(job===menuJob)menuStatus(m.status==='recognizing text'?`Reading menu… ${Math.round(m.progress*100)}%`:'Preparing photo reader…')}});if(job!==menuJob){await worker.terminate();return null}menuWorker=worker;await worker.setParameters({tessedit_pageseg_mode:'11'});return recognizeMenuImage(worker,file,job)})();
const result=await Promise.race([extraction,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Reading took too long. Try a smaller, clearer photo.')),120000)})]);if(job!==menuJob||!result)return;
const mapped=result.mapped||parseMenuTsv(result.data.tsv||'');if(menuPhoto)URL.revokeObjectURL(menuPhoto);menuPhoto=URL.createObjectURL(file);menuDraft.source=file.name;menuDraft.text=result.data.text||'';if(mapped.count)menuDraft.cells=mapped.cells;menuDirty=true;
menuStatus(mapped.count?`Filled ${mapped.count} of 15 meal cells. Review every entry against the photo, then save the menu.`:mapped.reason+' Existing meal entries have been kept.');
}catch(error){if(job===menuJob)menuStatus(error.message||'Could not read this photo. Try another image or type meals into the grid.')}finally{clearTimeout(timer);if(worker)await worker.terminate().catch(()=>{});if(job===menuJob){menuJob++;menuWorker=null;menuBusy=false;if(view==='menu')renderMenu()}}}
window.addEventListener('beforeunload',event=>{if(menuDirty){event.preventDefault();event.returnValue=''}});

function confirmMenu(message){return new Promise(resolve=>{const dialog=document.createElement('dialog');dialog.innerHTML='<h2>Unsaved menu changes</h2><p></p><div class="menu-confirm-actions"><button data-keep>Keep current menu</button><button class="primary" data-continue>Continue</button></div>';dialog.querySelector('p').textContent=message;let proceed=false;dialog.querySelector('[data-keep]').onclick=()=>dialog.close();dialog.querySelector('[data-continue]').onclick=()=>{proceed=true;dialog.close()};dialog.onclose=()=>{dialog.remove();resolve(proceed)};document.body.append(dialog);dialog.showModal()})}
