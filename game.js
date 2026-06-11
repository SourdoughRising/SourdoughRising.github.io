const panSizes = {
  full: { label: 'Full Pan', w: 6, h: 6, className: 'pan-full', note: 'One full bay' },
  half: { label: 'Half Pan', w: 3, h: 6, className: 'pan-half', note: 'Two fit side-by-side across the long side' },
  shotgun: { label: 'Shotgun Pan', w: 6, h: 3, className: 'pan-shotgun', note: 'Two fit stacked across the short side' }
};

const foods = {
  lettuce: { label: 'Lettuce', temp: 38, safeCold: true, colorA: '#77c84a', colorB: '#b8ef67', pattern: 'leaf' },
  tomato: { label: 'Tomato', temp: 39, safeCold: true, colorA: '#e53935', colorB: '#ff7a59', pattern: 'dice' },
  onion: { label: 'Red Onion', temp: 38, safeCold: true, colorA: '#9c4dcc', colorB: '#f0c0ff', pattern: 'rings' },
  pickles: { label: 'Pickles', temp: 39, safeCold: true, colorA: '#8a9d21', colorB: '#d5d85a', pattern: 'coins' },
  rice: { label: 'Rice', temp: 139, safeHot: true, colorA: '#fff5df', colorB: '#e8dcbf', pattern: 'grain' },
  beans: { label: 'Black Beans', temp: 138, safeHot: true, colorA: '#1f1716', colorB: '#4c3633', pattern: 'beans' },
  chicken: { label: 'Grilled Chicken', temp: 142, safeHot: true, cookTemp: 165, colorA: '#d49b5c', colorB: '#fff0c9', pattern: 'chunks' },
  beef: { label: 'Ground Beef', temp: 143, safeHot: true, cookTemp: 160, colorA: '#704024', colorB: '#b06a35', pattern: 'crumbles' },
  cheese: { label: 'Cheese', temp: 40, safeCold: true, colorA: '#ffc63a', colorB: '#fff1a8', pattern: 'shred' },
  queso: { label: 'Queso', temp: 140, safeHot: true, colorA: '#f7a93c', colorB: '#ffd36b', pattern: 'sauce' }
};

const recipes = [
  { name: 'Chicken Rice Bowl', needs: ['rice', 'chicken', 'tomato', 'lettuce'], pay: 14 },
  { name: 'Taco Plate', needs: ['beef', 'cheese', 'tomato', 'onion'], pay: 12 },
  { name: 'Salad Bowl', needs: ['lettuce', 'tomato', 'onion', 'chicken'], pay: 11 },
  { name: 'Nachos', needs: ['beef', 'queso', 'beans', 'pickles'], pay: 13 }
];

const stations = {
  coldLine: { title: 'Cold Line', description: 'Design a refrigerated assembly line using full, half, and shotgun hotel pans.', bays: 6 },
  hotLine: { title: 'Hot Line', description: 'Prototype hot holding rail. Use the same pan builder, but watch hot food temperatures.', bays: 4 },
  walkIn: { title: 'Walk-In', description: 'Bulk storage layout. Use pans as prep containers waiting to be stocked on the line.', bays: 4 },
  dryStorage: { title: 'Dry Storage', description: 'Dry goods staging. Pan logic remains available for future prep containers.', bays: 3 },
  dishPit: { title: 'Dish Pit', description: 'Clean pan staging. This will become the bottleneck for pans, utensils, and plates.', bays: 3 },
  expo: { title: 'Expo', description: 'Order control. Build tickets and serve completed dishes from stocked pans.', bays: 3 }
};

