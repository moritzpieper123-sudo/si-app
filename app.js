'use strict';
/* SI: private self-improvement app. All data lives in localStorage on this device. */

const CATS = ['Physique', 'Money', 'Social', 'Knowledge', 'Looks'];
const CATCOL = { Physique: '#ff7a59', Money: '#6ee7a8', Social: '#6fb5ff', Knowledge: '#b794f6', Looks: '#ff8fc7' };
const CATICON = {
  Physique: '<svg viewBox="0 0 24 24"><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/></svg>',
  Money: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M14.8 9.4c-.6-.9-1.6-1.3-2.8-1.3-1.5 0-2.6.7-2.6 1.9 0 2.7 5.6 1.3 5.6 3.9 0 1.2-1.1 2-2.9 2-1.3 0-2.4-.5-3-1.5M12 6.5v1.6M12 15.9v1.6"/></svg>',
  Social: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8.5" r="3.2"/><path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M16 5.6a3 3 0 0 1 0 5.8M18 14.2c1.8.7 3 2.3 3 4.8"/></svg>',
  Knowledge: '<svg viewBox="0 0 24 24"><path d="M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5V19c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5z"/><path d="M12 6v13.5"/></svg>',
  Looks: '<svg viewBox="0 0 24 24"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/></svg>',
};
const MILESTONES = [7, 30, 100, 200, 365];
const KEY = 'si-data-v1';
const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DOW_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
// every question belongs to a group: 'Day' (general) or one of the five categories
const GROUPS = ['Day', ...CATS];
const REFLECTION = [
  { id: 'mood', cat: 'Day', label: 'Mood', q: 'How is your mood today?', type: 'emoji' },
  { id: 'energy', cat: 'Day', label: 'Energy', q: 'How was your energy?', type: 'emoji' },
  { id: 'sleep', cat: 'Day', label: 'Sleep', q: 'How did you sleep last night?', type: 'abc', opts: ['Great (7h or more)', 'Okay (5 to 7h)', 'Bad (under 5h)'] },
  { id: 'calm', cat: 'Day', label: 'Calm', q: 'How calm and relaxed did you feel?', type: 'emoji' },
  { id: 'motivation', cat: 'Day', label: 'Motivation', q: 'How motivated were you today?', type: 'slider', lo: 'No drive', hi: 'Unstoppable' },
  { id: 'satisfaction', cat: 'Day', label: 'Satisfaction', q: 'How satisfied are you with your day overall?', type: 'slider', lo: 'Not at all', hi: 'Very' },
  { id: 'body', cat: 'Physique', label: 'Body feeling', q: 'How does your body feel (soreness, health)?', type: 'slider', lo: 'Bad', hi: 'Great' },
  { id: 'training', cat: 'Physique', label: 'Activity', q: 'How was your physical activity today?', type: 'abc', opts: ['Strong session', 'Light movement', 'Almost none'] },
  { id: 'diet', cat: 'Physique', label: 'Diet', q: 'How did you eat today?', type: 'abc', opts: ['Healthy', 'Okay', 'Poor'] },
  { id: 'moneywork', cat: 'Money', label: 'Income work', q: 'How productive were you on making money?', type: 'slider', lo: 'Not at all', hi: 'Very productive' },
  { id: 'spend', cat: 'Money', label: 'Spending', q: 'How was your spending today?', type: 'abc', opts: ['On plan', 'A few extras', 'Overspent'] },
  { id: 'moneyconf', cat: 'Money', label: 'Money outlook', q: 'How confident do you feel about your money progress?', type: 'slider', lo: 'Worried', hi: 'Confident' },
  { id: 'social', cat: 'Social', label: 'Connection', q: 'How did you feel around people?', type: 'abc', opts: ['Connected', 'Neutral', 'Withdrawn'] },
  { id: 'convo', cat: 'Social', label: 'Conversations', q: 'How good were your conversations today?', type: 'slider', lo: 'Awkward', hi: 'Great' },
  { id: 'reach', cat: 'Social', label: 'Reaching out', q: 'Did you reach out to or help someone?', type: 'abc', opts: ['Yes, more than once', 'Once', 'No'] },
  { id: 'learn', cat: 'Knowledge', label: 'Learning', q: 'How much did you learn today?', type: 'slider', lo: 'Nothing', hi: 'A lot' },
  { id: 'focus', cat: 'Knowledge', label: 'Focus', q: 'How was your focus?', type: 'abc', opts: ['Sharp', 'Average', 'Scattered'] },
  { id: 'deep', cat: 'Knowledge', label: 'Deep work', q: 'How much deep work did you do?', type: 'abc', opts: ['2 hours or more', 'Under 2 hours', 'None'] },
  { id: 'lookconf', cat: 'Looks', label: 'Confidence', q: 'How confident did you feel about how you looked?', type: 'slider', lo: 'Not at all', hi: 'Very' },
  { id: 'groom', cat: 'Looks', label: 'Care routine', q: 'Did you do your grooming and skincare routine?', type: 'abc', opts: ['Fully', 'Partly', 'Skipped'] },
  { id: 'posture', cat: 'Looks', label: 'Posture', q: 'How was your posture and body language?', type: 'abc', opts: ['Strong', 'Okay', 'Slouched'] },
];
const EMOJI = ['😞', '😕', '😐', '🙂', '😄'];

/* ---------- state ---------- */
const defaults = () => ({
  habits: [], logs: {}, rests: {},
  water: { goal: 2500, quick: [150, 250, 500], log: {} },
  goals: [], reflections: {}, settings: { pin: null }, celebrated: {},
  income: { goal: 1000, sources: [] },
});
let S = load();
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return Object.assign(defaults(), JSON.parse(raw));
  } catch (e) { /* storage blocked: start empty */ }
  return defaults();
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
const dowMon = s => (parse(s).getDay() + 6) % 7; // Mon = 0
const weekStart = s => addDays(s, -dowMon(s));
const buzz = (n = 12) => { try { navigator.vibrate && navigator.vibrate(n); } catch (e) { /* unsupported on iOS */ } };

let audioCtx;
function tone(freq = 660, dur = .12, vol = .05) {
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

/* ---------- habit logic ---------- */
const habitDue = (h, d) => d >= h.created && (!h.days || h.days.includes(dowMon(d)));
const isRest = (h, d) => (S.rests[d] || []).includes(h.id);
const value = (h, d) => (S.logs[d] && S.logs[d][h.id]) || 0;
const isMax = h => h.type === 'num' && h.mode === 'max';
const isOver = (h, d) => isMax(h) && value(h, d) > h.target;
const isDone = (h, d) => h.type === 'num' ? (isMax(h) ? value(h, d) > 0 && value(h, d) <= h.target : value(h, d) >= h.target) : value(h, d) >= 1;
const hProgress = (h, d) => h.type === 'num' ? (isMax(h) ? (isDone(h, d) ? 1 : 0) : Math.min(1, value(h, d) / h.target)) : (value(h, d) ? 1 : 0);
function restsUsedThisPeriod(h, d) {
  const per = h.restPer === 'month';
  let n = 0;
  for (const day in S.rests) {
    if (!S.rests[day].includes(h.id)) continue;
    if (per ? day.slice(0, 7) === d.slice(0, 7) : weekStart(day) === weekStart(d)) n++;
  }
  return n;
}
function dayStats(d, cat) {
  const due = S.habits.filter(h => habitDue(h, d) && (!cat || h.cat === cat));
  if (!due.length) return { due: 0, done: 0, rest: 0, ratio: 0, complete: false };
  let done = 0, rest = 0;
  due.forEach(h => { if (isDone(h, d)) done++; else if (isRest(h, d)) rest++; });
  const progress = due.reduce((a, h) => a + (isRest(h, d) && !isDone(h, d) ? 1 : hProgress(h, d)), 0);
  return { due: due.length, done, rest, ratio: progress / due.length, complete: done + rest === due.length };
}
function streakInfo(upTo = today()) {
  const dates = Object.keys(S.logs).concat(Object.keys(S.rests), S.habits.map(h => h.created)).sort();
  if (!dates.length) return { cur: 0, best: 0 };
  const start = dates[0];
  let cur = 0, best = 0, run = 0;
  for (let d = start; d <= upTo; d = addDays(d, 1)) {
    const st = dayStats(d);
    if (!st.due) continue;
    if (st.complete) { run++; best = Math.max(best, run); }
    else if (d === upTo) { /* today still open: do not break the run yet */ }
    else run = 0;
  }
  cur = run;
  return { cur, best };
}
function habitStreak(h) {
  let run = 0, best = 0;
  const t = today();
  for (let d = h.created; d <= t; d = addDays(d, 1)) {
    if (!habitDue(h, d)) continue;
    if (isDone(h, d) || isRest(h, d)) { run++; best = Math.max(best, run); }
    else if (d !== t) run = 0;
  }
  return { cur: run, best };
}

/* ---------- ui state ---------- */
let heatCat = 'All', heatInfo = '';
let tab = 'today', calMonth = new Date(), selDay = today(), goalCat = 'All', habitCat = 'All';

const IC = {
  today: '<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  calendar: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4" class="o"/></svg>',
  goals: '<svg viewBox="0 0 24 24" class="o"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.6" class="f"/></svg>',
  income: '<svg viewBox="0 0 24 24" class="o"><path d="M3 17l6-6 4 4 8-9"/><path d="M15 6h6v6"/></svg>',
  stats: '<svg viewBox="0 0 24 24"><rect x="3" y="12" width="4.5" height="9" rx="1.2"/><rect x="9.8" y="3" width="4.5" height="18" rx="1.2"/><rect x="16.5" y="8" width="4.5" height="13" rx="1.2"/></svg>',
  gear: '<svg viewBox="0 0 24 24" class="o"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2.2"/><circle cx="8" cy="17" r="2.2"/></svg>',
};
const TABS = [['today', 'Home'], ['calendar', 'Calendar'], ['goals', 'Goals'], ['income', 'Income'], ['stats', 'Stats']];
function renderTabs() {
  $('#tabs').innerHTML = TABS.map(([id, label]) =>
    `<button data-tab="${id}" aria-label="${label}" class="${tab === id ? 'on' : ''}">${IC[id]}</button>`).join('');
}
function go(t) { tab = t; render(); window.scrollTo({ top: 0 }); }
function render() {
  renderTabs();
  const v = $('#view');
  v.style.animation = 'none'; void v.offsetWidth; v.style.animation = '';
  ({ today: viewToday, calendar: viewCalendar, goals: viewGoals, income: viewIncome, stats: viewStats, more: viewMore })[tab](v);
  const hs = $('.heatscroll'); if (hs) hs.scrollLeft = hs.scrollWidth;
  v.insertAdjacentHTML('afterbegin', tab === 'more'
    ? `<button class="hbtn" data-tab="today" aria-label="Back"><svg viewBox="0 0 24 24" class="o"><path d="M15 5l-7 7 7 7"/></svg></button>`
    : `<button class="hbtn" data-tab="more" aria-label="Settings">${IC.gear}</button>`);
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-tab]');
  if (t) { buzz(8); go(t.dataset.tab); }
});


