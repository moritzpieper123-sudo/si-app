'use strict';
/* Gym: a small training log. All data lives in localStorage on this phone. */

const KEY = 'gym-data-v1';
const VERSION = '1.1';
const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const WEEK_MILESTONES = [4, 8, 12, 26, 52];
const TOTAL_MILESTONES = [10, 25, 50, 100, 200];

/* ---------- state ---------- */
// plan: { days: [{ id, name, ex: [{ name, sets }] }] }
// logs: { 'YYYY-MM-DD': { day: dayId|null } }  (a day with an entry = gym day)
// lifts: { 'exercise name (lowercase)': { 'YYYY-MM-DD': kg } }
const defaults = () => ({
  plan: { days: [] }, logs: {}, lifts: {}, celebrated: {},
  settings: { theme: 'pink', pin: null, weeklyGoal: 3, sound: true, lockAfter: 30, lastExport: null },
});
let S = load();
function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) return merge(JSON.parse(raw)); } catch (e) { /* storage blocked */ }
  return defaults();
}
function merge(data) {
  const d = defaults();
  for (const k in d) {
    if (data[k] === undefined) continue;
    d[k] = d[k] && typeof d[k] === 'object' && !Array.isArray(d[k]) ? Object.assign(d[k], data[k]) : data[k];
  }
  if (!d.plan || !Array.isArray(d.plan.days)) d.plan = { days: [] };
  return d;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }

/* ---------- helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 10);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => fmt(new Date());
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return fmt(d); };
const dowMon = s => (parse(s).getDay() + 6) % 7;
const weekStart = s => addDays(s, -dowMon(s));
const shortDate = s => parse(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const buzz = n => { try { navigator.vibrate && navigator.vibrate(n); } catch (e) { /* unsupported on iOS */ } };
const reduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