const state = {
  station: 'coldLine',
  selectedPanType: 'half',
  selectedFood: 'lettuce',
  selectedBay: null,
  selectedPanId: null,
  cash: 500,
  reputation: 100,
  tickets: [],
  layouts: {},
  inventory: {
    lettuce: { qty: 24, temp: 38 }, tomato: { qty: 18, temp: 39 }, onion: { qty: 14, temp: 38 }, pickles: { qty: 20, temp: 39 },
    rice: { qty: 16, temp: 139 }, beans: { qty: 12, temp: 138 }, chicken: { qty: 14, temp: 142 }, beef: { qty: 12, temp: 143 },
    cheese: { qty: 15, temp: 40 }, queso: { qty: 8, temp: 140 }
  },
  nextPanId: 1,
  nextTicketId: 101
};

for (const stationKey of Object.keys(stations)) state.layouts[stationKey] = [];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function makeTexture(food) {
  const f = foods[food];
  const a = encodeURIComponent(f.colorA);
  const b = encodeURIComponent(f.colorB);
  let inner = '';
  if (f.pattern === 'leaf') inner = `<path d='M5 16 C12 4 25 4 30 18 C21 14 16 25 5 16Z' fill='${b}'/><path d='M25 32 C31 20 42 21 47 33 C38 29 34 39 25 32Z' fill='${a}'/>`;
  if (f.pattern === 'dice') inner = `<rect x='4' y='5' width='11' height='10' rx='2' fill='${b}'/><rect x='22' y='8' width='12' height='12' rx='2' fill='${a}'/><rect x='9' y='27' width='13' height='11' rx='2' fill='${a}'/><rect x='33' y='29' width='10' height='10' rx='2' fill='${b}'/>`;
  if (f.pattern === 'rings') inner = `<path d='M10 18 C22 5 37 8 43 20' stroke='${b}' stroke-width='5' fill='none'/><path d='M7 35 C20 21 34 24 44 37' stroke='${a}' stroke-width='5' fill='none'/><path d='M28 8 C18 18 16 28 23 40' stroke='${b}' stroke-width='4' fill='none'/>`;
  if (f.pattern === 'coins') inner = `<circle cx='12' cy='13' r='8' fill='${b}'/><circle cx='32' cy='12' r='9' fill='${a}'/><circle cx='22' cy='32' r='10' fill='${b}'/><path d='M8 12h8M28 12h9M17 32h11' stroke='#f6f2a2' stroke-width='2'/>`;
  if (f.pattern === 'grain') inner = `<ellipse cx='10' cy='12' rx='3' ry='8' fill='${b}' transform='rotate(58 10 12)'/><ellipse cx='24' cy='15' rx='3' ry='8' fill='white' transform='rotate(75 24 15)'/><ellipse cx='37' cy='30' rx='3' ry='8' fill='${b}' transform='rotate(50 37 30)'/><ellipse cx='16' cy='36' rx='3' ry='8' fill='white' transform='rotate(80 16 36)'/>`;
  if (f.pattern === 'beans') inner = `<ellipse cx='12' cy='14' rx='8' ry='6' fill='${b}'/><ellipse cx='31' cy='13' rx='7' ry='6' fill='${a}'/><ellipse cx='22' cy='32' rx='8' ry='6' fill='${b}'/><ellipse cx='42' cy='35' rx='7' ry='6' fill='${a}'/>`;
  if (f.pattern === 'chunks') inner = `<rect x='5' y='8' width='14' height='12' rx='4' fill='${b}'/><rect x='25' y='7' width='16' height='13' rx='4' fill='${a}'/><rect x='12' y='30' width='15' height='12' rx='4' fill='${a}'/><path d='M7 9l10 9M28 8l11 9M13 31l12 9' stroke='#6b391a' stroke-width='2'/>`;
  if (f.pattern === 'crumbles') inner = `<circle cx='8' cy='10' r='5' fill='${b}'/><circle cx='21' cy='13' r='6' fill='${a}'/><circle cx='36' cy='12' r='5' fill='${b}'/><circle cx='13' cy='30' r='6' fill='${a}'/><circle cx='31' cy='34' r='7' fill='${b}'/><circle cx='43' cy='27' r='5' fill='${a}'/>`;
  if (f.pattern === 'shred') inner = `<path d='M5 8h23M12 18h28M4 31h31M22 41h20' stroke='${b}' stroke-width='4'/><path d='M9 5l18 30M31 6L12 43M43 15L25 44' stroke='${a}' stroke-width='4'/>`;
  if (f.pattern === 'sauce') inner = `<rect width='50' height='50' fill='${a}'/><path d='M-5 25 C10 9 25 43 55 20' stroke='${b}' stroke-width='7' fill='none' opacity='.8'/><circle cx='13' cy='13' r='2' fill='#c45d2a'/><circle cx='38' cy='33' r='2' fill='#c45d2a'/>`;
  return `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'><rect width='50' height='50' fill='${a}'/>${inner}</svg>")`;
}

