'use strict';
function menuItemAssessment(text){
  const name=text.trim().toLowerCase().replace(/\s+/g,' ');
  // Exact simple-food matches only: a component name inside a recipe is not evidence.
  const produce=/^(?:(?:fresh|plain|raw|steamed|frozen) )?(?:apples?|apple slices|bananas?|oranges?|orange slices|strawberries|blueberries|raspberries|blackberries|mixed berries|peaches|pears|pineapple|watermelon|cantaloupe|grapes|broccoli|carrots|green beans|peas|corn|cauliflower|spinach|cucumber|cucumber slices|bell pepper strips)$/;
  if(produce.test(name))return {state:'green',reason:'Recognized plain fruit or vegetable; generally creditable. Verify served form, age-appropriate portion, and preparation. This is not a meal-compliance approval.'};
  if(/\b(cookie|cookies|cake|cakes|doughnut|donut|brownie|brownies|candy)\b/.test(name))return {state:'yellow',reason:'Review before crediting: grain-based desserts cannot count toward the grains requirement; sweets may not provide a creditable component.'};
  if(/\b(burrito|pizza|nuggets?|meatballs?|chili|casserole|sandwich|lasagna|soup|hummus|coleslaw|pulled pork)\b/.test(name))return {state:'yellow',reason:'Combination food: verify a standardized recipe with yield and component contributions, or a CN label / manufacturer Product Formulation Statement (PFS), plus the serving size.'};
  if(/\b(yogurt|yoghurt|cereal)\b/.test(name))return {state:'yellow',reason:'Check Nutrition Facts for added sugars and verify creditable ingredients and serving amount. A label photo alone does not establish compliance.'};
  if(/\b(milk|beverage)\b/.test(name))return {state:'yellow',reason:'Verify milk type, age group, and portion; nondairy substitutes need nutrient-equivalence documentation or an applicable approved modification.'};
  if(/\b(wg|wgr|whole|bread|toast|muffin|waffles?|pancakes?|crackers?|tortilla|pasta|rice|oatmeal|bun|roll|cornbread)\b/.test(name))return {state:'yellow',reason:'Verify grain crediting and ounce equivalents using ingredients, product documentation, or a standardized recipe. WG/WGR in menu text is not proof of whole grain-rich status.'};
  return {state:'yellow',reason:'Needs review: identify the exact food, creditable component, preparation, and portion. Check the Food Buying Guide, product documentation, or recipe as appropriate.'};
}
function menuCreditingPreview(text){return String(text||'').split(/\r?\n|;/).map(s=>s.trim()).filter(Boolean).map(item=>{const result=menuItemAssessment(item);const matches=(db.inventory||[]).filter(r=>String(r.name).trim().toLowerCase()===item.toLowerCase());const photos=matches.some(r=>isLabelImage(labelImage(r,'frontLabel'))||isLabelImage(labelImage(r,'nutritionLabel')));const note=photos?' Inventory label image available; contents still need review.':'';return `<details class="menu-credit ${result.state}"><summary><span>${esc(item)}</span><small>${result.state==='green'?'Creditable food':'Review needed'}</small></summary><p>${esc(result.reason+note)}</p>${result.state==='yellow'?menuReviewButtons(item):''}</details>`}).join('')}
function menuCreditingLegend(){return `<div class="menu-credit-legend"><strong>Item crediting check</strong><p><span class="menu-credit-key green">Green: recognized creditable food</span> · <span class="menu-credit-key yellow">Yellow: documentation or details needed</span></p><p>Enter one item per line (or separate with semicolons). Colored text appears below each editable cell; select an item for its reason. Green checks the food type only—not portions, age suitability, substitutions, or the complete meal. Unknown items stay yellow. Uploaded images are not automatically verified.</p><p>Guidance checked September 28, 2026: <a href="https://foodbuyingguide.fns.usda.gov/Home/ResourceCenter" target="_blank" rel="noopener noreferrer">USDA Food Buying Guide</a> · <a href="https://fns-prod.azureedge.us/sites/default/files/resource-files/tn-cacfp-crediting-handbook.pdf" target="_blank" rel="noopener noreferrer">CACFP Crediting Handbook</a></p></div>`}

function menuReviewActions(item){
  if(/\b(cookie|cookies|cake|cakes|doughnut|donut|brownie|brownies|candy)\b/i.test(item))return [['guide','Check component rules']];
  if(/\b(yogurt|yoghurt|cereal|milk|beverage)\b/i.test(item))return [['inventory','Front / nutrition labels'],['labels','Record crediting review'],['guide','Check portions & substitutions']];
  return [['labels','CN label / PFS review'],['recipe','Recipe / supporting document'],['inventory','Front / nutrition labels']];
}
function menuReviewButtons(item){return '<div class="menu-review-actions">'+menuReviewActions(item).map(([action,label])=>`<button type="button" data-menu-review="${action}" data-menu-item="${esc(item)}">${label}</button>`).join('')+'</div><p class="menu-hint">Choose the documentation appropriate to this food; not every form is required. Saving a form does not automatically approve the item.</p>'}
function openMenuReview(action,item){
  if(action==='guide'){
    const dialog=document.createElement('dialog');dialog.className='delivery-dialog';dialog.setAttribute('aria-label','Component review guidance');
    dialog.innerHTML='<h2>Component review</h2><p>Review age-based portions and substitution rules in Compliance Guide. Your menu draft will stay available when you return.</p><button type="button">Open Compliance Guide</button><button type="button" data-close>Cancel</button>';
    dialog.querySelector('button').onclick=()=>{dialog.close();document.querySelectorAll('.cycle-dialog').forEach(d=>d.close());view='compliance';render()};dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.onclose=()=>dialog.remove();document.body.append(dialog);dialog.showModal();return;
  }
  const type=action==='recipe'?'documents':action;
  const matches=(db[type]||[]).filter(r=>String(r.name).trim().toLowerCase()===item.trim().toLowerCase());
  openForm(type,matches.length===1?matches[0].id:undefined);
  if(matches.length!==1){document.querySelector('#recordForm [name="name"]').value=action==='recipe'?item+' — recipe / crediting':item;
    if(action==='recipe')document.querySelector('#recordForm [name="notes"]').value='Menu item: '+item+'\nDocument the standardized recipe, ingredient amounts, yield, serving size, and component contribution per serving. Attach the recipe or record its filing location.';
  }
  if(action==='recipe')document.querySelector('#dialogTitle').textContent='Recipe / supporting document';
}
window.addEventListener('click',event=>{const button=event.target.closest?.('[data-menu-review]');if(button){event.preventDefault();openMenuReview(button.dataset.menuReview,button.dataset.menuItem)}});