function heatHtml() {
  const t = today();
  const start = addDays(weekStart(t), -52 * 7), endD = addDays(weekStart(t), 6);
  let cells = '';
  for (let d = start; d <= endD; d = addDays(d, 1)) {
    if (d > t) { cells += '<i class="fut"></i>'; continue; }
    let bg = '', st = null;
    if (heatCat === 'All') {
      st = dayStats(d);
      if (st.due && (st.done || st.rest || st.ratio > 0)) {
        let best = null, bestScore = -1;
        CATS.forEach(c => { const cs = dayStats(d, c); const sc = cs.due ? cs.ratio * 100 + cs.done : -1; if (sc > bestScore) { bestScore = sc; best = c; } });
        bg = `background:${CATCOL[best]};opacity:${(.3 + st.ratio * .7).toFixed(2)}`;
      }
    } else {
      st = dayStats(d, heatCat);
      if (st.due && (st.done || st.rest || st.ratio > 0)) bg = `background:${CATCOL[heatCat]};opacity:${(.25 + st.ratio * .75).toFixed(2)}`;
    }
    cells += `<i style="${bg}" class="${d === t ? 'tdy' : ''}" data-act="heatday" data-d="${d}"></i>`;
  }
  const cats = ['All', ...CATS];
  return `<div class="heatwrap"><div class="cats">${cats.map(c => `<button class="${heatCat === c ? 'on' : ''}" data-act="heatcat" data-c="${c}">${c === 'All' ? c : `<b class="dot" style="background:${CATCOL[c]}"></b>${c}`}</button>`).join('')}</div>
    <div class="heatscroll"><div class="heatgrid">${cells}</div></div>
    <div class="heatinfo">${heatInfo || 'Tap a square to see that day. Scroll left for earlier months.'}</div></div>`;
}

/* ---------- today ---------- */
function ring(pct, size = 96, color = 'var(--accent)') {
  const r = 40, c = 2 * Math.PI * r;
  return `<svg class="water-ring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="${r}" stroke="rgba(255,255,255,.1)"/><circle cx="50" cy="50" r="${r}" stroke="${color}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - Math.min(1, pct))}" transform="rotate(-90 50 50)" style="transition:stroke-dashoffset .8s var(--ease)"/></svg>`;
}
function habitRow(h, d) {
  const done = isDone(h, d), rest = isRest(h, d) && !done, col = CATCOL[h.cat] || '#fff';
  const hs = habitStreak(h);
  const check = h.type === 'bool'
    ? `<button class="tcheck ${done ? 'on' : rest ? 'rest' : ''}" data-act="toggle" data-id="${h.id}">${rest ? '☾' : '✓'}</button>`
    : `<button class="tcheck ${done ? 'on' : rest ? 'rest' : ''} ${isOver(h, d) ? 'over' : ''}" data-act="${done ? 'noop' : 'inc'}" data-id="${h.id}">${done ? '✓' : rest ? '☾' : '+'}</button>`;
  const num = h.type === 'num' ? `<div class="tnum"><div class="stepper"><button data-act="dec" data-id="${h.id}">−</button><span class="val" data-act="typeval" data-id="${h.id}">${value(h, d)}<small> / ${h.target} ${esc(h.unit)}</small></span><button data-act="inc" data-id="${h.id}">+</button></div>
    <div class="bar ${isOver(h, d) ? 'red' : ''}" style="margin-top:8px"><i style="width:${Math.min(100, value(h, d) / h.target * 100)}%"></i></div></div>` : '';
  return `<div class="tile ${done ? 'done' : ''}" style="--c:${col}">
    <div class="ttop"><div class="ticon">${CATICON[h.cat] || ''}</div>${check}</div>
    <div class="tbody" data-act="detail" data-id="${h.id}"><div class="tname">${esc(h.name)}</div>
      <div class="tmeta">${hs.cur ? '🔥 ' + hs.cur + (hs.cur === 1 ? ' day' : ' days') : h.cat}${h.type === 'num' ? (isMax(h) ? ' · max' : '') : ''}${isOver(h, d) ? ' · <span style="color:#ff8a8a">over</span>' : ''}</div></div>${num}</div>`;
}
const tiles = html => `<div class="tiles">${html}</div>`;
function detailSheet(h) {
  const d = selDay, hs = habitStreak(h), col = CATCOL[h.cat];
  const sched = !h.days ? 'Every day' : h.days.slice().sort().map(i => DOW_NAMES[i]).join(', ');
  const rest = isRest(h, d) && !isDone(h, d);
  const left = h.restLimit ? Math.max(0, h.restLimit - restsUsedThisPeriod(h, d) + (rest ? 1 : 0)) : 0;
  openSheet(`<div class="dhead" style="--c:${col}"><div class="ticon big">${CATICON[h.cat] || ''}</div><div><h3 style="margin:0">${esc(h.name)}</h3><div class="meta">${h.cat}</div></div></div>
    ${h.desc ? `<div class="desc">${esc(h.desc)}</div>` : '<div class="desc dim">No description yet. Tap Edit to add details, for example a weekly plan.</div>'}
    <div class="facts"><div><span>Schedule</span><b>${sched}</b></div>
      ${h.type === 'num' ? `<div><span>${isMax(h) ? 'Daily limit' : 'Daily goal'}</span><b>${h.target} ${esc(h.unit)}</b></div>` : ''}
      <div><span>Streak</span><b>🔥 ${hs.cur} (best ${hs.best})</b></div>
      ${h.restLimit ? `<div><span>Rest days left</span><b>${left} this ${h.restPer}</b></div>` : ''}</div>
    <div class="actions">${h.restLimit ? `<button class="btn" data-act="rest" data-id="${h.id}">${rest ? 'Undo rest day' : 'Take rest day'}</button>` : ''}<button class="btn" data-act="edit" data-id="${h.id}">Edit</button><button class="btn primary" data-act="closesheet">Close</button></div>`);
}
function viewToday(v) {
  const d = selDay, isToday = d === today();
  const due = S.habits.filter(h => habitDue(h, d));
  const st = dayStats(d), si = streakInfo();
  const w = S.water.log[d] || 0, wp = w / S.water.goal;
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const cats = ['All', ...CATS];
  const shown = due.filter(h => habitCat === 'All' || h.cat === habitCat);
  v.innerHTML = `
    <h1>${isToday ? greeting : parse(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</h1>
    <p class="sub">${isToday ? parse(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : '<a data-act="gotoday" style="color:var(--accent)">Back to today</a>'}</p>
    <div class="hero">
      <div class="glass"><b>🔥 ${si.cur}</b><span>Day streak</span></div>
      <div class="glass"><b>${st.due ? Math.round(st.ratio * 100) : 0}%</b><span>Done</span></div>
      <div class="glass"><b>${si.best}</b><span>Best streak</span></div>
    </div>
    <h2>Year heat map <span>${heatCat === 'All' ? 'all categories' : heatCat}</span></h2>${heatHtml()}
    <h2>Hydration</h2>
    <div class="glass card"><div class="row">${ring(wp, 96, wp >= 1 ? 'var(--ok)' : 'var(--accent)')}
      <div class="grow"><div class="name" style="font-size:24px">${w} / ${S.water.goal} ml</div>
      <div class="meta">${wp >= 1 ? 'Goal reached 💧' : Math.max(0, S.water.goal - w) + ' ml to go'}</div></div></div>
      <div class="seg" style="margin-top:14px">${S.water.quick.map(q => `<button data-act="water" data-ml="${q}">+${q} ml</button>`).join('')}<button data-act="water" data-ml="-1">Undo</button></div></div>
    <h2>Habits <button class="btn small primary" data-act="newhabit">+ New</button></h2>
    <div class="cats">${cats.map(c => `<button class="${habitCat === c ? 'on' : ''}" data-act="hcat" data-c="${c}">${c}</button>`).join('')}</div>
    ${shown.length ? tiles(shown.map(h => habitRow(h, d)).join('')) : `<div class="glass empty">${S.habits.length ? 'Nothing due here today.' : 'No habits yet. Tap + to create your first one.'}</div>`}
    <h2>Day reflection</h2>
    <div class="glass card row"><div class="grow"><div class="name">${S.reflections[d] ? 'Day score ' + rOverall(S.reflections[d]) + '%' : 'Reflect on your day'}</div><div class="meta">${S.reflections[d] ? 'Tap Edit to change your answers' : '20 quick taps and sliders, no typing'}</div></div>
      <button class="btn small primary" data-act="reflect">${S.reflections[d] ? 'Edit' : 'Start'}</button></div>
`;
}