function init() {
  renderPanTools();
  renderFoodTools();
  renderStation();
  renderTickets();
  renderInventory();
  renderStats();
  bindEvents();
  log('good', 'Prototype loaded. Design a pan layout, fill pans, generate tickets, and serve from expo.');
}

function bindEvents() {
  $$('.station-tab').forEach(btn => btn.addEventListener('click', () => switchStation(btn.dataset.station)));
  $('#clearSelectedBay').addEventListener('click', clearSelectedBay);
  $('#thermometerBtn').addEventListener('click', checkThermometer);
  $('#tempDown').addEventListener('click', () => adjustTemp(-5));
  $('#tempUp').addEventListener('click', () => adjustTemp(5));
  $('#addTicketBtn').addEventListener('click', generateTicket);
  $('#buyStockBtn').addEventListener('click', buyLowStock);
}

function renderPanTools() {
  const tools = $('#panTools');
  tools.innerHTML = '';
  Object.entries(panSizes).forEach(([key, pan]) => {
    const btn = document.createElement('button');
    btn.className = `tool ${state.selectedPanType === key ? 'active' : ''}`;
    btn.innerHTML = `${pan.label}<br><small>${pan.w}×${pan.h}</small>`;
    btn.title = pan.note;
    btn.addEventListener('click', () => { state.selectedPanType = key; renderPanTools(); });
    tools.appendChild(btn);
  });
}

function renderFoodTools() {
  const tools = $('#foodTools');
  tools.innerHTML = '';
  Object.entries(foods).forEach(([key, food]) => {
    const btn = document.createElement('button');
    btn.className = 'food-tool';
    btn.style.backgroundImage = makeTexture(key);
    btn.innerHTML = `<span>${food.label}</span>`;
    btn.addEventListener('click', () => applyFood(key));
    tools.appendChild(btn);
  });
}

function switchStation(stationKey) {
  state.station = stationKey;
  state.selectedBay = null;
  state.selectedPanId = null;
  $$('.station-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.station === stationKey));
  renderStation();
  renderSelectedInfo();
}

function renderStation() {
  const station = stations[state.station];
  $('#stationTitle').textContent = station.title;
  $('#stationDescription').textContent = station.description;
  const rack = $('#bayRack');
  rack.innerHTML = '';
  for (let i = 0; i < station.bays; i++) {
    const bay = document.createElement('div');
    bay.className = `bay ${state.selectedBay === i ? 'selected-bay' : ''}`;
    bay.dataset.bay = i;
    const grid = document.createElement('div');
    grid.className = 'bay-grid';
    bay.appendChild(grid);
    bay.addEventListener('click', (event) => {
      if (event.target.classList.contains('pan') || event.target.closest('.pan')) return;
      state.selectedBay = i;
      placePan(i);
    });
    rack.appendChild(bay);
  }
  renderPans();
}

function renderPans() {
  const layout = state.layouts[state.station];
  layout.forEach(pan => {
    const bay = $(`.bay[data-bay="${pan.bay}"] .bay-grid`);
    if (!bay) return;
    const el = document.createElement('div');
    el.className = `pan ${state.selectedPanId === pan.id ? 'selected' : ''}`;
    el.style.gridColumn = `${pan.x + 1} / span ${pan.w}`;
    el.style.gridRow = `${pan.y + 1} / span ${pan.h}`;
    el.dataset.panId = pan.id;
    if (pan.food) {
      const fill = document.createElement('div');
      fill.className = 'food-fill';
      fill.style.backgroundImage = makeTexture(pan.food);
      el.appendChild(fill);
    }
    const label = document.createElement('div');
    label.className = 'pan-label';
    label.textContent = pan.food ? foods[pan.food].label : pan.type.toUpperCase();
    el.appendChild(label);
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      state.selectedPanId = pan.id;
      state.selectedBay = pan.bay;
      renderStation();
      renderSelectedInfo();
    });
    bay.appendChild(el);
  });
}

