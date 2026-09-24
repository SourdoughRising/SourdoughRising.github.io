'use strict';
let menuTextOpen=false,menuTextInput='',menuTextFeedback='';
function menuTextPanel(){return `<div id="menuTextImport" class="menu-text-import" ${menuTextOpen?'':'hidden'}><label for="pastedMenu">Menu text</label><p class="menu-hint" id="menuTextHelp">Include day and meal headings, for example:<br>Monday<br>Breakfast: Milk, waffles, strawberries<br>Lunch: Chicken, rice, broccoli<br>Snack: Cheese and crackers<br>Also accepts meal-first lists and tables copied with tabs or | separators.</p><textarea id="pastedMenu" aria-describedby="menuTextHelp" placeholder="Paste your menu here…" ${menuBusy?'disabled':''}>${esc(menuTextInput)}</textarea><div class="menu-text-actions"><button type="button" class="primary" id="importMenuText" ${menuBusy?'disabled':''}>Import</button><span id="menuTextFeedback" role="status">${esc(menuTextFeedback)}</span></div><p class="menu-hint">Recognized entries replace matching cells after confirmation. Other cells stay unchanged. Review the result, then Save menu.</p></div>`}
function bindMenuText(){
  $('#toggleMenuText').onclick=()=>{menuTextOpen=!menuTextOpen;renderMenu();if(menuTextOpen)$('#pastedMenu').focus()};
  $('#pastedMenu').oninput=e=>{menuTextInput=e.target.value};
  $('#importMenuText').onclick=async()=>{
    if(menuBusy)return;
    const parsed=parseMenuText(menuTextInput);
    if(!parsed.count){menuTextFeedback='No day-and-meal entries found. Add headings such as Monday and Breakfast: before the food items. Your menu was not changed.';$('#menuTextFeedback').textContent=menuTextFeedback;return}
    const overlaps=parsed.cells.some((row,r)=>row.some((text,c)=>text&&menuDraft.cells[r][c]&&text!==menuDraft.cells[r][c]));
    if(overlaps&&!await confirmMenu('Replace matching meal entries with the imported text? Cells without recognized text will stay unchanged.'))return;
    parsed.cells.forEach((row,r)=>row.forEach((text,c)=>{if(text)menuDraft.cells[r][c]=text}));
    menuDraft.text=menuTextInput;menuDraft.source='Imported menu text';
    if(menuPhoto){URL.revokeObjectURL(menuPhoto);menuPhoto=null}
    menuDirty=true;
    menuTextFeedback=`Imported ${parsed.count} of 15 meal cells.${parsed.unassigned?' Some text could not be assigned; check the source text below.':''} Review the menu and save it when ready.`;
    menuStatus(menuTextFeedback);renderMenu();
  };
}

