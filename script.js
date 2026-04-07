// ===================== DATA =====================
const TRAINS = [
  {
    id:1, name:"Rajdhani Express", number:"12951",
    dep:"16:35", arr:"08:15", dur:"15h 40m",
    price:2450, priceClass:"SL:620 | 3A:1640 | 2A:2450 | 1A:4100",
    fill:82, seats:18, weather:"🌤️ Clear",
    tags:["fast"], score:{budget:2,speed:5,crowd:2,comfort:4},
    stops:"NZM → BRC → SURAT → BORIVALI → CSTM",
    aiNote:"Fastest option but 82% full — book immediately!"
  },
  {
    id:2, name:"Duronto Express", number:"12221",
    dep:"23:00", arr:"17:30", dur:"18h 30m",
    price:1640, priceClass:"SL:480 | 3A:1640 | 2A:2380",
    fill:54, seats:120, weather:"🌧️ Slight Rain",
    tags:["crowd","comfort"], score:{budget:3,speed:3,crowd:5,comfort:4},
    stops:"NZM → Mathura → Kota → Vadodara → CSTM",
    aiNote:"Excellent crowd levels. 54% fill means comfortable journey."
  },
  {
    id:3, name:"Shatabdi Express", number:"12009",
    dep:"06:00", arr:"22:00", dur:"16h 0m",
    price:890, priceClass:"SL:890 | 3A:1240",
    fill:31, seats:280, weather:"☀️ Sunny",
    tags:["budget","crowd"], score:{budget:5,speed:4,crowd:5,comfort:3},
    stops:"NDLS → Mathura → Agra → Bhopal → CSTM",
    aiNote:"Best value! Low crowd + affordable. Ideal for flexible travelers.",
    recommended:true
  },
  {
    id:4, name:"August Kranti Rajdhani", number:"12953",
    dep:"17:40", arr:"10:55", dur:"17h 15m",
    price:1840, priceClass:"SL:550 | 3A:1840 | 2A:2680 | 1A:4500",
    fill:67, seats:65, weather:"🌤️ Clear",
    tags:["fast","comfort"], score:{budget:3,speed:4,crowd:3,comfort:5},
    stops:"NDLS → Ratlam → Surat → CSTM",
    aiNote:"Premium comfort with moderate crowd levels."
  }
];

const EMERGENCY_TRAINS = [
  {
    id:101, name:"Rajdhani Express", number:"12951",
    dep:"16:35", arr:"08:15", dur:"15h 40m",
    price:2450, fill:82, seats:4,
    quota:"Emergency Quota: 4 seats", emergency:true,
    aiNote:"Fastest available with emergency seats reserved."
  },
  {
    id:102, name:"Emergency Special", number:"EMSP-01",
    dep:"19:00", arr:"11:30", dur:"16h 30m",
    price:1800, fill:40, seats:30,
    quota:"Priority Quota: 30 seats", emergency:true, recommended:true,
    aiNote:"Emergency special run — high availability, priority boarding."
  }
];

let selectedPriority = null;
let currentBooking = null;

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date();
  const fmt = d => d.toISOString().split('T')[0];
  document.getElementById('travelDate').value = fmt(new Date(today.getTime() + 86400000));
  document.getElementById('em-date').value = fmt(today);
});

// ===================== NAV =====================
function showSection(name) {
  ['smart','emergency','dashboard'].forEach(s => {
    document.getElementById(s+'-section').style.display = s === name ? 'block' : 'none';
  });
  document.querySelectorAll('.nav-pill').forEach((p,i) => {
    p.classList.toggle('active', i === ['smart','emergency','dashboard'].indexOf(name));
  });
}

// ===================== PREFS =====================
function togglePref(el) {
  const pref = el.dataset.pref;
  const group = el.closest('.prefs-row');
  if (['today','flexible'].includes(pref)) {
    group.querySelectorAll('[data-pref="today"],[data-pref="flexible"]').forEach(c => c.classList.remove('selected'));
  } else {
    group.querySelectorAll('[data-pref="budget"],[data-pref="speed"],[data-pref="crowd"],[data-pref="comfort"]').forEach(c => c.classList.remove('selected'));
  }
  el.classList.toggle('selected');
}