function placePan(bayIndex) {
  const size = panSizes[state.selectedPanType];
  const layout = state.layouts[state.station];
  const placed = layout.filter(p => p.bay === bayIndex);
  const pos = findOpenPosition(placed, size.w, size.h);
  if (!pos) {
    state.selectedBay = bayIndex;
    renderStation();
    log('warn', `No room for ${size.label} in this bay. Try clearing it or use a smaller compatible pan.`);
    return;
  }
  const pan = {
    id: state.nextPanId++,
    bay: bayIndex,
    type: state.selectedPanType,
    x: pos.x,
    y: pos.y,
    w: size.w,
    h: size.h,
    food: null,
    temp: null,
    checked: false
  };
  layout.push(pan);
  state.selectedPanId = pan.id;
  renderStation();
  renderSelectedInfo();
}

function findOpenPosition(existing, w, h) {
  for (let y = 0; y <= 6 - h; y++) {
    for (let x = 0; x <= 6 - w; x++) {
      const candidate = { x, y, w, h };
      if (!existing.some(p => overlaps(candidate, p))) return { x, y };
    }
  }
  return null;
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function getSelectedPan() {
  return state.layouts[state.station].find(p => p.id === state.selectedPanId);
}

function applyFood(foodKey) {
  const pan = getSelectedPan();
  if (!pan) { log('warn', 'Select a pan before choosing food.'); return; }
  pan.food = foodKey;
  pan.temp = state.inventory[foodKey]?.temp ?? foods[foodKey].temp;
  pan.checked = false;
  renderStation();
  renderSelectedInfo();
}

function adjustTemp(delta) {
  const pan = getSelectedPan();
  if (!pan || !pan.food) { log('warn', 'Select a filled pan before changing temperature.'); return; }
  pan.temp += delta;
  pan.checked = false;
  renderSelectedInfo();
  renderStation();
}

function checkThermometer() {
  const pan = getSelectedPan();
  if (!pan || !pan.food) { log('warn', 'Select a filled pan before using the thermometer.'); return; }
  pan.checked = true;
  const food = foods[pan.food];
  const safety = evaluateSafety(pan);
  log(safety.level, `${food.label}: ${pan.temp}°F — ${safety.message}`);
  renderSelectedInfo();
}

function evaluateSafety(pan) {
  const food = foods[pan.food];
  if (!food) return { level: 'warn', message: 'Empty pan.' };
  if (food.safeCold && pan.temp > 41) return { level: 'bad', message: 'unsafe cold holding; keep cold food at 41°F or below.' };
  if (food.safeHot && pan.temp < 135) return { level: 'bad', message: 'unsafe hot holding; keep hot food at 135°F or above.' };
  return { level: 'good', message: 'holding safely.' };
}

function renderSelectedInfo() {
  const pan = getSelectedPan();
  const box = $('#selectedInfo');
  if (!pan) { box.textContent = 'No pan selected.'; return; }
  const foodLabel = pan.food ? foods[pan.food].label : 'Empty';
  const temp = pan.temp === null ? '—' : `${pan.temp}°F`;
  const safety = pan.food ? evaluateSafety(pan).message : 'Add food to start safety tracking.';
  box.innerHTML = `<strong>${panSizes[pan.type].label}</strong><br>Bay ${pan.bay + 1}<br>Size: ${pan.w}×${pan.h}<br>Food: ${foodLabel}<br>Temp: ${temp}<br>Status: ${safety}`;
}

function clearSelectedBay() {
  if (state.selectedBay === null) { log('warn', 'Click a bay first, then clear it.'); return; }
  state.layouts[state.station] = state.layouts[state.station].filter(p => p.bay !== state.selectedBay);
  state.selectedPanId = null;
  renderStation();
  renderSelectedInfo();
}

function generateTicket() {
  const recipe = recipes[Math.floor(Math.random() * recipes.length)];
  state.tickets.push({ id: state.nextTicketId++, ...recipe, created: Date.now() });
  renderTickets();
  renderStats();
}

function renderTickets() {
  const wrap = $('#tickets');
  wrap.innerHTML = '';
  if (state.tickets.length === 0) {
    wrap.innerHTML = '<p class="hint">No open tickets. Generate an order to test expo.</p>';
    return;
  }
  state.tickets.forEach(ticket => {
    const div = document.createElement('div');
    div.className = 'ticket';
    div.innerHTML = `<strong>#${ticket.id} ${ticket.name}</strong><small>Pays $${ticket.pay}</small><ul>${ticket.needs.map(n => `<li>${foods[n].label}</li>`).join('')}</ul><button data-id="${ticket.id}">Serve Ticket</button>`;
    div.querySelector('button').addEventListener('click', () => serveTicket(ticket.id));
    wrap.appendChild(div);
  });
}

function serveTicket(id) {
  const ticket = state.tickets.find(t => t.id === id);
  const allPans = Object.values(state.layouts).flat();
  const missing = ticket.needs.filter(food => !allPans.some(p => p.food === food));
  const unsafe = ticket.needs
    .map(food => allPans.find(p => p.food === food))
    .filter(Boolean)
    .filter(p => evaluateSafety(p).level === 'bad' || !p.checked);

  if (missing.length) {
    state.reputation -= 3;
    log('bad', `Ticket #${id} failed: missing ${missing.map(m => foods[m].label).join(', ')}.`);
    renderStats();
    return;
  }
  if (unsafe.length) {
    state.reputation -= unsafe.length * 4;
    log('bad', `Ticket #${id} served with unverified or unsafe items: ${unsafe.map(p => foods[p.food].label).join(', ')}.`);
  } else {
    state.cash += ticket.pay;
    log('good', `Ticket #${id} served safely. Earned $${ticket.pay}.`);
  }
  state.tickets = state.tickets.filter(t => t.id !== id);
  renderTickets();
  renderStats();
}

function renderInventory() {
  const body = $('#inventoryBody');
  body.innerHTML = '';
  Object.entries(state.inventory).forEach(([key, item]) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${foods[key].label}</td><td>${item.qty}</td><td>${item.temp}°F</td>`;
    body.appendChild(tr);
  });
}

function buyLowStock() {
  const cost = 75;
  if (state.cash < cost) { log('warn', 'Not enough cash to buy stock.'); return; }
  state.cash -= cost;
  Object.values(state.inventory).forEach(item => item.qty += 5);
  renderInventory();
  renderStats();
  log('good', 'Bought +5 of each ingredient for $75.');
}

function renderStats() {
  $('#cash').textContent = `$${state.cash}`;
  $('#reputation').textContent = `${Math.max(0, state.reputation)}%`;
  $('#ticketCount').textContent = state.tickets.length;
}

function log(level, message) {
  const wrap = $('#safetyLog');
  const entry = document.createElement('div');
  entry.className = `log-entry ${level}`;
  entry.textContent = `[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] ${message}`;
  wrap.prepend(entry);
}

init();
