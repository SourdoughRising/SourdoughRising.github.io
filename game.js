const panSizes = {
  full: { w: 6, h: 6, label: "Full Pan" },
  half: { w: 3, h: 6, label: "Half Pan" },
  shotgun: { w: 6, h: 3, label: "Shotgun Pan" }
};

const foods = {
  lettuce: { label: "Chopped Lettuce", cls: "food-lettuce", safeCold: 41, qty: 18 },
  tomato: { label: "Diced Tomato", cls: "food-tomato", safeCold: 41, qty: 15 },
  onion: { label: "Sliced Onion", cls: "food-onion", safeCold: 41, qty: 13 },
  rice: { label: "Cooked Rice", cls: "food-rice", safeHot: 135, qty: 24 },
  chicken: { label: "Grilled Chicken", cls: "food-chicken", cook: 165, safeHot: 135, qty: 16 },
  beef: { label: "Ground Beef", cls: "food-beef", cook: 160, safeHot: 135, qty: 14 },
  sauce: { label: "Queso Sauce", cls: "food-sauce", safeHot: 135, qty: 12 },
  empty: { label: "Empty", cls: "food-empty", qty: 0 }
};

const state = {
  cash: 850,
  inspection: 100,
  clockMins: 360,
  activeStation: "cold",
  selectedBay: 0,
  bays: Array.from({ length: 4 }, (_, i) => ({ id: i, pans: [] })),
  inventory: [
    { item: "Chicken Breast", state: "raw", qty: 30, loc: "Walk-In", temp: 38, status: "safe" },
    { item: "Ground Beef", state: "raw", qty: 22, loc: "Walk-In", temp: 37, status: "safe" },
    { item: "Lettuce", state: "washed", qty: 18, loc: "Veg Prep", temp: 40, status: "safe" },
    { item: "Tomato", state: "diced", qty: 15, loc: "Veg Prep", temp: 43, status: "warn" },
    { item: "Rice", state: "dry", qty: 80, loc: "Dry Storage", temp: 68, status: "safe" },
    { item: "Clean Hotel Pans", state: "clean", qty: 20, loc: "Clean Rack", temp: "--", status: "safe" },
    { item: "Dirty Plates", state: "dirty", qty: 0, loc: "Dish Pit", temp: "--", status: "safe" }
  ],
  tickets: [],
  log: []
};

const stations = {
  receiving: { title: "Receiving Dock", desc: "Accept deliveries and route them to storage. Receiving should touch storage, not the cooking line.", actions: ["Receive Produce", "Receive Proteins", "Reject Warm Delivery"] },
  dry: { title: "Dry Storage", desc: "Bulk shelf storage for rice, pasta, oil, cans, and disposables. Use par levels to support prep.", actions: ["Pull Rice to Prep", "Pull Cans to Sauce Prep", "Audit Par Levels"] },
  walkin: { title: "Walk-In Cooler", desc: "Cold storage, raw proteins, backup prepared pans, FIFO, and temperature control.", actions: ["Pull Chicken to Protein Prep", "Pull Beef to Protein Prep", "Check Cooler Temp"] },
  protein: { title: "Protein Prep", desc: "Separate raw protein prep from ready-to-eat prep. Portion, marinate, and stage pans for hot line.", actions: ["Portion Chicken", "Season Beef", "Send Proteins to Hot Line"] },
  veg: { title: "Vegetable Prep", desc: "Wash, chop, and pan vegetables before stocking the cold line.", actions: ["Chop Lettuce", "Dice Tomatoes", "Send Veg to Cold Line"] },
  starch: { title: "Sauce/Starch Prep", desc: "Batch prep rice, pasta, sauces, and high-volume hotel pans.", actions: ["Cook Rice Batch", "Make Queso", "Send Starch to Line"] },
  cold: { title: "Cold Line", desc: "Design the hotel-pan assembly table. Keep TCS ingredients cold and easy to reach for expo.", actions: ["Temp Cold Pans", "Restock From Prep", "Run Cold Holding Audit"] },
  hot: { title: "Hot Line", desc: "Grill, range, fryer, oven, steam table, and hot holding. Cook to required internal temp.", actions: ["Cook Chicken to 165°F", "Cook Beef to 160°F", "Temp Hot Holding"] },
  expo: { title: "Expo / Pass", desc: "Ticket rail, plating, final thermometer checks, and service log.", actions: ["Generate Ticket", "Thermometer Check", "Serve Oldest Ticket"] },
  banquet: { title: "Banquet Holding", desc: "Hot boxes, carts, and staged bulk service. Holding temp matters more than speed here.", actions: ["Stage Banquet Cart", "Temp Hot Box", "Send Buffet Reload"] },
  dish: { title: "Dish Pit", desc: "Dirty dish return is separate from clean food flow. Clean pans exit toward prep and expo.", actions: ["Run Dish Machine", "Restock Clean Pans", "Sanitation Check"] }
};