function getSelectedPrefs() {
  const chips = document.querySelectorAll('.pref-chip.selected');
  return [...chips].map(c => c.dataset.pref);
}

// ===================== SEARCH =====================
function searchTrains(aiMode) {
  const section = document.getElementById('results-section');
  section.classList.add('visible');
  document.getElementById('loading-state').style.display = 'block';
  document.getElementById('results-content').style.display = 'none';

  setTimeout(() => {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('results-content').style.display = 'block';
    renderResults(aiMode);
  }, 1600);
}

function renderResults(aiMode) {
  const from = document.getElementById('fromCity').value || 'New Delhi';
  const to = document.getElementById('toCity').value || 'Mumbai';
  const prefs = getSelectedPrefs();

  // Weather
  renderWeather(from, to);

  // AI bar
  const rec = TRAINS.find(t => t.recommended) || TRAINS[2];
  let aiText = '', aiReason = '';
  if (prefs.includes('budget')) {
    aiText = `💡 Best for Budget: ${TRAINS[2].name}`;
    aiReason = `At ₹${TRAINS[2].price}, it's the most affordable while maintaining good availability (${100-TRAINS[2].fill}% seats free). Weather looks clear — smooth journey predicted.`;
  } else if (prefs.includes('speed')) {
    aiText = `⚡ Fastest Choice: ${TRAINS[0].name}`;
    aiReason = `Arrives 2h 50m earlier than alternatives. Book quickly — only ${TRAINS[0].seats} seats left (${TRAINS[0].fill}% full).`;
  } else if (prefs.includes('crowd')) {
    aiText = `🧘 Best for Comfort: ${TRAINS[2].name}`;
    aiReason = `Only 31% occupied — most space guaranteed. Weather at destination: ☀️ Sunny. Excellent conditions for travel.`;
  } else {
    aiText = `⭐ AI Top Pick: ${rec.name}`;
    aiReason = `Based on your profile, this balances cost, speed, and comfort. 69% seats still available — good booking window.`;
  }
  document.getElementById('ai-recommendation').textContent = aiText;
  document.getElementById('ai-reasoning').textContent = aiReason;

  // Cards
  document.getElementById('train-count').textContent = `${TRAINS.length} Results`;
  renderCards(TRAINS, 'cards-grid');

  // Alt routes
  renderAltRoutes(from, to);
}

function renderCards(trains, gridId) {
  const grid = document.getElementById(gridId);
  grid.innerHTML = '';
  trains.forEach((t, i) => {
    grid.innerHTML += buildCard(t, i);
  });
}