// Only assign food text when both a weekday and a meal service are known.
// Headings require a whole line or punctuation, so "Breakfast Burrito" stays food.
function parseMenuText(text){
  const cells=emptyMenu(),dayPattern='Monday|Tuesday|Wednesday|Thursday|Friday|Mon|Tue(?:s)?|Wed|Thu(?:rs)?|Fri',mealPattern='Breakfast|Lunch|Snack';
  const dayIndex=s=>menuDays.findIndex(d=>d.toLowerCase().startsWith(s.toLowerCase().slice(0,3)));
  const mealIndex=s=>menuMeals.findIndex(m=>m.toLowerCase()===s.toLowerCase());
  const clean=s=>s.trim().replace(/^#+\s*|^[•*-]\s+/g,'').replace(/\*\*/g,'').trim();
  const onlyDay=new RegExp(`^(${dayPattern})\\s*[:–—-]?$`,'i'),onlyMeal=new RegExp(`^(${mealPattern})\\s*[:–—-]?$`,'i');
  const combined=new RegExp(`^(${dayPattern})\\s*(?:[-–—:,]\\s*)?(${mealPattern})(?:\\s*[:–—-]\\s*(.*))?$`,'i');
  const reverse=new RegExp(`^(${mealPattern})\\s*(?:[-–—:,]\\s*)?(${dayPattern})(?:\\s*[:–—-]\\s*(.*))?$`,'i');
  const dayLead=new RegExp(`^(${dayPattern})\\s*[:–—-]\\s*(.+)$`,'i'),mealLead=new RegExp(`^(${mealPattern})\\s*[:–—-]\\s*(.+)$`,'i');
  let day=-1,meal=-1,axis=null,columns=null,unassigned=0;
  function append(r,c,value){if(!value.trim())return;if(r<0||c<0){unassigned++;return}cells[r][c]+=(cells[r][c]?'\n':'')+value.trim()}
  // Split clearly punctuated inline meal headings without splitting food names.
  const normalized=text.replace(/\r\n?/g,'\n').replace(new RegExp(`\\s+(?=(?:${mealPattern})\\s*:)`,'gi'),'\n');
  for(const raw of normalized.split('\n')){
    const line=clean(raw);if(!line)continue;
    if(/^(?:notes?|allergens?|disclaimer|this institut|due to delivery|the codes|children \d)\b/i.test(line)){unassigned++;day=-1;meal=-1;columns=null;continue}
    if(line.includes('\t')||line.includes('|')){
      let parts=line.split(line.includes('\t')?'\t':'|').map(clean);
      if(line.startsWith('|'))parts.shift();if(line.endsWith('|'))parts.pop();
      if(parts.every(p=>/^:?-+:?$/.test(p)||!p))continue;
      const ds=parts.map(p=>onlyDay.test(p)?dayIndex(p):-1),ms=parts.map(p=>onlyMeal.test(p)?mealIndex(p):-1);
      if(ds.filter(i=>i>=0).length>=2){columns={kind:'days',indices:ds};day=-1;meal=-1;continue}
      if(ms.filter(i=>i>=0).length>=2){columns={kind:'meals',indices:ms};day=-1;meal=-1;continue}
      if(columns){
        const label=parts[0],r=onlyMeal.test(label)?mealIndex(label):-1,c=onlyDay.test(label)?dayIndex(label):-1;
        const values=parts.length===columns.indices.length+1?parts.slice(1):parts;
        if(columns.kind==='days'&&r>=0){columns.indices.forEach((col,i)=>{if(col>=0)append(r,col,values[i]||'')});continue}
        if(columns.kind==='meals'&&c>=0){columns.indices.forEach((row,i)=>{if(row>=0)append(row,c,values[i]||'')});continue}
        unassigned++;continue;
      }
      if(parts.length>=3&&onlyDay.test(parts[0])&&onlyMeal.test(parts[1])){append(mealIndex(parts[1]),dayIndex(parts[0]),parts.slice(2).join(', '));continue}
      unassigned++;continue;
    }
    columns=null;
    let match=line.match(combined);if(match){day=dayIndex(match[1]);meal=mealIndex(match[2]);axis='day';append(meal,day,match[3]||'');continue}
    match=line.match(reverse);if(match){meal=mealIndex(match[1]);day=dayIndex(match[2]);axis='meal';append(meal,day,match[3]||'');continue}
    match=line.match(onlyDay);if(match){if(axis===null)axis='day';day=dayIndex(match[1]);if(axis==='day')meal=-1;continue}
    match=line.match(onlyMeal);if(match){if(axis===null)axis='meal';meal=mealIndex(match[1]);if(axis==='meal')day=-1;continue}
    match=line.match(dayLead);if(match){if(axis===null)axis='meal';day=dayIndex(match[1]);append(meal,day,match[2]);continue}
    match=line.match(mealLead);if(match){if(axis===null)axis='day';meal=mealIndex(match[1]);append(meal,day,match[2]);continue}
    append(meal,day,line);
  }
  return {cells,count:cells.flat().filter(Boolean).length,unassigned};
}