const recipes = [
  { name: "Chicken Rice Bowl", need: ["rice", "chicken", "lettuce", "tomato"], checks: { chicken: 165, rice: 135 } },
  { name: "Beef Taco Bowl", need: ["beef", "rice", "onion", "sauce"], checks: { beef: 160, rice: 135, sauce: 135 } },
  { name: "Cold Salad Wrap", need: ["lettuce", "tomato", "onion", "chicken"], checks: { chicken: 165 } },
  { name: "Banquet Chicken Tray", need: ["chicken", "rice", "sauce"], checks: { chicken: 165, rice: 135, sauce: 135 }, banquet: true }
];

function $(id){ return document.getElementById(id); }
function fmtClock(){ const h = Math.floor(state.clockMins/60)%24; const m = state.clockMins%60; return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`; }

function boot(){
  Object.keys(stations).forEach(key => document.querySelector(`[data-station="${key}"]`).addEventListener("click", () => selectStation(key)));
  Object.entries(foods).forEach(([key, f]) => { if(key!=="empty") $("foodType").insertAdjacentHTML("beforeend", `<option value="${key}">${f.label}</option>`); });
  state.bays.forEach((b,i)=> $("baySelect").insertAdjacentHTML("beforeend", `<option value="${i}">Bay ${i+1}</option>`));
  $("baySelect").addEventListener("change", e => state.selectedBay = Number(e.target.value));
  $("addPanBtn").addEventListener("click", addPanToBay);
  $("clearBayBtn").addEventListener("click", clearBay);
  $("newTicketBtn").addEventListener("click", addTicket);
  $("serveTicketBtn").addEventListener("click", serveTicket);
  seedDefaultPans();
  renderAll();
  log("Prototype loaded. Professional flow is Receiving → Storage → Prep → Line → Expo, with Dish Pit separated from clean food flow.", "good");
}

function seedDefaultPans(){
  state.bays[0].pans = [{ type:"half", food:"lettuce", x:0,y:0 },{ type:"half", food:"tomato", x:3,y:0 }];
  state.bays[1].pans = [{ type:"shotgun", food:"rice", x:0,y:0 },{ type:"shotgun", food:"chicken", x:0,y:3 }];
  state.bays[2].pans = [{ type:"full", food:"empty", x:0,y:0 }];
  state.bays[3].pans = [{ type:"half", food:"beef", x:0,y:0 },{ type:"half", food:"sauce", x:3,y:0 }];
}

function selectStation(key){
  state.activeStation = key;
  if(key === "expo") addTicket(false);
  renderAll();
}

function runAction(action){
  state.clockMins += 7;
  switch(action){
    case "Receive Produce": state.inventory.push({item:"Produce Case",state:"received",qty:12,loc:"Receiving",temp:42,status:"warn"}); state.cash-=45; log("Produce received at 42°F. Move it to walk-in quickly or inspection score may drop.","warn"); break;
    case "Receive Proteins": state.inventory.push({item:"Protein Case",state:"received",qty:18,loc:"Receiving",temp:39,status:"safe"}); state.cash-=90; log("Protein case received cold and routed for walk-in storage.","good"); break;
    case "Reject Warm Delivery": state.inspection+=1; log("Rejected a warm delivery. No inventory gained, but inspection discipline improved.","good"); break;
    case "Pull Rice to Prep": moveItem("Rice","Starch/Sauce Prep",10); break;
    case "Pull Chicken to Protein Prep": moveItem("Chicken Breast","Protein Prep",6); break;
    case "Pull Beef to Protein Prep": moveItem("Ground Beef","Protein Prep",6); break;
    case "Chop Lettuce": addOrUpdate("Chopped Lettuce","prepared",8,"Cold Line",39,"safe"); log("Chopped lettuce filled into clean hotel pans for the cold line.","good"); break;
    case "Dice Tomatoes": addOrUpdate("Diced Tomato","prepared",6,"Cold Line",41,"safe"); log("Tomatoes diced and moved to cold line. Keep them cold; cut produce is a TCS risk in this prototype.","good"); break;
    case "Cook Rice Batch": addOrUpdate("Cooked Rice","cooked",12,"Hot Holding",139,"safe"); log("Rice batch cooked and held above 135°F.","good"); break;
    case "Make Queso": addOrUpdate("Queso Sauce","cooked",8,"Hot Holding",132,"warn"); state.inspection-=2; log("Queso made but hot holding is low at 132°F. Raise holding temp.","warn"); break;
    case "Cook Chicken to 165°F": addOrUpdate("Grilled Chicken","cooked",8,"Hot Holding",166,"safe"); log("Chicken cooked to 166°F and logged as safe.","good"); break;
    case "Cook Beef to 160°F": addOrUpdate("Cooked Ground Beef","cooked",8,"Hot Holding",161,"safe"); log("Ground beef cooked to 161°F and logged as safe.","good"); break;
    case "Temp Cold Pans": thermometerCold(); break;
    case "Temp Hot Holding": thermometerHot(); break;
    case "Thermometer Check": thermometerHot(); thermometerCold(); break;
    case "Generate Ticket": addTicket(); break;
    case "Serve Oldest Ticket": serveTicket(); break;
    case "Run Dish Machine": addOrUpdate("Clean Hotel Pans","clean",6,"Clean Rack","--","safe"); log("Dish machine ran. Clean pans returned to clean rack, away from dirty return.","good"); break;
    case "Sanitation Check": state.inspection+=2; log("Sanitation check passed. Dirty dish traffic remains separated from prep.","good"); break;
    default: log(`${action} completed.`,"good");
  }
  renderAll();
}

function moveItem(item, loc, qty){
  const found = state.inventory.find(i => i.item === item);
  if(!found || found.qty <= 0){ log(`${item} is missing.`,"bad"); state.inspection-=4; return; }
  found.qty = Math.max(0, found.qty - qty);
  addOrUpdate(item, found.state, qty, loc, found.temp, found.status);
  log(`${qty} ${item} moved to ${loc}.`,"good");
}

function addOrUpdate(item, itemState, qty, loc, temp, status){
  const row = state.inventory.find(i => i.item === item && i.loc === loc && i.state === itemState);
  if(row){ row.qty += qty; row.temp = temp; row.status = status; }
  else state.inventory.push({ item, state:itemState, qty, loc, temp, status });
}

function addPanToBay(){
  const bay = state.bays[state.selectedBay];
  const type = $("panType").value;
  const food = $("foodType").value;
  const spot = findOpenSpot(bay, panSizes[type]);
  if(!spot){ log(`Bay ${state.selectedBay+1} has no space for a ${panSizes[type].label}.`, "bad"); return; }
  bay.pans.push({ type, food, x:spot.x, y:spot.y });
  log(`${panSizes[type].label} of ${foods[food].label} placed in Bay ${state.selectedBay+1}.`, "good");
  renderAll();
}

function clearBay(){
  state.bays[state.selectedBay].pans = [];
  log(`Bay ${state.selectedBay+1} cleared.`, "warn");
  renderAll();
}

function findOpenSpot(bay, size){
  const grid = Array.from({length:6},()=>Array(6).fill(false));
  bay.pans.forEach(p => {
    const s = panSizes[p.type];
    for(let y=p.y;y<p.y+s.h;y++) for(let x=p.x;x<p.x+s.w;x++) if(grid[y]) grid[y][x]=true;
  });
  for(let y=0;y<=6-size.h;y++){
    for(let x=0;x<=6-size.w;x++){
      let ok = true;
      for(let yy=y;yy<y+size.h;yy++) for(let xx=x;xx<x+size.w;xx++) if(grid[yy][xx]) ok=false;
      if(ok) return {x,y};
    }
  }
  return null;
}

function thermometerCold(){
  const coldItems = ["Chopped Lettuce","Diced Tomato","Lettuce","Tomato"];
  let warnings = 0;
  state.inventory.forEach(i => { if(coldItems.includes(i.item) && Number(i.temp) > 41){ i.status="warn"; warnings++; }});
  if(warnings){ state.inspection-=warnings*2; log(`${warnings} cold item(s) are above 41°F. Cold holding warning logged.`,"warn"); }
  else log("Cold pan thermometer check passed: cold TCS items are 41°F or below.","good");
}

function thermometerHot(){
  const hot = state.inventory.filter(i => ["Hot Holding","Banquet Holding"].includes(i.loc));
  const bad = hot.filter(i => Number(i.temp) < 135);
  if(bad.length){ state.inspection-=bad.length*3; bad.forEach(i=>i.status="warn"); log(`${bad.length} hot holding item(s) are below 135°F.`,"warn"); }
  else log("Hot holding thermometer check passed: hot foods are 135°F or above.","good");
}

function addTicket(render=true){
  const r = recipes[Math.floor(Math.random()*recipes.length)];
  state.tickets.push({ id: 100 + state.tickets.length + Math.floor(Math.random()*30), ...r, age:0 });
  log(`Expo fired: ${r.name}.`, "good");
  if(render) renderAll();
}

function serveTicket(){
  if(!state.tickets.length){ log("No expo tickets to serve.","warn"); return; }
  const ticket = state.tickets.shift();
  const stocked = new Set(state.bays.flatMap(b => b.pans.map(p => p.food)));
  const missing = ticket.need.filter(n => !stocked.has(n));
  if(missing.length){
    state.inspection -= 8;
    log(`Unsafe/failed service: ${ticket.name} missing ${missing.map(m=>foods[m].label).join(", ")} from the line.`, "bad");
  } else {
    const risk = Math.random();
    if(risk < .22){
      state.inspection -= 5;
      log(`Served ${ticket.name}, but expo caught a missing thermometer verification. Warning logged.`, "warn");
    } else {
      state.cash += ticket.banquet ? 95 : 28;
      addOrUpdate("Dirty Plates","dirty",ticket.banquet ? 20 : 2,"Dish Pit","--","safe");
      log(`Served ${ticket.name} safely. Revenue added and dirty dishes sent to dish pit.`, "good");
    }
  }
  state.clockMins += 9;
  renderAll();
}

function log(msg, type="good"){
  state.log.unshift({ msg, type, time: fmtClock() });
  state.log = state.log.slice(0, 40);
}

function renderAll(){
  $("cash").textContent = `$${state.cash}`;
  $("inspection").textContent = Math.max(0, state.inspection);
  $("clock").textContent = fmtClock();
  renderStation(); renderBays(); renderInventory(); renderTickets(); renderLog();
  document.querySelectorAll(".station").forEach(el => el.classList.toggle("active", el.dataset.station === state.activeStation));
}

function renderStation(){
  const s = stations[state.activeStation];
  $("stationTitle").textContent = s.title;
  $("stationDesc").textContent = s.desc;
  $("stationActions").innerHTML = s.actions.map(a => `<button data-action="${a}">${a}</button>`).join("");
  $("stationActions").querySelectorAll("button").forEach(btn=>btn.addEventListener("click",()=>runAction(btn.dataset.action)));
  $("stationDetails").innerHTML = stationCards(state.activeStation);
}

function stationCards(key){
  const map = {
    receiving: [["Design purpose","Receiving touches storage first so raw cases do not cross expo."],["Risk","Warm deliveries, missing invoices, and cluttered dock space."]],
    dry: [["Design purpose","High-volume dry goods near receiving and prep."],["Player decision","Set par levels and avoid overbuying slow-moving stock."]],
    walkin: [["Design purpose","Cooler feeds prep, not direct plating."],["Safety","Raw proteins should stay below ready-to-eat foods in later builds."]],
    protein: [["Design purpose","Raw prep is separated from veg/cold assembly."],["Automation idea","Portion → marinate → pan → hot line queue."]],
    veg: [["Design purpose","Wash/chop produce before it becomes cold-line inventory."],["Safety","Cut produce needs cold holding once prepared."]],
    starch: [["Design purpose","Batch cooking and sauce prep create hotel-pan scale production."],["Flow","Dry storage feeds this station constantly during service."]],
    cold: [["Design purpose","Limited pan slots force assembly-line planning."],["Current rule","Full = 6×6, Half = 3×6, Shotgun = 6×3."]],
    hot: [["Design purpose","Active cooking and hot holding feed expo."],["Safety","Poultry 165°F, ground beef 160°F, hot holding 135°F+ in this prototype."]],
    expo: [["Design purpose","The pass validates tickets before service."],["Gameplay","Unsafe or missing checks reduce inspection score."]],
    banquet: [["Design purpose","Hotels stage large batches in carts and hot boxes."],["Gameplay","Adds event deadlines and long holding risks."]],
    dish: [["Design purpose","Dirty return is separated from clean food path."],["Bottleneck","No clean pans means prep and cold line stall."]]
  };
  return map[key].map(([h,p])=>`<div class="status-card"><h3>${h}</h3><p>${p}</p></div>`).join("");
}

function renderBays(){
  $("coldTable").innerHTML = state.bays.map((bay,i)=>`
    <div class="bay">
      <div class="bay-title">Cold Table Bay ${i+1}</div>
      <div class="bay-grid">
        ${bay.pans.map(p=>{
          const f = foods[p.food];
          return `<div class="pan ${p.type} ${f.cls}" style="grid-column:${p.x+1}/span ${panSizes[p.type].w};grid-row:${p.y+1}/span ${panSizes[p.type].h}"><span class="pan-label">${panSizes[p.type].label}: ${f.label}</span></div>`
        }).join("")}
      </div>
    </div>`).join("");
}

function renderInventory(){
  $("inventoryBody").innerHTML = state.inventory.map(i=>`<tr><td>${i.item}</td><td>${i.state}</td><td>${i.qty}</td><td>${i.loc}</td><td>${i.temp}${typeof i.temp === "number" ? "°F" : ""}</td><td class="${i.status}">${i.status}</td></tr>`).join("");
}
function renderTickets(){
  $("tickets").innerHTML = state.tickets.length ? state.tickets.map(t=>`<div class="ticket"><b>#${t.id} ${t.name}</b>${t.banquet?" <span class='warn'>BANQUET</span>":""}<ul>${t.need.map(n=>`<li>${foods[n].label}</li>`).join("")}</ul></div>`).join("") : `<div class="ticket">No active tickets.</div>`;
}
function renderLog(){
  $("log").innerHTML = state.log.map(l=>`<div class="log-entry ${l.type}"><b>${l.time}</b> — ${l.msg}</div>`).join("");
}

boot();