function buildCard(t, i) {
  const fillColor = t.fill > 75 ? 'fill-red' : t.fill > 50 ? 'fill-yellow' : 'fill-green';
  const tagsHtml = (t.tags||[]).map(tag => {
    const map = {cheap:'badge-cheap',fast:'badge-fast',crowd:'badge-empty',comfort:'badge-fast',budget:'badge-cheap'};
    const labels = {cheap:'💰 Cheapest',fast:'⚡ Fastest',crowd:'🧘 Least Crowded',comfort:'🛏️ Comfort',budget:'💰 Budget'};
    return `<span class="card-badge ${map[tag]||'badge-fast'}">${labels[tag]||tag.toUpperCase()}</span>`;
  }).join('');

  const emergency = t.emergency ? `<span class="card-badge badge-danger">🚨 EMERGENCY</span>` : '';
  const quotaHtml = t.quota ? `<div style="font-size:0.75rem;color:var(--priority);margin-bottom:12px;background:rgba(183,109,255,0.08);padding:8px 12px;border-radius:8px">🎫 ${t.quota}</div>` : '';

  return `
  <div class="train-card ${t.recommended?'recommended':''} ${t.emergency?'priority-card':''}" 
       style="animation-delay:${i*0.08}s">
    <div class="card-header">
      <div>
        <div class="train-name">${t.name}</div>
        <div class="train-number">#${t.number} · ${t.stops||'Multiple Stops'}</div>
      </div>
      <div class="card-badges">${tagsHtml}${emergency}</div>
    </div>
    <div class="route-row">
      <div class="station">
        <div class="station-time">${t.dep}</div>
        <div class="station-name">DEP</div>
      </div>
      <div class="route-line">
        <div class="route-duration">⏱ ${t.dur}</div>
        <div class="route-track"></div>
      </div>
      <div class="station">
        <div class="station-time">${t.arr}</div>
        <div class="station-name">ARR</div>
      </div>
    </div>
    ${quotaHtml}
    <div class="stats-row">
      <div class="stat-box">
        <div class="stat-val" style="color:var(--accent2)">${100-t.fill}%</div>
        <div class="stat-key">Seats Free</div>
      </div>
      <div class="stat-box">
        <div class="stat-val" style="color:var(--gold)">${t.seats}</div>
        <div class="stat-key">Available</div>
      </div>
      <div class="stat-box">
        <div class="stat-val" style="color:${t.fill>75?'var(--danger)':t.fill>50?'var(--gold)':'var(--accent2)'}">${t.fill > 75?'Low':'Good'}</div>
        <div class="stat-key">Chance</div>
      </div>
    </div>
    <div class="avail-row">
      <div class="avail-label">
        <span>Occupancy</span>
        <span>${t.fill}% full</span>
      </div>
      <div class="avail-bar">
        <div class="avail-fill ${fillColor}" style="width:${t.fill}%"></div>
      </div>
    </div>
    ${t.aiNote ? `<div style="font-size:0.75rem;color:var(--muted);background:var(--surface2);padding:8px 12px;border-radius:8px;margin-bottom:14px;line-height:1.5">🤖 ${t.aiNote}</div>` : ''}
    <div class="card-footer">
      <div>
        <div class="price">₹${t.price.toLocaleString()}</div>
        <div class="price-sub">per person · ${document.getElementById('travelClass')?document.getElementById('travelClass').value:'3A'}</div>
      </div>
      <button class="btn-book ${t.emergency?'emergency-book':''}" 
              onclick='openModal(${JSON.stringify(t)})'>
        ${t.emergency ? '🚨 Book Now' : 'Book →'}
      </button>
    </div>
  </div>`;
}

function renderWeather(from, to) {
  const strip = document.getElementById('weather-strip');
  const weathers = [
    {city:from, icon:'☀️', temp:'34°C', desc:'Clear, Good visibility'},
    {city:'En Route', icon:'🌤️', temp:'29°C', desc:'Partly cloudy'},
    {city:to, icon:'🌧️', temp:'27°C', desc:'Light rain expected'},
  ];
  strip.innerHTML = weathers.map(w => `
    <div class="weather-card">
      <div class="weather-icon">${w.icon}</div>
      <div>
        <div class="weather-place">${w.city}</div>
        <div class="weather-info">${w.temp} · ${w.desc}</div>
      </div>
    </div>
  `).join('');
}

function renderAltRoutes(from, to) {
  const list = document.getElementById('alt-routes-list');
  const alts = [
    {route:`${from} → Pune → ${to}`, info:'Via Pune · +3h · 15% cheaper', saving:'₹340 saved'},
    {route:`${from} → Ahmedabad → ${to}`, info:'Via Ahmedabad · +1h · Less crowd', saving:'40% less crowded'},
    {route:`${from} → ${to} (Bus+Train)`, info:'Hybrid route · Flexible timings', saving:'₹520 saved'},
  ];
  list.innerHTML = alts.map(a => `
    <div class="alt-route-item">
      <div class="alt-info">
        <strong>${a.route}</strong>
        <span>${a.info}</span>
      </div>
      <span style="font-size:0.78rem;color:var(--accent2);font-weight:600">${a.saving}</span>
    </div>
  `).join('');
}