/* ---------- calendar ---------- */
function viewCalendar(v) {
  const y = calMonth.getFullYear(), m = calMonth.getMonth();
  const first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  let cells = DOW.map(x => `<div class="dow">${x}</div>`).join('') + '<div></div>'.repeat(lead);
  for (let i = 1; i <= days; i++) {
    const d = `${y}-${pad(m + 1)}-${pad(i)}`, st = dayStats(d);
    let style = '', cls = 'day';
    if (st.due) {
      if (st.complete && st.done > 0) cls += ' complete';
      else if (st.complete) cls += ' restonly';
      else if (st.ratio > 0) style = `background:rgba(245,215,110,${(.15 + st.ratio * .75).toFixed(2)});color:${st.ratio > .55 ? '#1a1606' : 'inherit'}`;
    }
    if (d === today()) cls += ' today';
    if (d === selDay) cls += ' sel';
    cells += `<button class="${cls}" style="${style}" data-act="pick" data-d="${d}">${i}</button>`;
  }
  const sel = selDay, due = S.habits.filter(h => habitDue(h, sel));
  v.innerHTML = `
    <div class="cal-head"><button data-act="prevm">‹</button><h1 style="margin:0;font-size:22px">${first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h1><button data-act="nextm">›</button></div>
    <div class="glass cal">${cells}</div>
    <div class="legend"><span><i style="background:var(--ok)"></i>Complete</span><span><i style="background:var(--accent)"></i>Partly done (brighter = more)</span><span><i style="background:var(--rest)"></i>Rest only</span></div>
    <h2>${parse(sel).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
    ${due.length ? tiles(due.map(h => habitRow(h, sel)).join('')) : '<div class="glass empty">No habits due on this day.</div>'}
    <p class="hint">Tap a habit to tick it for any past day.</p>`;
}

/* ---------- goals ---------- */
function goalPct(g) { return g.done ? 1 : g.mode === 'num' ? Math.min(1, g.progress / g.target) : 0; }
function viewGoals(v) {
  const cats = ['All', ...CATS];
  const list = S.goals.filter(g => goalCat === 'All' || g.cat === goalCat)
    .sort((a, b) => (a.done - b.done) || (a.deadline || '9').localeCompare(b.deadline || '9'));
  v.innerHTML = `<h1>Goals</h1><p class="sub">Bigger targets with a deadline.</p>
    <div class="cats">${cats.map(c => `<button class="${goalCat === c ? 'on' : ''}" data-act="gcat" data-c="${c}">${c}</button>`).join('')}</div>
    ${list.length ? list.map(g => {
      const left = g.deadline ? Math.ceil((parse(g.deadline) - parse(today())) / 864e5) : null;
      const pct = Math.round(goalPct(g) * 100);
      let status = 'On track', sc = 'var(--ok)';
      if (g.done) status = 'Done';
      else if (left !== null && left < 0) { status = 'Overdue'; sc = '#ff8a8a'; }
      else if (left !== null && g.created) {
        const total = Math.max(1, (parse(g.deadline) - parse(g.created)) / 864e5), elapsed = total - left;
        if (pct / 100 < (elapsed / total) * .8 && elapsed / total > .15) { status = 'Behind'; sc = 'var(--accent)'; }
      }
      return `<div class="goalcard"><div class="grow" data-act="editgoal" data-id="${g.id}">
        <div class="gtitle">${esc(g.title)}</div>
        <div class="gpct">${pct}%${g.mode === 'num' ? `<small> ${g.progress}/${g.target} ${esc(g.unit || '')}</small>` : ''}</div>
        <div class="bar" style="margin-top:12px"><i style="width:${pct}%"></i></div>
        <div class="meta" style="margin-top:8px"><span class="chip">${g.cat}</span></div></div>
        <div class="gside"><span style="color:${sc}">${status}</span><b>${left === null ? '' : left < 0 ? -left : left}</b><small>${left === null ? 'no deadline' : left < 0 ? 'days over' : 'days left'}</small></div>
        ${g.done ? '' : g.mode === 'num' ? `<div class="gbtns"><button class="sq" data-act="gdec" data-id="${g.id}">−</button><button class="sq on" data-act="ginc" data-id="${g.id}">+</button></div>` : `<button class="sq on gcheck" data-act="gdone" data-id="${g.id}">✓</button>`}</div>`;
    }).join('') : '<div class="empty">No goals here yet. Tap + to add one.</div>'}
    <div class="actions"><button class="btn primary" data-act="newgoal">+ New goal</button></div>`;
}