let audioCtx;
function tone(freq = 660, dur = .12, vol = .05) {
  if (!S.settings.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch (e) { /* audio unavailable */ }
}

/* ---------- plan parsing: paste text, get training days ---------- */
const SETS_END = /(\d+\s*[x×*]\s*\d+(?:\s*[-–]\s*\d+)?\s*(?:reps?|wdh\.?|kg)?|\d+\s*(?:sets?|sätze|saetze)\b.*)\s*$/i;
function parseExercise(line) {
  let t = line.replace(/^\s*(?:[-•*·]|\d+[.)])\s+/, '').trim();
  if (!t) return null;
  const m = t.match(SETS_END);
  let sets = '', name = t;
  if (m && m.index > 0) { sets = m[1].trim(); name = t.slice(0, m.index).replace(/[\s,:;\-–—@|]+$/, '').trim(); }
  else if (m && m.index === 0) { return null; }
  else { const c = t.match(/^(.*?)\s*[:\-–—|]\s*(.+)$/); if (c && /\d/.test(c[2])) { name = c[1].trim(); sets = c[2].trim(); } }
  return name ? { name, sets } : null;
}
const hasSets = l => SETS_END.test(l) || /[:\-–—|]\s*\d/.test(l);
function parsePlan(text) {
  const raw = text.trim();
  if (!raw) return [];
  if (raw[0] === '{' || raw[0] === '[') {
    const j = JSON.parse(raw), arr = Array.isArray(j) ? j : (j.days || (j.plan && j.plan.days));
    if (!Array.isArray(arr)) throw new Error('No days found');
    return arr.map((d, i) => ({
      id: uid(), name: String(d.name || d.day || `Day ${i + 1}`).trim(),
      ex: (d.ex || d.exercises || []).map(e => typeof e === 'string' ? parseExercise(e) : { name: String(e.name || e.exercise || '').trim(), sets: String(e.sets || e.reps || '').trim() }).filter(e => e && e.name),
    })).filter(d => d.ex.length);
  }
  const days = []; let cur = null, blockStart = true;
  const lines = raw.split(/\r?\n/).map(l => l.trim());
  lines.forEach((l, i) => {
    if (!l) { blockStart = true; return; }
    const nextNonEmpty = lines.slice(i + 1).findIndex(x => x === '') ;
    const headerLike = !hasSets(l) && (/[:：]$/.test(l) || /^(day|tag|workout|session)\b/i.test(l) || (blockStart && lines[i + 1]));
    if (headerLike) { cur = { id: uid(), name: l.replace(/[:：]\s*$/, '').replace(/^#+\s*/, ''), ex: [] }; days.push(cur); blockStart = false; return; }
    const ex = parseExercise(l); if (!ex) { blockStart = false; return; }
    if (!cur) { cur = { id: uid(), name: 'Day 1', ex: [] }; days.push(cur); }
    cur.ex.push(ex); blockStart = false;
  });
  return days.filter(d => d.ex.length);
}
const dayToText = d => d.ex.map(e => e.sets ? `${e.name} ${e.sets}` : e.name).join('\n');

/* ---------- gym logic ---------- */
const liftKey = n => n.trim().toLowerCase();
const liftLatest = n => { const h = S.lifts[liftKey(n)] || {}, ds = Object.keys(h).sort(); return ds.length ? { d: ds[ds.length - 1], kg: h[ds[ds.length - 1]] } : null; };
const isGymDay = d => !!S.logs[d];
const weekCount = ws => { let n = 0; for (let i = 0; i < 7; i++) if (isGymDay(addDays(ws, i))) n++; return n; };
const weekMet = ws => weekCount(ws) >= S.settings.weeklyGoal;
// streak = in-a-row weeks that reached the weekly goal; the running week never breaks it
function streakInfo() {
  const thisWs = weekStart(today());
  let cur = 0, ws = thisWs;
  if (!weekMet(ws)) ws = addDays(ws, -7);
  while (weekMet(ws)) { cur++; ws = addDays(ws, -7); }
  const dates = Object.keys(S.logs).sort();
  let best = 0, run = 0;
  if (dates.length) {
    for (let w = weekStart(dates[0]); w <= thisWs; w = addDays(w, 7)) {
      if (weekMet(w)) { run++; best = Math.max(best, run); } else if (w < thisWs) run = 0;
    }
  }
  return { cur, best: Math.max(best, cur), total: dates.length, week: weekCount(thisWs) };
}
function suggestedDay() {
  const days = S.plan.days; if (!days.length) return null;
  const t = S.logs[today()]; if (t && t.day && days.some(d => d.id === t.day)) return t.day;
  const last = Object.keys(S.logs).filter(d => S.logs[d].day && days.some(x => x.id === S.logs[d].day)).sort().pop();
  if (!last) return days[0].id;
  const i = days.findIndex(d => d.id === S.logs[last].day);
  return days[(i + 1) % days.length].id;
}

/* ---------- ui state ---------- */
let tab = 'today', lastTab = null, selDayId = null, calMonth = new Date(), pendingAsk = null, editId = null;
const ICONS = {
  today: '<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  plan: '<svg viewBox="0 0 24 24" class="o"><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/></svg>',
  progress: '<svg viewBox="0 0 24 24"><rect x="3" y="12" width="4.5" height="9" rx="1.2"/><rect x="9.8" y="3" width="4.5" height="18" rx="1.2"/><rect x="16.5" y="8" width="4.5" height="13" rx="1.2"/></svg>',
  more: '<svg viewBox="0 0 24 24" class="o"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2.2"/><circle cx="8" cy="17" r="2.2"/></svg>',
};
const TABS = [['today', 'Today'], ['plan', 'Plan'], ['progress', 'Progress'], ['more', 'Settings']];
function renderTabs() {
  $('#tabs').innerHTML = TABS.map(([id, label]) => `<button data-tab="${id}" aria-label="${label}" class="${tab === id ? 'on' : ''}">${ICONS[id]}</button>`).join('');
}
function go(t) { tab = t; render(); window.scrollTo({ top: 0 }); }

// numbers count up when a screen opens
const prevCount = {};
const cnt = (key, n) => `<span data-count="${n}" data-ck="${key}">${n}</span>`;
function runCounts(enter) {
  document.querySelectorAll('[data-count]').forEach(el => {
    const key = el.dataset.ck, to = Number(el.dataset.count), prev = prevCount[key];
    prevCount[key] = to;
    const from = enter || prev === undefined ? 0 : prev;
    if (from === to || reduceMotion()) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 900;
    el.textContent = from;
    (function tick(now) {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  });
}

function render() {
  renderTabs();
  const v = $('#view'), enter = tab !== lastTab; lastTab = tab;
  try { ({ today: viewToday, plan: viewPlan, progress: viewProgress, more: viewMore })[tab](v); }
  catch (err) {
    v.innerHTML = `<h1>Something went wrong</h1><div class="glass card"><div class="meta">${esc(err.message)}</div><div class="actions"><button class="btn primary" data-act="export">Save backup</button><button class="btn" data-tab="today">Home</button></div></div>`;
  }
  v.classList.toggle('enter', enter);
  if (enter) [...v.children].forEach((c, i) => c.style.setProperty('--i', Math.min(i, 9)));
  runCounts(enter);
}


/* ---------- the mascot (Pusheen picture, cut out) ---------- */
function catSvg(cls = '') { return `<img class="mascot ${cls}" src="icons/pusheen.png" alt="" draggable="false">`; }

/* ---------- theme ---------- */
function applyTheme() {
  const t = S.settings.theme === 'dark' ? 'dark' : 'pink';
  document.documentElement.dataset.theme = t;
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = t === 'dark' ? '#14090f' : '#ffeaf2';
}

/* ---------- Today ---------- */
function weekStrip() {
  const ws = weekStart(today());
  return `<div class="week">${DOW.map((x, i) => {
    const d = addDays(ws, i), on = isGymDay(d);
    return `<div class="wd">${x}<button class="day ${on ? 'complete' : ''} ${d === today() ? 'today' : ''} ${d > today() ? 'fut' : ''}" data-act="togglelog" data-d="${d}">${parse(d).getDate()}</button></div>`;
  }).join('')}</div>`;
}
function exerciseRow(e) {
  const l = liftLatest(e.name), t = (S.lifts[liftKey(e.name)] || {})[today()];
  const note = l ? `Last: ${l.kg} kg · ${shortDate(l.d)}` : 'No weight yet';
  return `<div class="exrow"><span class="exdot"></span><div class="grow"><div class="name">${esc(e.name)}</div>${e.sets ? `<div class="meta">${esc(e.sets)}</div>` : ''}<div class="meta liftnote">${esc(note)}</div></div>
    <label class="kgbox"><input class="kginput" type="number" inputmode="decimal" step="0.5" min="0" max="999" data-lift="${esc(e.name)}" value="${t !== undefined ? t : (l ? l.kg : '')}" placeholder="–" aria-label="Weight in kg for ${esc(e.name)}"><span>kg</span></label></div>`;
}
function viewToday(v) {
  const si = streakInfo(), goal = S.settings.weeklyGoal;
  const d = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  let html = `${catSvg('small', isGymDay(today()))}<h1>Today</h1><p class="sub">${d}</p>
    <div class="hero"><div class="glass"><b>🔥 ${cnt('streak', si.cur)}</b><span>Week streak</span></div><div class="glass"><b>${cnt('wk', si.week)}<small> / ${goal}</small></b><span>This week</span></div><div class="glass"><b>${cnt('tot', si.total)}</b><span>Workouts</span></div></div>
    <h2>This week</h2>${weekStrip()}`;
  const days = S.plan.days;
  if (!days.length) {
    html += `<h2>Training</h2><div class="glass card catcard">${catSvg()}<div class="name">No training plan yet</div><div class="meta" style="margin:6px 0 14px">Add your plan once. Then you only tick it off and enter your weights.</div>
      <div class="actions" style="margin:0"><button class="btn primary" data-act="importplan">Paste plan</button><button class="btn" data-act="newday">Add a day</button></div></div>`;
  } else {
    if (!selDayId || !days.some(x => x.id === selDayId)) selDayId = suggestedDay();
    const day = days.find(x => x.id === selDayId), done = isGymDay(today());
    html += `<h2>Training <span>${days.length} days</span></h2>
      <div class="daychips">${days.map(x => `<button class="${x.id === selDayId ? 'on' : ''}" data-act="pickday" data-id="${x.id}">${esc(x.name)}</button>`).join('')}</div>
      <div class="exlist">${day.ex.map(exerciseRow).join('')}</div>
      <p class="hint">Type your weight next to each exercise. It saves by itself.</p>
      <button class="bigbtn ${done ? 'done' : ''}" data-act="finish">${done ? 'Workout done ✓ (tap to undo)' : 'Finish workout'}</button>`;
  }
  v.innerHTML = html;
}

// typing a weight saves it for today (empty field removes today's entry); no redraw, so the keyboard stays open
document.addEventListener('change', e => {
  const inp = e.target.closest && e.target.closest('.kginput');
  if (!inp) return;
  const name = inp.dataset.lift, key = liftKey(name), raw = inp.value.replace(',', '.').trim(), kg = parseFloat(raw), t = today();
  if (raw === '') { if (S.lifts[key]) { delete S.lifts[key][t]; if (!Object.keys(S.lifts[key]).length) delete S.lifts[key]; } }
  else if (isNaN(kg) || kg < 0 || kg > 999) { toast('Enter a weight between 0 and 999 kg'); return; }
  else { (S.lifts[key] = S.lifts[key] || {})[t] = Math.round(kg * 10) / 10; inp.value = S.lifts[key][t]; }
  save();
  const n = inp.closest('.exrow').querySelector('.liftnote'), l = liftLatest(name);
  if (n) n.textContent = l ? `Last: ${l.kg} kg · ${shortDate(l.d)}` : 'No weight yet';
  if (raw !== '') { tone(660, .08); toast('Saved'); }
});

/* ---------- Plan ---------- */
function viewPlan(v) {
  const days = S.plan.days;
  v.innerHTML = `<h1>Plan</h1><p class="sub">Your training days and exercises.</p>
    <div class="actions" style="margin:0 0 14px"><button class="btn primary" data-act="newday">+ Add day</button><button class="btn" data-act="importplan">Paste plan</button></div>
    ${days.length ? days.map(d => `<div class="glass card"><div class="dayhead"><div class="grow"><b>${esc(d.name)}</b><div class="meta">${d.ex.length} exercises</div></div>
      <button class="btn small" data-act="editday" data-id="${d.id}">Edit</button></div>
      ${d.ex.map(e => `<div class="exline"><div>${esc(e.name)}</div><span>${esc(e.sets)}</span></div>`).join('')}</div>`).join('')
      : '<div class="glass empty catcard">'+catSvg()+'No days yet. Tap + Add day, or paste a whole plan at once.</div>'}`;
}
function daySheet(d) {
  editId = d ? d.id : null;
  openSheet(`<h3>${d ? 'Edit day' : 'New day'}</h3>
    <label>Name</label><input id="dname" value="${d ? esc(d.name) : ''}" placeholder="e.g. Legs">
    <label>Exercises (one per line)</label><textarea id="dex" class="big" placeholder="Squat 4x8&#10;Leg press 3x12&#10;Calf raise 3x15">${d ? esc(dayToText(d)) : ''}</textarea>
    <p class="hint">Write the sets after the name, like 4x8. Weights are entered on the Today screen.</p>
    <div class="actions"><button class="btn primary" data-act="saveday">Save</button></div>
    ${d ? '<div class="actions" style="margin-top:10px"><button class="btn danger" data-act="delday">Delete day</button></div>' : ''}`);
}
function importSheet() {
  openSheet(`<h3>Paste plan</h3>
    <p class="hint" style="margin-top:0">Paste the whole plan. Put a day name on its own line, the exercises below it, and an empty line between days. This replaces the current plan.</p>
    <textarea id="plantext" class="big" placeholder="Day 1 – Push&#10;Bench press 4x8&#10;Shoulder press 3x10&#10;&#10;Day 2 – Pull&#10;Lat pulldown 4x10&#10;Row 3x12"></textarea>
    <div class="actions"><button class="btn primary" data-act="doimport">Import</button></div>`);
}

/* ---------- Progress ---------- */
function liftChart(pts) {
  const W = 300, H = 130, L = 34, R = 12, T = 12, B = 22;
  const ys = pts.map(p => p.kg), t0 = parse(pts[0].d).getTime(), t1 = parse(pts[pts.length - 1].d).getTime();
  let lo = Math.min(...ys), hi = Math.max(...ys); if (hi === lo) { lo -= 1; hi += 1; } const padY = (hi - lo) * .15; lo = Math.max(0, lo - padY); hi += padY;
  const X = d => pts.length === 1 || t1 === t0 ? (L + W - R) / 2 : L + (parse(d).getTime() - t0) / (t1 - t0) * (W - L - R);
  const Y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.d).toFixed(1)} ${Y(p.kg).toFixed(1)}`).join(' ');
  const area = `${line} L${X(pts[pts.length - 1].d).toFixed(1)} ${H - B} L${X(pts[0].d).toFixed(1)} ${H - B} Z`;
  const r = v => Math.round(v * 10) / 10;
  return `<svg viewBox="0 0 ${W} ${H}" class="liftsvg" role="img" aria-label="Weight over time">
    <line x1="${L}" x2="${W - R}" y1="${Y(hi)}" y2="${Y(hi)}" class="lg"/><line x1="${L}" x2="${W - R}" y1="${Y(lo)}" y2="${Y(lo)}" class="lg"/>
    <text x="${L - 6}" y="${Y(hi) + 4}" text-anchor="end" class="lt">${r(hi)}</text><text x="${L - 6}" y="${Y(lo) + 4}" text-anchor="end" class="lt">${r(lo)}</text>
    ${pts.length > 1 ? `<path d="${area}" class="la"/><path d="${line}" class="ll"/>` : ''}
    ${pts.map(p => `<circle cx="${X(p.d).toFixed(1)}" cy="${Y(p.kg).toFixed(1)}" r="4" class="ld"><title>${shortDate(p.d)}: ${p.kg} kg</title></circle>`).join('')}
    <text x="${L}" y="${H - 5}" class="lt">${shortDate(pts[0].d)}</text>${pts.length > 1 ? `<text x="${W - R}" y="${H - 5}" text-anchor="end" class="lt">${shortDate(pts[pts.length - 1].d)}</text>` : ''}</svg>`;
}
function calendarHtml() {
  const y = calMonth.getFullYear(), m = calMonth.getMonth(), first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate(), lead = (first.getDay() + 6) % 7;
  let cells = DOW.map(x => `<div class="dow">${x}</div>`).join('') + '<div></div>'.repeat(lead);
  for (let i = 1; i <= days; i++) {
    const d = `${y}-${pad(m + 1)}-${pad(i)}`;
    cells += `<button class="day ${isGymDay(d) ? 'complete' : ''} ${d === today() ? 'today' : ''} ${d > today() ? 'fut' : ''}" data-act="togglelog" data-d="${d}">${i}</button>`;
  }
  return `<div class="cal-head"><button data-act="prevm">‹</button><div class="name">${first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</div><button data-act="nextm">›</button></div>
    <div class="glass cal">${cells}</div><p class="hint">Green = you trained. Tap a day to add or remove a workout.</p>`;
}
function viewProgress(v) {
  const si = streakInfo();
  const names = {};
  S.plan.days.forEach(d => d.ex.forEach(e => { names[liftKey(e.name)] = e.name; }));
  Object.keys(S.lifts).forEach(k => { if (!names[k]) names[k] = k; });
  const cards = Object.keys(names).filter(k => S.lifts[k]).map(k => {
    const h = S.lifts[k], pts = Object.keys(h).sort().map(dd => ({ d: dd, kg: h[dd] })), first = pts[0].kg, last = pts[pts.length - 1].kg, diff = Math.round((last - first) * 10) / 10, best = Math.max(...pts.map(p => p.kg));
    return `<div class="glass card"><div class="row"><div class="grow"><div class="name">${esc(names[k])}</div><div class="meta">Best ${best} kg · ${pts.length} ${pts.length === 1 ? 'entry' : 'entries'}</div></div>
      <div style="text-align:right"><b style="font-size:22px">${last} kg</b><div class="meta" style="color:${diff > 0 ? 'var(--ok)' : 'var(--dim)'}">${pts.length > 1 ? (diff > 0 ? '+' : '') + diff + ' kg' : 'first entry'}</div></div></div>${liftChart(pts)}</div>`;
  });
  v.innerHTML = `<h1>Progress</h1><p class="sub">Your streak, your days, your weights.</p>
    <div class="hero"><div class="glass"><b>🔥 ${cnt('p-streak', si.cur)}</b><span>Week streak</span></div><div class="glass"><b>${cnt('p-best', si.best)}</b><span>Best streak</span></div><div class="glass"><b>${cnt('p-tot', si.total)}</b><span>Workouts</span></div></div>
    <p class="hint">A week counts when you train at least ${S.settings.weeklyGoal} times. Change this in Settings.</p>
    <h2>Calendar</h2>${calendarHtml()}
    <h2>Weights</h2>${cards.length ? cards.join('') : '<div class="glass empty">No weights yet. Enter them on the Today screen.</div>'}`;
}

/* ---------- Settings ---------- */
function viewMore(v) {
  const s = S.settings;
  v.innerHTML = `<h1>Settings</h1><p class="sub">Everything stays on this phone.</p>
    <div class="glass card"><div class="steprow"><div><div class="name">Workouts per week</div><div class="meta">Needed to keep your streak</div></div>
      <div class="stepper"><button data-act="goal" data-n="-1">−</button><span class="val">${s.weeklyGoal}</span><button data-act="goal" data-n="1">+</button></div></div></div>
    <div class="glass card"><div class="name" style="margin-bottom:10px">Look</div><div class="seg"><button class="${s.theme !== 'dark' ? 'on' : ''}" data-act="theme" data-t="pink">🌸 Pink mode</button><button class="${s.theme === 'dark' ? 'on' : ''}" data-act="theme" data-t="dark">🌙 Dark mode</button></div></div>
    <div class="glass card"><div class="steprow"><div class="name">Sound</div><button class="btn small" data-act="sound">${s.sound ? 'On' : 'Off'}</button></div></div>
    <div class="glass card"><div class="steprow"><div><div class="name">Passcode</div><div class="meta">4 digits to open the app</div></div>
      ${s.pin ? '<button class="btn small danger" data-act="pinoff">Remove</button>' : '<button class="btn small" data-act="pinon">Set</button>'}</div></div>
    <h2>Backup</h2>
    <div class="glass card"><div class="meta" style="margin-bottom:12px">Save a backup file now and then. If the app is ever deleted, you can load it again.${s.lastExport ? ' Last backup: ' + shortDate(s.lastExport) + '.' : ''}</div>
      <div class="actions" style="margin:0"><button class="btn primary" data-act="export">Save backup</button><label class="btn" style="margin:0;text-align:center;text-transform:none;font-family:inherit;font-style:normal;font-size:16px;color:inherit">Load backup<input id="importfile" type="file" accept="application/json,.json" hidden></label></div></div>
    <p class="hint">Gym v${VERSION}</p>`;
}

/* ---------- sheets, toast, celebration ---------- */
function openSheet(html) { $('#modal-root').innerHTML = `<div class="scrim" data-act="closesheet"><div class="glass sheet"><div class="grab"></div>${html}</div></div>`; }
function closeSheet() { $('#modal-root').innerHTML = ''; }
function ask(title, text, yes, fn) {
  pendingAsk = fn;
  openSheet(`<h3>${title}</h3><div class="desc">${text}</div><div class="actions"><button class="btn" data-act="closesheet">Cancel</button><button class="btn danger" data-act="askyes">${yes}</button></div>`);
}
function toast(msg) {
  const el = document.createElement('div'); el.className = 'toast glass'; el.textContent = msg;
  document.body.appendChild(el); setTimeout(() => el.remove(), 2800);
}
function celebrate(msg) {
  toast(msg); tone(660, .12); setTimeout(() => tone(880, .18), 120); setTimeout(() => tone(1175, .25), 260); buzz([20, 40, 20]);
  const c = $('#fx'), ctx = c.getContext('2d');
  c.width = innerWidth * devicePixelRatio; c.height = innerHeight * devicePixelRatio; ctx.scale(devicePixelRatio, devicePixelRatio);
  const cols = ['#ff7eb0', '#ffc2da', '#5fd6a0', '#ffd86b', '#ffffff'];
  const ps = Array.from({ length: 90 }, () => ({ x: innerWidth / 2, y: innerHeight * .55, vx: (Math.random() - .5) * 9, vy: -Math.random() * 11 - 3, s: Math.random() * 4 + 2, c: cols[(Math.random() * cols.length) | 0], life: 1 }));
  (function frame() {
    ctx.clearRect(0, 0, innerWidth, innerHeight); let alive = false;
    ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .28; p.life -= .011; if (p.life > 0) { alive = true; ctx.globalAlpha = p.life; ctx.fillStyle = p.c; ctx.shadowColor = p.c; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 7); ctx.fill(); } });
    if (alive) requestAnimationFrame(frame); else ctx.clearRect(0, 0, innerWidth, innerHeight);
  })();
}
// celebrate once per milestone
function checkCelebrations() {
  const si = streakInfo(), ws = weekStart(today());
  if (WEEK_MILESTONES.includes(si.cur) && S.celebrated['w' + si.cur] === undefined && weekMet(ws)) { S.celebrated['w' + si.cur] = today(); save(); celebrate(`🔥 ${si.cur}-week streak!`); return; }
  if (TOTAL_MILESTONES.includes(si.total) && S.celebrated['t' + si.total] === undefined) { S.celebrated['t' + si.total] = today(); save(); celebrate(`💪 ${si.total} workouts!`); return; }
  if (weekMet(ws) && S.celebrated['g' + ws] === undefined) { S.celebrated['g' + ws] = 1; save(); celebrate('Weekly goal reached 🎉🐾'); return; }
  tone(784, .15); buzz(25); toast('Workout logged 💪 meow!');
}

/* ---------- actions ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-tab],[data-act]'); if (!t) return;
  if (t.dataset.tab) { go(t.dataset.tab); return; }
  const a = t.dataset.act;
  if (a === 'closesheet') { if (e.target === t || t.tagName === 'BUTTON') closeSheet(); return; }
  if (a === 'askyes') { const f = pendingAsk; pendingAsk = null; closeSheet(); f && f(); return; }
  ACTIONS[a] && ACTIONS[a](t);
});
const ACTIONS = {
  pickday: t => { selDayId = t.dataset.id; render(); },
  finish: () => {
    const d = today();
    if (S.logs[d]) { delete S.logs[d]; save(); render(); toast('Workout removed'); return; }
    S.logs[d] = { day: selDayId }; save(); render(); checkCelebrations();
  },
  togglelog: t => {
    const d = t.dataset.d;
    if (d > today()) { toast('That day has not happened yet'); return; }
    if (S.logs[d]) delete S.logs[d]; else { S.logs[d] = { day: null }; tone(784, .1); }
    save(); render();
    if (S.logs[d] && d === today()) checkCelebrations();
  },
  prevm: () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1); render(); },
  nextm: () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1); render(); },
  newday: () => daySheet(null),
  editday: t => daySheet(S.plan.days.find(d => d.id === t.dataset.id)),
  saveday: () => {
    const name = $('#dname').value.trim(), ex = $('#dex').value.split(/\r?\n/).map(parseExercise).filter(Boolean);
    if (!name) { toast('Give the day a name'); return; }
    if (!ex.length) { toast('Add at least one exercise'); return; }
    if (editId) { const d = S.plan.days.find(x => x.id === editId); d.name = name; d.ex = ex; }
    else { const d = { id: uid(), name, ex }; S.plan.days.push(d); selDayId = d.id; }
    save(); closeSheet(); render(); toast('Saved');
  },
  delday: () => ask('Delete this day?', 'Your logged weights stay saved.', 'Delete', () => { S.plan.days = S.plan.days.filter(d => d.id !== editId); selDayId = null; save(); render(); }),
  importplan: () => importSheet(),
  doimport: () => {
    let days;
    try { days = parsePlan($('#plantext').value); } catch (err) { toast('Could not read that plan'); return; }
    if (!days.length) { toast('No exercises found'); return; }
    const go = () => { S.plan.days = days; selDayId = null; save(); closeSheet(); render(); toast(`${days.length} days imported`); };
    S.plan.days.length ? ask('Replace your plan?', `The current plan will be replaced by ${days.length} new days. Logged weights stay saved.`, 'Replace', go) : go();
  },
  goal: t => { S.settings.weeklyGoal = Math.max(1, Math.min(7, S.settings.weeklyGoal + Number(t.dataset.n))); save(); render(); },
  theme: t => { S.settings.theme = t.dataset.t; save(); applyTheme(); render(); },
  sound: () => { S.settings.sound = !S.settings.sound; save(); render(); },
  pinon: () => pinSetup(),
  pinoff: () => ask('Remove passcode?', 'Anyone with your phone can open the app.', 'Remove', () => { S.settings.pin = null; save(); render(); }),
  export: () => exportBackup(),
};
async function exportBackup() {
  const json = JSON.stringify(S, null, 2), name = `gym-backup-${today()}.json`;
  S.settings.lastExport = today(); save();
  try {
    const file = new File([json], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Gym backup' }); return; }
  } catch (err) { if (err && err.name === 'AbortError') return; }
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' })), a2 = document.createElement('a');
  a2.href = url; a2.download = name; document.body.appendChild(a2); a2.click(); a2.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
document.addEventListener('change', e => {
  if (e.target.id !== 'importfile' || !e.target.files[0]) return;
  const rd = new FileReader();
  rd.onload = () => { try { const data = JSON.parse(rd.result); if (!data || !data.plan) throw new Error('x'); S = merge(data); save(); selDayId = null; applyTheme(); render(); toast('Backup restored'); } catch (err) { toast('That file is not a valid backup'); } };
  rd.readAsText(e.target.files[0]);
});

/* ---------- lock ---------- */
async function hash(s) {
  try { const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('gym:' + s)); return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join(''); }
  catch (e) { return 'p:' + btoa(s); }
}
function pinPad(title, onDone, cancellable) {
  let code = ''; const root = $('#lock-root');
  const draw = () => {
    root.innerHTML = `<div class="lock"><div style="font-size:42px">🐱</div><div class="name">${title}</div>
      <div class="dots">${[0, 1, 2, 3].map(i => `<i class="${i < code.length ? 'f' : ''}"></i>`).join('')}</div>
      <div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map(k => k === '' ? '<span></span>' : `<button data-k="${k}">${k}</button>`).join('')}</div>
      ${cancellable ? '<button class="btn" id="pincancel">Cancel</button>' : ''}</div>`;
    root.querySelectorAll('[data-k]').forEach(b => b.onclick = async () => {
      buzz(6); const k = b.dataset.k;
      if (k === '⌫') code = code.slice(0, -1); else if (code.length < 4) code += k;
      draw();
      if (code.length === 4) { const ok = await onDone(code); if (ok === false) { code = ''; const l = $('.lock'); l.classList.add('shake'); setTimeout(draw, 400); } }
    });
    const c = $('#pincancel'); if (c) c.onclick = () => { root.innerHTML = ''; };
  };
  draw();
}
function pinSetup() {
  pinPad('Choose a 4-digit code', first => {
    pinPad('Repeat the code', async second => {
      if (second !== first) { toast('Codes did not match'); return false; }
      S.settings.pin = await hash(first); save(); $('#lock-root').innerHTML = ''; toast('Passcode set'); render();
    }, true);
  }, true);
}
function lockIfNeeded() {
  if (!S.settings.pin) { $('#lock-root').innerHTML = ''; return; }
  pinPad('Enter your code', async c => { if ((await hash(c)) === S.settings.pin) { $('#lock-root').innerHTML = ''; return true; } buzz([30, 30, 30]); return false; }, false);
}
let hiddenAt = 0, knownToday = today();
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { hiddenAt = Date.now(); return; }
  if (S.settings.pin && Date.now() - hiddenAt >= (S.settings.lockAfter ?? 30) * 1000) lockIfNeeded();
  const t = today(); if (t !== knownToday) { knownToday = t; render(); }
});
// pull a sheet down by its grab bar to close it
(function () {
  let startY = 0, dy = 0, sheet = null;
  document.addEventListener('touchstart', e => { const g = e.target.closest('.grab'); if (!g) return; sheet = g.parentElement; startY = e.touches[0].clientY; dy = 0; sheet.style.transition = 'none'; }, { passive: true });
  document.addEventListener('touchmove', e => { if (!sheet) return; dy = Math.max(0, e.touches[0].clientY - startY); sheet.style.transform = `translateY(${dy}px)`; }, { passive: true });
  document.addEventListener('touchend', () => { if (!sheet) return; const sh = sheet; sheet = null; if (dy > 110) closeSheet(); else { sh.style.transition = 'transform .35s cubic-bezier(.22,.9,.3,1)'; sh.style.transform = ''; } });
})();

/* ---------- boot ---------- */
applyTheme();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { /* offline cache optional */ });
render();
lockIfNeeded();
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { /* not supported */ }
if (Object.keys(S.logs).length && (!S.settings.lastExport || parse(today()) - parse(S.settings.lastExport) > 14 * 864e5)) setTimeout(() => toast('Tip: save a backup in Settings'), 2500);