function filterCards(type, el) {
  document.querySelectorAll('.compare-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');

  let filtered = TRAINS;
  if (type === 'cheap') filtered = [...TRAINS].sort((a,b) => a.price - b.price);
  else if (type === 'fast') filtered = [...TRAINS].sort((a,b) => {
    const toMins = dur => { const [h,m] = dur.replace('h','').replace('m','').trim().split(' '); return parseInt(h)*60+parseInt(m); };
    return toMins(a.dur) - toMins(b.dur);
  });
  else if (type === 'empty') filtered = [...TRAINS].sort((a,b) => a.fill - b.fill);

  renderCards(filtered, 'cards-grid');
}

// ===================== EMERGENCY =====================
function selectPriority(el, type) {
  document.querySelectorAll('.priority-type').forEach(p => p.classList.remove('selected'));
  el.classList.add('selected');
  selectedPriority = type;
  document.getElementById('emergency-form').style.display = 'block';
  const titles = {
    medical:'🏥 Medical Emergency Booking',
    senior:'👴 Senior Citizen Priority Booking',
    defense:'🎖️ Defense Personnel Priority Booking'
  };
  document.getElementById('emergency-form-title').textContent = titles[type];
  document.getElementById('em-results').style.display = 'none';
}

function searchEmergencyTrains() {
  document.getElementById('em-results').style.display = 'block';
  renderCards(EMERGENCY_TRAINS, 'em-cards-grid');
}

function submitEmergency() {
  const name = document.getElementById('em-name').value;
  if (!name) { alert('Please fill in your name.'); return; }
  if (!selectedPriority) { alert('Please select a priority category.'); return; }
  
  // Simulate verification
  const steps = document.querySelectorAll('.step');
  let i = 0;
  const interval = setInterval(() => {
    if (i < steps.length) {
      steps[i].style.borderColor = 'var(--accent2)';
      steps[i].querySelector('.step-num').style.color = 'var(--accent2)';
      i++;
    } else {
      clearInterval(interval);
      searchEmergencyTrains();
    }
  }, 600);
}

// ===================== MODAL =====================
function openModal(train) {
  currentBooking = train;
  document.getElementById('modal-title').textContent = 'Confirm Booking';
  document.getElementById('modal-sub').textContent = 'Fill in passenger details to complete booking';
  document.getElementById('modal-icon').textContent = train.emergency ? '🚨' : '🚄';
  document.getElementById('modal-train-name').textContent = train.name;
  document.getElementById('modal-train-details').textContent = `${train.dep} → ${train.arr} · ${train.dur}`;
  document.getElementById('modal-price').textContent = `₹${train.price.toLocaleString()}`;
  document.getElementById('modal-price-desc').textContent = train.emergency ? 'Priority booking — taxes included' : 'Including taxes & fees';
  document.getElementById('modal-booking').style.display = 'block';
  document.getElementById('modal-success').classList.remove('show');
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

function confirmBooking() {
  const name = document.getElementById('modal-passenger').value;
  if (!name) { alert('Please enter passenger name.'); return; }

  const pnr = 'PNR' + Math.floor(Math.random()*9000000+1000000);
  document.getElementById('modal-booking').style.display = 'none';
  document.getElementById('modal-success').classList.add('show');
  document.getElementById('success-pnr').textContent = `PNR: ${pnr} · Confirmation sent to your email`;
  document.getElementById('success-icon').textContent = currentBooking.emergency ? '🚨' : '🚄';
  document.getElementById('success-train').textContent = currentBooking.name;
  document.getElementById('success-details').textContent = `${currentBooking.dep} → ${currentBooking.arr} · ₹${currentBooking.price.toLocaleString()}`;
}

// Click outside modal to close
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});