/* ---------- income ---------- */
const mkey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
function srcValue(src, mk) {
  if (src.entries[mk] !== undefined) return src.entries[mk];
  if (!src.recurring) return 0;
  const prev = Object.keys(src.entries).filter(k => k <= mk).sort().pop();
  return prev ? src.entries[prev] : 0;
}
const incomeTotal = mk => S.income.sources.reduce((a, s) => a + srcValue(s, mk), 0);
const eur = n => '€' + Math.round(n).toLocaleString('en-GB');
function smooth(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], mx = (x0 + x1) / 2;
    d += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }
  return d;
}
function incomeChart(vals, goal) {
  const W = 360, H = 170, padT = 14, padB = 8;
  const max = Math.max(goal, ...vals, 1) * 1.1;
  const x = i => i * (W / (vals.length - 1)), y = v => padT + (H - padT - padB) * (1 - v / max);
  const pts = vals.map((v, i) => [x(i), y(v)]);
  const line = smooth(pts);
  const last = pts[pts.length - 1];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <defs><linearGradient id="ig" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6ee7a8" stop-opacity=".28"/><stop offset="1" stop-color="#6ee7a8" stop-opacity="0"/></linearGradient></defs>
    <line x1="0" x2="${W}" y1="${y(goal)}" y2="${y(goal)}" stroke="rgba(255,255,255,.25)" stroke-dasharray="4 5"/>
    <path d="${line} L${W},${H} L0,${H} Z" fill="url(#ig)"/>
    <path d="${line}" fill="none" stroke="#6ee7a8" stroke-width="2.4" stroke-linecap="round" vector-effect="non-scaling-stroke" class="draw"/>
    <circle cx="${last[0] - 4}" cy="${last[1]}" r="5" fill="#000" stroke="#6ee7a8" stroke-width="2.4" vector-effect="non-scaling-stroke"/></svg>`;
}
function viewIncome(v) {
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 11 + i, 1));
  const vals = months.map(m => incomeTotal(mkey(m)));
  const cur = vals[11], prev = vals[10], goal = S.income.goal;
  const pct = goal ? Math.round(cur / goal * 100) : 0;
  const diff = prev ? Math.round((cur - prev) / prev * 100) : null;
  const total12 = vals.reduce((a, b) => a + b, 0);
  const mk = mkey(now);
  v.innerHTML = `<h1>Income</h1><p class="sub">Your monthly income sources.</p>
    <div class="metric"><div class="mhead"><em>Income</em><span>/MONTH</span></div>
      <div class="mval"><small>€</small>${Math.round(cur).toLocaleString('en-GB')}<span class="mgoal"><b style="color:var(--ok)">${pct}%</b> ↗ ${eur(goal)}</span></div></div>
    ${S.income.sources.length ? incomeChart(vals, goal) : '<div class="empty">Add your first income source to see the graph.</div>'}
    <div class="axis">${months.map((m, i) => i % 2 ? '' : `<span>${m.toLocaleDateString('en-GB', { month: 'short' })}</span>`).join('')}</div>
    <div class="hero" style="margin-top:6px"><div class="pill"><b>${diff === null ? '–' : (diff >= 0 ? '+' : '') + diff + '%'}</b><span>vs last month</span></div><div class="pill"><b>${eur(total12)}</b><span>last 12 months</span></div></div>
    <h2>Sources</h2>
    ${S.income.sources.length ? S.income.sources.map(sr => `<div class="card flat row" data-act="editsrc" data-id="${sr.id}"><div class="grow"><div class="name">${esc(sr.name)}</div><div class="meta">${sr.recurring ? 'Monthly, recurring' : 'One month only'}</div></div><b class="amt">${eur(srcValue(sr, mk))}</b></div>`).join('') : ''}
    <div class="actions"><button class="btn primary" data-act="newsrc">+ Add source</button><button class="btn" data-act="incgoal">Monthly goal</button></div>`;
}
function sourceSheet(sr) {
  const n = sr || { name: '', recurring: true, entries: {} };
  const mk = mkey(new Date());
  openSheet(`<h3>${sr ? 'Edit source' : 'New income source'}</h3>
    <label>Name</label><input id="sname" value="${esc(n.name)}" placeholder="e.g. TikTok, Tutoring, Job">
    <label>Month</label><input id="smonth" type="month" value="${mk}">
    <label>Amount for that month (€)</label><input id="samount" type="number" inputmode="decimal" value="${sr ? srcValue(sr, mk) : ''}" placeholder="0">
    <label>Repeats</label>${segHtml('srec', [['1', 'Every month'], ['0', 'This month only']], n.recurring ? '1' : '0')}
    <p class="hint">Recurring sources carry forward until you change the amount in a later month.</p>
    <div class="actions">${sr ? '<button class="btn danger" data-act="delsrc" data-id="' + sr.id + '">Delete</button>' : ''}<button class="btn" data-act="closesheet">Cancel</button><button class="btn primary" data-act="savesrc" data-id="${sr ? sr.id : ''}">Save</button></div>`);
}


/* ---------- reflection insights ---------- */
const METRICS = REFLECTION.map(q => [q.id, q.label]);
const mLabel = id => (METRICS.find(m => m[0] === id) || [0, id])[1];
// every answer becomes a score from 0 (worst) to 4 (best); A/B/C answers map to 4, 2, 0
function rScore(r, id) {
  if (!r || r[id] == null) return null;
  const q = REFLECTION.find(x => x.id === id);
  if (q && q.type === 'abc') return (2 - r[id]) * 2;
  if (q && q.type === 'slider') return r[id] / 10 * 4;
  return r[id];
}
// rating of one group (0 to 100): average of its answered questions
function rGroup(r, g) {
  const v = REFLECTION.filter(q => q.cat === g).map(q => rScore(r, q.id)).filter(x => x !== null);
  return v.length ? Math.round(mean(v) / 4 * 100) : null;
}
// overall day score: every group (Day + 5 categories) counts equally
function rOverall(r) {
  const v = GROUPS.map(g => rGroup(r, g)).filter(x => x !== null);
  return v.length ? Math.round(mean(v)) : null;
}
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const reflDates = () => Object.keys(S.reflections).sort();
function periodAvg(from, to, id) {
  const v = reflDates().filter(d => d >= from && d <= to).map(d => id ? rScore(S.reflections[d], id) : rOverall(S.reflections[d])).filter(x => x !== null);
  return v.length ? mean(v) : null;
}
function periodGroup(from, to, g) {
  const v = reflDates().filter(d => d >= from && d <= to).map(d => rGroup(S.reflections[d], g)).filter(x => x !== null);
  return v.length ? mean(v) : null;
}
function computeInsights() {
  const dates = reflDates();
  if (dates.length < 7) return null;
  const out = [];
  const t = today();
  // habits vs how you felt
  S.habits.forEach(h => {
    const days = dates.filter(d => d <= t && habitDue(h, d) && !isRest(h, d));
    const yes = days.filter(d => isDone(h, d)), no = days.filter(d => !isDone(h, d));
    if (yes.length < 3 || no.length < 3) return;
    let best = null;
    METRICS.forEach(([id]) => {
      const a = yes.map(d => rScore(S.reflections[d], id)).filter(x => x !== null), b = no.map(d => rScore(S.reflections[d], id)).filter(x => x !== null);
      if (a.length < 3 || b.length < 3) return;
      const diff = mean(a) - mean(b);
      if (!best || Math.abs(diff) > Math.abs(best.diff)) best = { id, diff };
    });
    if (best && Math.abs(best.diff) >= .5) out.push({ w: Math.abs(best.diff), text: `On days you did <b>${esc(h.name)}</b>, your ${mLabel(best.id).toLowerCase()} was ${best.diff > 0 ? 'higher' : 'lower'} by ${Math.abs(best.diff).toFixed(1)} of 4 points (${yes.length} days vs ${no.length}).`, good: best.diff > 0 });
  });
  // does finishing a category's habits show up in that category's rating?
  CATS.forEach(c => {
    const hs = S.habits.filter(h => h.cat === c);
    if (!hs.length) return;
    const full = [], part = [];
    dates.forEach(d => {
      const due = hs.filter(h => habitDue(h, d));
      const g = rGroup(S.reflections[d], c);
      if (!due.length || g === null) return;
      (due.every(h => isDone(h, d) || isRest(h, d)) ? full : part).push(g);
    });
    if (full.length >= 3 && part.length >= 3) {
      const diff = mean(full) - mean(part);
      if (Math.abs(diff) >= 10) out.push({ w: Math.abs(diff) / 25, text: `On days you finished all your <b>${c}</b> habits, your ${c} rating was ${Math.round(Math.abs(diff))} points ${diff > 0 ? 'higher' : 'lower'} (${full.length} vs ${part.length} days).`, good: diff > 0 });
    }
  });
  // water goal vs mood and energy
  const wy = dates.filter(d => (S.water.log[d] || 0) >= S.water.goal), wn = dates.filter(d => (S.water.log[d] || 0) < S.water.goal);
  if (wy.length >= 3 && wn.length >= 3) {
    const f = d => (rScore(S.reflections[d], 'energy') + rScore(S.reflections[d], 'mood')) / 2;
    const diff = mean(wy.filter(d => !isNaN(f(d))).map(f)) - mean(wn.filter(d => !isNaN(f(d))).map(f));
    if (Math.abs(diff) >= .5) out.push({ w: Math.abs(diff), text: `On days you hit your water goal, your mood and energy were ${diff > 0 ? 'higher' : 'lower'} by ${Math.abs(diff).toFixed(1)} points.`, good: diff > 0 });
  }
  // sleep vs the day
  const good = dates.filter(d => rScore(S.reflections[d], 'sleep') === 4), bad = dates.filter(d => { const x = rScore(S.reflections[d], 'sleep'); return x !== null && x < 4; });
  if (good.length >= 3 && bad.length >= 3) {
    let best = null;
    ['focus', 'learn', 'mood', 'energy'].forEach(id => {
      const a = good.map(d => rScore(S.reflections[d], id)).filter(x => x !== null), b = bad.map(d => rScore(S.reflections[d], id)).filter(x => x !== null);
      if (a.length < 3 || b.length < 3) return;
      const diff = mean(a) - mean(b);
      if (!best || Math.abs(diff) > Math.abs(best.diff)) best = { id, diff };
    });
    if (best && Math.abs(best.diff) >= .5) out.push({ w: Math.abs(best.diff), text: `After a great night of sleep, your ${mLabel(best.id).toLowerCase()} was ${best.diff > 0 ? 'higher' : 'lower'} by ${Math.abs(best.diff).toFixed(1)} points.`, good: best.diff > 0 });
  }
  // best and worst weekday
  const byDow = {};
  dates.forEach(d => { const o = rOverall(S.reflections[d]); if (o !== null) (byDow[dowMon(d)] = byDow[dowMon(d)] || []).push(o); });
  const ds = Object.keys(byDow).filter(k => byDow[k].length >= 2).map(k => [k, mean(byDow[k])]).sort((a, b) => b[1] - a[1]);
  if (ds.length >= 3 && ds[0][1] - ds[ds.length - 1][1] >= 10)
    out.push({ w: (ds[0][1] - ds[ds.length - 1][1]) / 25, text: `Your best day is usually <b>${DOW_NAMES[ds[0][0]]}</b> (${Math.round(ds[0][1])}%), your toughest is <b>${DOW_NAMES[ds[ds.length - 1][0]]}</b> (${Math.round(ds[ds.length - 1][1])}%).`, good: null });
  return out.sort((a, b) => b.w - a.w).slice(0, 5);
}
function spark(vals, w = 300, h = 54) {
  const pts = vals.map((v, i) => v === null ? null : [i * (w / (vals.length - 1)), h - 4 - (h - 8) * v / 100]).filter(Boolean);
  if (pts.length < 2) return '';
  return `<svg viewBox="0 0 ${w} ${h}" class="spark" preserveAspectRatio="none"><path d="${smooth(pts)}" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linecap="round" vector-effect="non-scaling-stroke" class="draw"/></svg>`;
}
function insightsHtml() {
  const dates = reflDates();
  if (dates.length < 3) return `<div class="glass empty">Answer the daily reflection for a few days. After 3 days you see trends, after 7 days the app starts to show what actually helps you feel better.<br><b>${dates.length} of 7 days so far.</b></div>`;
  const t = today();
  const days14 = Array.from({ length: 14 }, (_, i) => addDays(t, i - 13));
  const series = days14.map(d => S.reflections[d] ? rOverall(S.reflections[d]) : null);
  const thisW = periodAvg(addDays(t, -6), t), lastW = periodAvg(addDays(t, -13), addDays(t, -7));
  const delta = thisW !== null && lastW !== null ? Math.round(thisW - lastW) : null;
  const grow = GROUPS.map(g => {
    const a = periodGroup(addDays(t, -6), t, g), b = periodGroup(addDays(t, -13), addDays(t, -7), g);
    if (a === null) return '';
    const col = g === 'Day' ? 'var(--accent)' : CATCOL[g];
    return `<div class="mrow cat"><span><b class="dot" style="background:${col}"></b>${g === 'Day' ? 'Day' : g}</span><div class="bar"><i style="width:${a}%;background:${col}"></i></div><b>${Math.round(a)}</b>${b === null ? '<em></em>' : a - b > 3 ? `<em class="up">▲ ${Math.round(a - b)}</em>` : a - b < -3 ? `<em class="down">▼ ${Math.round(b - a)}</em>` : '<em>steady</em>'}</div>`;
  }).join('');
  const rows = GROUPS.map(g => {
    const qs = REFLECTION.filter(q => q.cat === g).map(q => {
      const a = periodAvg(addDays(t, -6), t, q.id);
      return a === null ? '' : `<div class="mrow"><span>${q.label}</span><div class="bar"><i style="width:${a / 4 * 100}%"></i></div><b>${Math.round(a / 4 * 100)}</b><em></em></div>`;
    }).join('');
    return qs ? `<div class="meta" style="margin:12px 0 2px">${g}</div>${qs}` : '';
  }).join('');
  const ins = computeInsights();
  return `<div class="glass card"><div class="row"><div class="grow"><div class="meta">Wellbeing, last 7 days</div><div class="mval" style="font-size:44px;margin-top:4px">${thisW === null ? '–' : Math.round(thisW) + '%'}</div></div>
      ${delta === null ? '' : `<div class="${delta >= 0 ? 'up' : 'down'}" style="font-size:15px">${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)} pts vs last week</div>`}</div>
      ${spark(series)}<div class="meta" style="margin-top:6px">Last 14 days</div></div>
    <div class="glass card"><div class="meta" style="margin-bottom:10px">Rating per area, last 7 days (0 to 100)</div>${grow}
      <details><summary>All questions</summary>${rows}</details></div>
    <h2>What helps you <span>patterns</span></h2>
    ${ins === null ? `<div class="glass empty">Patterns unlock after 7 reflections (${dates.length} so far). Then the app compares your good and bad days with your habits.</div>`
      : ins.length ? ins.map(i => `<div class="glass card insight ${i.good === true ? 'pos' : i.good === false ? 'neg' : ''}">${i.text}</div>`).join('') + '<p class="hint">These are patterns in your own data, not proof of cause. More days make them more reliable.</p>'
      : '<div class="glass empty">No clear pattern yet. Keep logging habits and reflections, it takes a few weeks to see differences.</div>'}`;
}
function showSummary(d) {
  const r = S.reflections[d], o = rOverall(r);
  const avg = periodAvg(addDays(d, -14), addDays(d, -1));
  const ra = avg === null ? null : Math.round(avg);
  const cmp = ra === null ? 'This is your first score to compare against.' : o >= ra + 3 ? `Above your 14-day average of ${ra}%.` : o <= ra - 3 ? `Below your 14-day average of ${ra}%.` : `Right around your 14-day average of ${ra}%.`;
  const gs = GROUPS.map(g => [g, rGroup(r, g)]).filter(x => x[1] !== null);
  const cs = gs.filter(x => x[0] !== 'Day');
  const high = cs.slice().sort((a, b) => b[1] - a[1])[0], low = cs.slice().sort((a, b) => a[1] - b[1])[0];
  const ins = computeInsights();
  const tip = ins && ins.length ? ins[0].text : `Keep going: after ${Math.max(0, 7 - reflDates().length)} more reflection(s) the app shows which habits lift your mood.`;
  openSheet(`<h3>Day score</h3><div class="mval" style="font-size:64px;margin:6px 0">${o}%</div><div class="meta" style="font-size:14px">${cmp}</div>
    <div style="margin-top:14px">${gs.map(([g, v]) => { const col = g === 'Day' ? 'var(--accent)' : CATCOL[g]; return `<div class="mrow cat"><span><b class="dot" style="background:${col}"></b>${g}</span><div class="bar"><i style="width:${v}%;background:${col}"></i></div><b>${v}</b><em></em></div>`; }).join('')}</div>
    ${high && low && high[0] !== low[0] ? `<div class="facts"><div><span>Strongest area</span><b>${high[0]}</b></div><div><span>Needs attention</span><b>${low[0]}</b></div></div>` : ''}
    <div class="desc" style="margin-top:12px">${tip}</div>
    <div class="actions"><button class="btn primary" data-act="closesheet">Close</button></div>`);
}
/* ---------- stats ---------- */
function viewStats(v) {
  const t = today(), si = streakInfo();
  const last7 = Array.from({ length: 7 }, (_, i) => addDays(t, i - 6));
  const week = last7.map(d => ({ d, r: dayStats(d) }));
  const withDue = week.filter(x => x.r.due);
  const weekPct = withDue.length ? Math.round(withDue.reduce((a, x) => a + x.r.ratio, 0) / withDue.length * 100) : 0;
  const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 5 + i); return d; });
  const monthly = months.map(md => {
    const n = new Date(md.getFullYear(), md.getMonth() + 1, 0).getDate();
    let sum = 0, c = 0;
    for (let i = 1; i <= n; i++) {
      const d = `${md.getFullYear()}-${pad(md.getMonth() + 1)}-${pad(i)}`;
      if (d > t) break;
      const s = dayStats(d); if (s.due) { sum += s.ratio; c++; }
    }
    return { label: md.toLocaleDateString('en-GB', { month: 'short' }), r: c ? sum / c : 0 };
  });
  const maxW = Math.max(S.water.goal, ...last7.map(d => S.water.log[d] || 0));
  const start = addDays(weekStart(t), -52 * 7);
  let heat = '';
  for (let d = start; d <= addDays(weekStart(t), 6); d = addDays(d, 1)) {
    if (d > t) { heat += '<i style="opacity:.25"></i>'; continue; }
    const s = dayStats(d);
    const bg = !s.due ? '' : s.complete && s.done ? 'background:var(--ok)' : s.ratio > 0 ? `background:rgba(245,215,110,${(.2 + s.ratio * .8).toFixed(2)})` : s.complete ? 'background:var(--rest)' : '';
    heat += `<i style="${bg}" title="${d}"></i>`;
  }
  let cons = '';
  for (let i = 29; i >= 0; i--) {
    const d = addDays(t, -i), s2 = dayStats(d);
    const bg = !s2.due ? '' : s2.complete && s2.done ? 'background:var(--ok)' : s2.ratio > 0 ? `background:rgba(245,215,110,${(.2 + s2.ratio * .8).toFixed(2)})` : s2.complete ? 'background:var(--rest)' : '';
    cons += `<i style="${bg}"></i>`;
  }
  const bars = (arr, cls = '') => `<div class="glass"><div class="bars ${cls}">${arr.map(x => `<div><i style="height:${Math.max(3, x.h)}%"></i></div>`).join('')}</div>
    <div class="labels">${arr.map(x => `<span>${x.l}</span>`).join('')}</div></div>`;
  const refl = Object.keys(S.reflections).sort().slice(-7).map(d => {
    const r = S.reflections[d]; const m = r.mood;
    return { l: parse(d).toLocaleDateString('en-GB', { weekday: 'short' }).slice(0, 2), h: m == null ? 0 : (m + 1) * 20 };
  });
  const perHabit = S.habits.map(h => ({ h, s: habitStreak(h) })).sort((a, b) => b.s.cur - a.s.cur);
  v.innerHTML = `<h1>Stats</h1><p class="sub">Your progress at a glance.</p>
    <div class="hero"><div class="glass"><b>${weekPct}%</b><span>This week</span></div><div class="glass"><b>🔥 ${si.cur}</b><span>Streak</span></div><div class="glass"><b>${si.best}</b><span>Best streak</span></div></div>
    <h2>Insights <span>daily reflection</span></h2>${insightsHtml()}
    <h2>Last 7 days</h2>${bars(week.map(x => ({ l: DOW[dowMon(x.d)], h: x.r.ratio * 100 })))}
    <h2>Monthly completion</h2>${bars(monthly.map(x => ({ l: x.label, h: x.r * 100 })))}
    <h2>Water per day</h2>${bars(last7.map(d => ({ l: DOW[dowMon(d)], h: (S.water.log[d] || 0) / maxW * 100 })), 'blue')}
    <h2>Consistency <span>last 30 days</span></h2><div class="cons">${cons}</div>
    <h2>Habit streaks</h2>
    ${perHabit.length ? perHabit.map(({ h, s }) => `<div class="glass card row"><div class="grow"><div class="name">${esc(h.name)}</div><div class="meta"><span class="chip">${h.cat}</span>Best ${s.best}</div></div><b style="font-size:22px">🔥 ${s.cur}</b></div>`).join('') : '<div class="glass empty">Add habits to see streaks.</div>'}`;
}

/* ---------- more / settings ---------- */
function viewMore(v) {
  v.innerHTML = `<h1>More</h1><p class="sub">Settings, security and backup.</p>
    <h2>Year heat map <span>${heatCat === 'All' ? 'all categories' : heatCat}</span></h2>${heatHtml()}
    <h2>Hydration</h2>
    <div class="glass card"><label style="margin-top:0">Daily goal (ml)</label><input id="wgoal" type="number" inputmode="numeric" value="${S.water.goal}">
      <label>Quick-add amounts (ml, comma separated)</label><input id="wquick" value="${S.water.quick.join(', ')}">
      <div class="actions"><button class="btn primary" data-act="savewater">Save</button></div></div>
    <h2>Security</h2>
    <div class="glass card row"><div class="grow"><div class="name">App lock</div><div class="meta">${S.settings.pin ? '4-digit code is on' : 'Off'}</div></div>
      <button class="btn small" data-act="setpin">${S.settings.pin ? 'Change' : 'Set code'}</button>${S.settings.pin ? '<button class="btn small danger" data-act="rmpin">Remove</button>' : ''}</div>
    <h2>Backup</h2>
    <div class="glass card"><div class="meta" style="margin-bottom:12px">Your data lives only on this phone. Save a backup file regularly (Files app or iCloud Drive).</div>
      <div class="actions"><button class="btn primary" data-act="export">Export</button><button class="btn" data-act="import">Import</button></div>
      <input id="importfile" type="file" accept="application/json" style="display:none"></div>
    <h2>About</h2><div class="glass card"><div class="meta">SI app, version 9</div></div>
    <h2>Danger zone</h2>
    <div class="glass card"><button class="btn danger" data-act="wipe">Delete all data</button></div>`;
}

/* ---------- modal helpers ---------- */
function openSheet(html) {
  $('#modal-root').innerHTML = `<div class="scrim" data-act="closesheet"><div class="glass sheet">${html}</div></div>`;
}
function closeSheet() { $('#modal-root').innerHTML = ''; }
function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast glass'; el.textContent = msg;
  document.body.appendChild(el); setTimeout(() => el.remove(), 2800);
}
const segHtml = (name, opts, sel, multi) => `<div class="seg" data-seg="${name}" ${multi ? 'data-multi="1"' : ''}>${opts.map(([v, l]) => `<button type="button" data-v="${v}" class="${(multi ? sel.includes(v) : sel === v) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
document.addEventListener('click', e => {
  const b = e.target.closest('.seg[data-seg] button');
  if (!b) return;
  const seg = b.parentElement;
  if (seg.dataset.multi) b.classList.toggle('on');
  else { seg.querySelectorAll('button').forEach(x => x.classList.remove('on')); b.classList.add('on'); }
  if (seg.dataset.seg === 'type') $('#numfields').style.display = b.dataset.v === 'num' ? 'block' : 'none';
  if (seg.dataset.seg === 'gmode') $('#gnumfields').style.display = b.dataset.v === 'num' ? 'block' : 'none';
});
const segVal = n => { const b = $(`[data-seg="${n}"] button.on`); return b ? b.dataset.v : null; };
const segVals = n => [...document.querySelectorAll(`[data-seg="${n}"] button.on`)].map(b => b.dataset.v);

function habitSheet(h) {
  const nh = h || { name: '', cat: 'Physique', type: 'bool', unit: 'min', target: 30, days: null, restLimit: 0, restPer: 'week' };
  const dayList = nh.days || [0, 1, 2, 3, 4, 5, 6];
  openSheet(`<h3>${h ? 'Edit habit' : 'New habit'}</h3>
    <label>Name</label><input id="hname" value="${esc(nh.name)}" placeholder="e.g. Workout">
    <label>Category</label>${segHtml('cat', CATS.map(c => [c, c]), nh.cat)}
    <label>Type</label>${segHtml('type', [['bool', 'Yes / No'], ['num', 'Number']], nh.type)}
    <div id="numfields" style="display:${nh.type === 'num' ? 'block' : 'none'}">
      <label>Type of target</label>${segHtml('hmode', [['min', 'Reach at least'], ['max', 'Stay under']], nh.mode || 'min')}
      <label>Daily target</label><input id="htarget" type="number" inputmode="decimal" value="${nh.target}">
      <label>Unit</label>${segHtml('unit', ['kcal', 'ml', 'l', 'reps', 'min', 'h', 'km', 'g', 'kg', 'pages'].map(u => [u, u]), nh.unit)}
    </div>
    <label>Description (optional)</label><textarea id="hdesc" rows="4" placeholder="e.g. Mon: chest, Tue: legs, Wed: back ...">${esc(nh.desc || '')}</textarea>
    <label>Days</label>${segHtml('days', DOW_NAMES.map((n, i) => [i, n]), dayList.map(String), true)}
    <label>Rest days allowed (0 = none)</label><input id="hrest" type="number" inputmode="numeric" min="0" value="${nh.restLimit}">
    <label>Per</label>${segHtml('restper', [['week', 'Week'], ['month', 'Month']], nh.restPer)}
    <div class="actions">${h ? '<button class="btn danger" data-act="delhabit" data-id="' + h.id + '">Delete</button>' : ''}<button class="btn" data-act="closesheet">Cancel</button><button class="btn primary" data-act="savehabit" data-id="${h ? h.id : ''}">Save</button></div>`);
}
function goalSheet(g) {
  const ng = g || { title: '', cat: 'Physique', deadline: '', mode: 'bool', target: 10, progress: 0, unit: '' };
  openSheet(`<h3>${g ? 'Edit goal' : 'New goal'}</h3>
    <label>Goal</label><input id="gtitle" value="${esc(ng.title)}" placeholder="e.g. Post 30 videos">
    <label>Category</label>${segHtml('gcat', CATS.map(c => [c, c]), ng.cat)}
    <label>Deadline</label><input id="gdead" type="date" value="${ng.deadline || ''}">
    <label>Progress</label>${segHtml('gmode', [['bool', 'Done / not done'], ['num', 'Counted']], ng.mode)}
    <div id="gnumfields" style="display:${ng.mode === 'num' ? 'block' : 'none'}">
      <label>Target number</label><input id="gtarget" type="number" inputmode="decimal" value="${ng.target}">
      <label>Unit (optional)</label><input id="gunit" value="${esc(ng.unit || '')}" placeholder="videos, EUR, kg">
    </div>
    <div class="actions">${g ? '<button class="btn danger" data-act="delgoal" data-id="' + g.id + '">Delete</button>' : ''}<button class="btn" data-act="closesheet">Cancel</button><button class="btn primary" data-act="savegoal" data-id="${g ? g.id : ''}">Save</button></div>`);
}
let reflDraft = {}, reflStep = 0;
function reflectSheet() {
  const q = REFLECTION[reflStep];
  const cur = reflDraft[q.id];
  let body;
  if (q.type === 'emoji') body = `<div class="emoji-row">${EMOJI.map((e, i) => `<button class="${cur === i ? 'on' : ''}" data-act="ans" data-v="${i}">${e}</button>`).join('')}</div>`;
  else if (q.type === 'abc') body = `<div class="abc">${q.opts.map((o, i) => `<button class="${cur === i ? 'on' : ''}" data-act="ans" data-v="${i}"><b>${'ABC'[i]}</b>  ${o}</button>`).join('')}</div>`;
  else body = `<div class="sl"><div class="slval" id="rval">${cur == null ? 'Drag to rate' : cur}</div>
    <input type="range" id="rslider" min="0" max="10" step="1" value="${cur == null ? 5 : cur}" style="--p:${(cur == null ? 5 : cur) * 10}%" class="${cur == null ? 'untouched' : ''}">
    <div class="sllab"><span>${q.lo}</span><span>${q.hi}</span></div></div>`;
  const last = reflStep === REFLECTION.length - 1;
  openSheet(`<div class="row" style="justify-content:space-between"><span class="chip" style="background:${q.cat === 'Day' ? 'var(--accent-soft)' : 'color-mix(in srgb,' + CATCOL[q.cat] + ' 25%,transparent)'};color:${q.cat === 'Day' ? 'var(--accent)' : CATCOL[q.cat]}">${q.cat === 'Day' ? 'Your day' : q.cat}</span><span class="meta">Question ${reflStep + 1} of ${REFLECTION.length}</span></div><div class="bar" style="margin:12px 0 18px"><i style="width:${(reflStep + 1) / REFLECTION.length * 100}%"></i></div>
    <h3>${q.q}</h3>${body}
    <div class="actions"><button class="btn" data-act="${reflStep ? 'rprev' : 'closesheet'}">${reflStep ? 'Back' : 'Cancel'}</button><button class="btn primary" data-act="rnext">${last ? 'Finish' : cur != null ? 'Next' : 'Skip'}</button></div>`);
}
document.addEventListener('input', e => {
  if (e.target.id !== 'rslider') return;
  const v = parseInt(e.target.value);
  reflDraft[REFLECTION[reflStep].id] = v;
  e.target.style.setProperty('--p', v * 10 + '%'); e.target.classList.remove('untouched');
  $('#rval').textContent = v; buzz(4);
  const n = $('.actions .primary'); if (n && reflStep < REFLECTION.length - 1) n.textContent = 'Next';
});
/* ---------- celebrations ---------- */
function celebrate(msg) {
  toast(msg); tone(660, .12); setTimeout(() => tone(880, .18), 120); setTimeout(() => tone(1175, .25), 260);
  buzz([20, 40, 20]);
  const c = $('#fx'), ctx = c.getContext('2d');
  c.width = innerWidth * devicePixelRatio; c.height = innerHeight * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
  const cols = ['#f5d76e', '#4ade80', '#ffeaa0', '#ffffff'];
  const ps = Array.from({ length: 90 }, () => ({
    x: innerWidth / 2, y: innerHeight * .55, vx: (Math.random() - .5) * 9, vy: -Math.random() * 11 - 3,
    s: Math.random() * 4 + 2, c: cols[(Math.random() * cols.length) | 0], life: 1,
  }));
  (function frame() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    let alive = false;
    ps.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += .28; p.life -= .011;
      if (p.life > 0) { alive = true; ctx.globalAlpha = p.life; ctx.fillStyle = p.c; ctx.shadowColor = p.c; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 7); ctx.fill(); }
    });
    if (alive) requestAnimationFrame(frame); else ctx.clearRect(0, 0, innerWidth, innerHeight);
  })();
}
function checkMilestone() {
  const si = streakInfo();
  if (MILESTONES.includes(si.cur) && dayStats(today()).complete && S.celebrated['s' + si.cur] !== today()) {
    S.celebrated['s' + si.cur] = today(); save();
    celebrate(`🔥 ${si.cur}-day streak!`);
  } else if (dayStats(selDay).complete && dayStats(selDay).done > 0 && S.celebrated['d' + selDay] === undefined) {
    S.celebrated['d' + selDay] = 1; save();
    tone(784, .15); buzz(25);
  }
}

/* ---------- actions ---------- */
function setLog(h, d, val) {
  (S.logs[d] = S.logs[d] || {})[h.id] = Math.max(0, val);
  if (S.rests[d]) S.rests[d] = S.rests[d].filter(x => x !== h.id);
}
function numStep(h) { return h.unit === 'kcal' ? 50 : h.unit === 'ml' ? 100 : h.unit === 'min' ? 5 : h.unit === 'g' ? 10 : 1; }
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const a = el.dataset.act, id = el.dataset.id;
  const h = S.habits.find(x => x.id === id), g = S.goals.find(x => x.id === id);
  const d = tab === 'calendar' ? selDay : selDay;
  switch (a) {
    case 'toggle': setLog(h, d, isDone(h, d) ? 0 : 1); buzz(); tone(isDone(h, d) ? 740 : 520, .09); save(); render(); checkMilestone(); break;
    case 'inc': setLog(h, d, value(h, d) + numStep(h)); buzz(6); save(); render(); checkMilestone(); break;
    case 'dec': setLog(h, d, value(h, d) - numStep(h)); buzz(6); save(); render(); break;
    case 'rest': {
      const r = S.rests[d] = S.rests[d] || [];
      if (r.includes(h.id)) S.rests[d] = r.filter(x => x !== h.id);
      else if (restsUsedThisPeriod(h, d) < h.restLimit) { r.push(h.id); if (S.logs[d]) delete S.logs[d][h.id]; }
      else toast('No rest days left for this period');
      buzz(); save(); closeSheet(); render(); checkMilestone(); break;
    }
    case 'typeval':
      openSheet(`<h3>${esc(h.name)}</h3><label>Value for this day (${esc(h.unit)})</label><input id="tval" type="number" inputmode="decimal" value="${value(h, d) || ''}" placeholder="0">
        <div class="actions"><button class="btn" data-act="closesheet">Cancel</button><button class="btn primary" data-act="savetval" data-id="${h.id}">Save</button></div>`);
      setTimeout(() => { const i = $('#tval'); i && i.focus(); }, 350); break;
    case 'savetval': setLog(h, d, Math.max(0, parseFloat($('#tval').value) || 0)); save(); closeSheet(); render(); checkMilestone(); break;
    case 'heatcat': heatCat = el.dataset.c; heatInfo = ''; { const sx = $('.heatscroll').scrollLeft; render(); $('.heatscroll').scrollLeft = sx; } break;
    case 'heatday': {
      const dd = el.dataset.d, st = heatCat === 'All' ? dayStats(dd) : dayStats(dd, heatCat);
      heatInfo = `${parse(dd).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}: ` + (st.due ? `${st.done}/${st.due} done${st.rest ? ', ' + st.rest + ' rest' : ''}${st.complete ? ' ✓' : ''}` : 'no habits due');
      $('.heatinfo').textContent = heatInfo; break;
    }
    case 'more': go('more'); break;
    case 'newsrc': sourceSheet(); break;
    case 'editsrc': sourceSheet(S.income.sources.find(x => x.id === id)); break;
    case 'savesrc': {
      const name = $('#sname').value.trim();
      if (!name) { toast('Please enter a name'); break; }
      const mk = $('#smonth').value || mkey(new Date());
      const amt = Math.max(0, parseFloat($('#samount').value) || 0);
      let sr = S.income.sources.find(x => x.id === id);
      if (!sr) { sr = { id: uid(), name, recurring: true, entries: {} }; S.income.sources.push(sr); }
      sr.name = name; sr.recurring = segVal('srec') !== '0'; sr.entries[mk] = amt;
      save(); closeSheet(); render(); break;
    }
    case 'delsrc': if (confirm('Delete this income source?')) { S.income.sources = S.income.sources.filter(x => x.id !== id); save(); closeSheet(); render(); } break;
    case 'incgoal':
      openSheet(`<h3>Monthly income goal</h3><label>Goal per month (€)</label><input id="igoal" type="number" inputmode="numeric" value="${S.income.goal}">
        <div class="actions"><button class="btn" data-act="closesheet">Cancel</button><button class="btn primary" data-act="saveigoal">Save</button></div>`); break;
    case 'saveigoal': S.income.goal = Math.max(1, parseInt($('#igoal').value) || 1000); save(); closeSheet(); render(); break;
    case 'detail': detailSheet(h); break;
    case 'noop': break;
    case 'edit': closeSheet(); habitSheet(h); break;
    case 'newhabit': habitSheet(); break;
    case 'savehabit': {
      const name = $('#hname').value.trim();
      if (!name) { toast('Please enter a name'); break; }
      const type = segVal('type');
      const obj = {
        id: h ? h.id : uid(), name, cat: segVal('cat') || 'Physique', type,
        unit: segVal('unit') || 'min', mode: segVal('hmode') || 'min', target: Math.max(1, parseFloat($('#htarget').value) || 1),
        days: segVals('days').length === 7 ? null : segVals('days').map(Number),
        restLimit: Math.max(0, parseInt($('#hrest').value) || 0), restPer: segVal('restper') || 'week',
        created: h ? h.created : today(), desc: $('#hdesc').value.trim(),
      };
      if (obj.days && !obj.days.length) obj.days = null;
      if (h) Object.assign(h, obj); else S.habits.push(obj);
      save(); closeSheet(); render(); break;
    }
    case 'delhabit': if (confirm('Delete this habit and its history?')) { S.habits = S.habits.filter(x => x.id !== id); save(); closeSheet(); render(); } break;
    case 'closesheet': if (el.classList.contains('scrim') && e.target !== el) break; closeSheet(); break;
    case 'hcat': habitCat = el.dataset.c; render(); break;
    case 'gcat': goalCat = el.dataset.c; render(); break;
    case 'gotoday': selDay = today(); render(); break;
    case 'pick': selDay = el.dataset.d; render(); break;
    case 'prevm': calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1); render(); break;
    case 'nextm': calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1); render(); break;
    case 'water': {
      const ml = parseInt(el.dataset.ml), cur = S.water.log[today()] || 0;
      S.water.log[today()] = ml < 0 ? 0 : cur + ml;
      if (ml > 0 && cur < S.water.goal && cur + ml >= S.water.goal) celebrate('💧 Water goal reached!');
      buzz(); tone(480, .1); save(); render(); break;
    }
    case 'savewater': {
      const goal = parseInt($('#wgoal').value) || 2500;
      const quick = $('#wquick').value.split(',').map(x => parseInt(x)).filter(x => x > 0);
      S.water.goal = goal; S.water.quick = quick.length ? quick : [250]; save(); toast('Saved'); render(); break;
    }
    case 'newgoal': goalSheet(); break;
    case 'editgoal': goalSheet(g); break;
    case 'savegoal': {
      const title = $('#gtitle').value.trim();
      if (!title) { toast('Please enter a goal'); break; }
      const mode = segVal('gmode');
      const obj = { id: g ? g.id : uid(), title, cat: segVal('gcat') || 'Physique', deadline: $('#gdead').value || '', mode,
        target: Math.max(1, parseFloat($('#gtarget').value) || 1), unit: $('#gunit').value.trim(), progress: g ? g.progress : 0, done: g ? g.done : false, created: g ? (g.created || today()) : today() };
      if (g) Object.assign(g, obj); else S.goals.push(obj);
      save(); closeSheet(); render(); break;
    }
    case 'delgoal': if (confirm('Delete this goal?')) { S.goals = S.goals.filter(x => x.id !== id); save(); closeSheet(); render(); } break;
    case 'gdone': g.done = true; save(); render(); celebrate('🎯 Goal completed!'); break;
    case 'ginc': {
      const step = Math.max(1, Math.round(g.target / 20)); g.progress += step;
      if (g.progress >= g.target) { g.progress = g.target; g.done = true; celebrate('🎯 Goal completed!'); }
      buzz(8); save(); render(); break;
    }
    case 'gdec': g.progress = Math.max(0, g.progress - Math.max(1, Math.round(g.target / 20))); save(); render(); break;
    case 'reflect': reflDraft = Object.assign({}, S.reflections[selDay] || {}); reflStep = 0; reflectSheet(); break;
    case 'ans': reflDraft[REFLECTION[reflStep].id] = parseInt(el.dataset.v); buzz(6); tone(600, .06);
      if (reflStep < REFLECTION.length - 1) { reflStep++; setTimeout(reflectSheet, 180); } else reflectSheet(); break;
    case 'rnext':
      if (reflStep < REFLECTION.length - 1) { reflStep++; reflectSheet(); }
      else { S.reflections[selDay] = reflDraft; save(); render(); showSummary(selDay); }
      break;
    case 'rprev': reflStep--; reflectSheet(); break;
    case 'setpin': pinSetup(); break;
    case 'rmpin': if (confirm('Remove the app lock?')) { S.settings.pin = null; save(); render(); } break;
    case 'export': {
      const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob), a2 = document.createElement('a');
      a2.href = url; a2.download = `si-backup-${today()}.json`; document.body.appendChild(a2); a2.click(); a2.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000); break;
    }
    case 'import': $('#importfile').click(); break;
    case 'wipe': if (confirm('Delete ALL data? This cannot be undone.')) { localStorage.removeItem(KEY); S = defaults(); render(); toast('All data deleted'); } break;
  }
});
document.addEventListener('change', e => {
  if (e.target.id !== 'importfile' || !e.target.files[0]) return;
  const rd = new FileReader();
  rd.onload = () => {
    try { S = Object.assign(defaults(), JSON.parse(rd.result)); save(); toast('Backup restored'); render(); }
    catch (err) { toast('That file is not a valid backup'); }
  };
  rd.readAsText(e.target.files[0]);
});

/* ---------- lock ---------- */
async function hash(s) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('si:' + s));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) { return 'p:' + btoa(s); }
}
function pinPad(title, onDone) {
  let code = '';
  const root = $('#lock-root');
  const draw = () => {
    root.innerHTML = `<div class="lock"><div style="font-size:42px">🔒</div><div class="name">${title}</div>
      <div class="dots" id="dots">${[0, 1, 2, 3].map(i => `<i class="${i < code.length ? 'f' : ''}"></i>`).join('')}</div>
      <div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map(k => k === '' ? '<span></span>' : `<button data-k="${k}">${k}</button>`).join('')}</div>
      ${S.settings.pin && title.startsWith('Enter') ? '' : '<button class="btn" id="pincancel">Cancel</button>'}</div>`;
    root.querySelectorAll('[data-k]').forEach(b => b.onclick = async () => {
      buzz(6);
      const k = b.dataset.k;
      if (k === '⌫') code = code.slice(0, -1); else if (code.length < 4) code += k;
      draw();
      if (code.length === 4) {
        const ok = await onDone(code);
        if (ok === false) { code = ''; const l = $('.lock'); l.classList.add('shake'); setTimeout(draw, 400); }
      }
    });
    const c = $('#pincancel'); if (c) c.onclick = () => { root.innerHTML = ''; };
  };
  draw();
}
function pinSetup() {
  pinPad('Choose a 4-digit code', first => {
    pinPad('Repeat the code', async second => {
      if (second !== first) { toast('Codes did not match'); return false; }
      S.settings.pin = await hash(first); save(); $('#lock-root').innerHTML = ''; toast('Lock enabled'); render();
    });
  });
}
function lockIfNeeded() {
  if (!S.settings.pin) { $('#lock-root').innerHTML = ''; return; }
  pinPad('Enter your code', async c => {
    if ((await hash(c)) === S.settings.pin) { $('#lock-root').innerHTML = ''; return true; }
    buzz([30, 30, 30]); return false;
  });
}
document.addEventListener('visibilitychange', () => { if (document.hidden) { window.__hid = Date.now(); } else if (S.settings.pin && Date.now() - (window.__hid || 0) > 30000) lockIfNeeded(); });

/* ---------- boot ---------- */
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { /* offline cache optional */ });
render();
lockIfNeeded();
