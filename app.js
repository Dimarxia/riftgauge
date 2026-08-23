// app.js — RiftGauge application entry point
// Handles state, rendering, scoring, and wiring for the two picker modals.
//
// Rendering strategy (touch-first):
//   • buildPanel(i)  — full DOM build; runs only on STRUCTURAL changes
//     (legend confirm/clear, battlefield select, mode change, reset).
//   • updateScores() / updateXp(i) / prependLogEntry(i) — patch the existing
//     DOM in place for high-frequency actions. Buttons are never destroyed
//     mid-interaction, so rapid tapping on a touch screen never drops taps.

import { DOMAINS } from './data/domains.js';
import { legendById } from './data/legends.js';
import { battlefieldById } from './data/battlefields.js';
import { LegendPicker } from './legend-picker.js';
import { BattlefieldPicker } from './battlefield-picker.js';

// ── State ─────────────────────────────────────────────────────────────────
let winTarget      = 8;              // fixed by game mode; battlefields have no effect on this
let scores         = [0, 0];
let names          = ['', ''];
let legends        = [null, null];
let champions      = ['', ''];
let battlefields   = [null, null];   // cosmetic only
let flipped        = [false, false];
let logs           = [[], []];
let xp             = [0, 0];
let winnerShown    = false;
const defaultNames = ['Champion Alpha', 'Champion Beta'];

// Per-panel cached DOM refs (vpFill, pips, buttons, …); rebuilt by buildPanel().
const refs = [null, null];

const SVG_NS          = 'http://www.w3.org/2000/svg';
const RING_R          = 52;
const RING_CIRC       = 2 * Math.PI * RING_R;
const MAX_LOG_ENTRIES = 50;

const ACTION_CLASS = { hold: 'log-action-hold', conquer: 'log-action-conquer', card: 'log-action-card', remove: 'log-action-remove' };
const ACTION_VERB  = { hold: 'Held battlefield', conquer: 'Conquered', card: 'Card effect', remove: 'Removed VP' };

// ── Pickers ───────────────────────────────────────────────────────────────
const legendPicker = new LegendPicker({
  onConfirm: (playerIndex, legendId, champion) => {
    legends[playerIndex] = legendId;
    champions[playerIndex] = champion;
    renderPanels();
  },
  onClear: (playerIndex) => {
    legends[playerIndex] = null;
    champions[playerIndex] = '';
    renderPanels();
  },
});

const battlefieldPicker = new BattlefieldPicker({
  onSelect: (playerIndex, battlefieldId) => {
    battlefields[playerIndex] = battlefieldId;
    renderPanels();
  },
  onClear: (playerIndex) => {
    battlefields[playerIndex] = null;
    renderPanels();
  },
});

// ── Color helpers ─────────────────────────────────────────────────────────
function getColors(playerIndex) {
  const lid = legends[playerIndex];
  if (!lid) {
    return { a: '#12103a', b: '#1a1650', mid: '#2a2060', pip: '#4a3fa0', pip2: '#4a3fa0', ring: '#5a4fc0' };
  }
  const [, , , d1id, d2id] = legendById[lid];
  const d1 = DOMAINS[d1id], d2 = DOMAINS[d2id];
  return { a: d1.colorA, b: d2.colorA, mid: d1.colorB, b2: d2.colorB, pip: d1.pip, pip2: d2.pip, ring: d1.colorB };
}

const blendCache = new Map();
function blendColors(hex1, hex2, t) {
  const key = `${hex1}|${hex2}|${t}`;
  const hit = blendCache.get(key);
  if (hit) return hit;
  const parse = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const [r1, g1, b1] = parse(hex1);
  const [r2, g2, b2] = parse(hex2);
  const mix = (a, b) => Math.round(a + (b - a) * t).toString(16).padStart(2, '0');
  const out = `#${mix(r1, r2)}${mix(g1, g2)}${mix(b1, b2)}`;
  blendCache.set(key, out);
  return out;
}

function buildHalfBg(i) {
  const c = getColors(i);
  const bg = document.getElementById(`bg-${i}`);
  bg.style.background = legends[i]
    ? `
      radial-gradient(ellipse 110% 90% at 20% 50%, ${c.a}55 0%, transparent 55%),
      radial-gradient(ellipse 110% 90% at 80% 50%, ${c.b}55 0%, transparent 55%),
      radial-gradient(ellipse 60% 80% at 50% 50%, ${c.mid}18 0%, transparent 60%),
      linear-gradient(135deg, ${c.a}22 0%, ${c.b}22 100%)`
    : 'none';
}

function buildRingGradient(i, isDanger) {
  if (isDanger) return 'url(#vp-grad-danger)';
  const c = getColors(i);
  const uid = `vp-grad-p${i}`;
  let g = document.getElementById(uid);
  if (!g) {
    const defs = document.querySelector('svg defs');
    g = document.createElementNS(SVG_NS, 'linearGradient');
    g.setAttribute('id', uid);
    g.setAttribute('x1', '0%'); g.setAttribute('y1', '0%');
    g.setAttribute('x2', '100%'); g.setAttribute('y2', '100%');
    defs.appendChild(g);
  }
  // Only rewrite the stops when the colors actually change.
  const key = `${c.ring}|${c.pip2}`;
  if (g.dataset.key !== key) {
    g.dataset.key = key;
    g.innerHTML = `<stop offset="0%" style="stop-color:${c.ring}"/><stop offset="100%" style="stop-color:${c.pip2}"/>`;
  }
  return `url(#${uid})`;
}

// ── Structural build (rare) ───────────────────────────────────────────────
function renderPanels() {
  buildPanel(0);
  buildPanel(1);
  updateScores();
}

function buildPanel(i) {
  const half = document.getElementById(`half-${i}`);
  half.classList.toggle('flipped', flipped[i]);
  buildHalfBg(i);

  const panel = document.getElementById(`panel-${i}`);
  panel.textContent = '';

  const r = (refs[i] = { half });
  panel.append(buildLeftBlock(i, r), buildScoreColumn(i, r), buildLogPanel(i, r));

  rebuildLog(i);
  updateXp(i);
}

function buildLeftBlock(i, r) {
  const lb = document.createElement('div');
  lb.className = 'left-block';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'player-name';
  nameInput.value = names[i];
  nameInput.placeholder = defaultNames[i];
  nameInput.maxLength = 24;
  nameInput.setAttribute('aria-label', `Player ${i + 1} name`);
  nameInput.addEventListener('input', (e) => { names[i] = e.target.value; });

  const label = document.createElement('div');
  label.className = 'player-label';
  label.textContent = `Player ${i + 1}`;

  const legendBtn = document.createElement('button');
  legendBtn.type = 'button';
  legendBtn.className = 'btn-legend' + (legends[i] ? ' has-legend' : '');
  legendBtn.textContent = legends[i] ? legendById[legends[i]][1] : '⚔ Choose Legend';
  legendBtn.addEventListener('click', () => legendPicker.open(i, legends[i]));

  lb.append(nameInput, label, legendBtn);

  if (legends[i]) {
    lb.append(buildDomainBadges(legends[i]), buildChosenChampion(i));
  }

  lb.append(buildBattlefieldButton(i), buildFlipButton(i), buildXpTracker(i, r));
  return lb;
}

function buildDomainBadges(legendId) {
  const [, , , d1id, d2id] = legendById[legendId];
  const row = document.createElement('div');
  row.className = 'legend-domains';
  [d1id, d2id].forEach((did) => {
    const d = DOMAINS[did];
    const badge = document.createElement('div');
    badge.className = 'domain-badge';
    badge.textContent = d.label;
    badge.style.background = `${d.colorA}88`;
    badge.style.borderColor = `${d.colorB}99`;
    badge.style.color = d.colorB;
    row.appendChild(badge);
  });
  return row;
}

function buildChosenChampion(i) {
  const el = document.createElement('div');
  el.className = 'chosen-champion';
  el.textContent = champions[i] || '';
  return el;
}

function buildBattlefieldButton(i) {
  const bid = battlefields[i];
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-battlefield' + (bid ? ' has-battlefield' : '');
  btn.textContent = bid ? battlefieldById[bid][1] : '⛰ Choose Battlefield';
  btn.addEventListener('click', () => battlefieldPicker.open(i, bid));
  return btn;
}

function buildFlipButton(i) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-flip';
  btn.textContent = '⇅ Flip Side';
  // Flipping is just a class toggle — no rebuild needed.
  btn.addEventListener('click', () => {
    flipped[i] = !flipped[i];
    refs[i].half.classList.toggle('flipped', flipped[i]);
  });
  return btn;
}

function buildXpTracker(i, r) {
  const wrap = document.createElement('div');
  wrap.className = 'xp-tracker';

  const label = document.createElement('div');
  label.className = 'xp-label';
  label.textContent = 'XP';

  const minus = document.createElement('button');
  minus.type = 'button';
  minus.className = 'xp-btn xp-minus';
  minus.textContent = '−';
  minus.title = 'Remove XP';
  minus.setAttribute('aria-label', `Player ${i + 1}: remove XP`);
  minus.addEventListener('click', () => changeXp(i, -1));

  const value = document.createElement('div');
  value.className = 'xp-value';

  const plus = document.createElement('button');
  plus.type = 'button';
  plus.className = 'xp-btn xp-plus';
  plus.textContent = '+';
  plus.title = 'Add XP';
  plus.setAttribute('aria-label', `Player ${i + 1}: add XP`);
  plus.addEventListener('click', () => changeXp(i, 1));

  wrap.append(label, minus, value, plus);
  r.xpMinus = minus;
  r.xpValue = value;
  return wrap;
}

function buildScoreColumn(i, r) {
  const sc = document.createElement('div');
  sc.className = 'score-col';

  // VP dial
  const vd = document.createElement('div');
  vd.className = 'vp-display';

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 120 120');
  svg.classList.add('vp-svg');

  const track = document.createElementNS(SVG_NS, 'circle');
  track.setAttribute('cx', 60); track.setAttribute('cy', 60); track.setAttribute('r', RING_R);
  track.classList.add('vp-track');

  const fill = document.createElementNS(SVG_NS, 'circle');
  fill.setAttribute('cx', 60); fill.setAttribute('cy', 60); fill.setAttribute('r', RING_R);
  fill.classList.add('vp-fill');
  fill.style.strokeDasharray = RING_CIRC;

  svg.append(track, fill);
  vd.appendChild(svg);

  const inner = document.createElement('div');
  inner.className = 'vp-inner';

  const num = document.createElement('div');
  num.className = 'vp-number';
  num.setAttribute('aria-live', 'polite');

  const max = document.createElement('div');
  max.className = 'vp-max';

  inner.append(num, max);
  vd.appendChild(inner);

  // Pips (count follows winTarget; mode changes trigger a full rebuild)
  const pipRow = document.createElement('div');
  pipRow.className = 'pip-row';
  const pips = [];
  for (let p = 0; p < winTarget; p++) {
    const pip = document.createElement('div');
    pip.className = 'pip';
    pipRow.appendChild(pip);
    pips.push(pip);
  }

  // Score buttons
  const btns = document.createElement('div');
  btns.className = 'vp-btns';

  const minus = document.createElement('button');
  minus.type = 'button';
  minus.className = 'vp-btn minus';
  minus.textContent = '−';
  minus.title = 'Remove VP';
  minus.setAttribute('aria-label', `Player ${i + 1}: remove VP`);
  minus.addEventListener('click', () => changeScore(i, -1, 'remove'));

  const hold    = makeScoreButton(i, 'hold', '⚑', 'Hold', 'Score: Hold Battlefield');
  const conquer = makeScoreButton(i, 'conquer', '⚔', 'Conquer', 'Score: Conquer Battlefield');
  const card    = makeScoreButton(i, 'card', '✦', 'Card', 'Score: Card Effect');

  btns.append(minus, hold, conquer, card);
  sc.append(vd, pipRow, btns);

  Object.assign(r, {
    vpFill: fill, vpNumber: num, vpMax: max, pips,
    btnMinus: minus, btnHold: hold, btnConquer: conquer, btnCard: card,
  });
  return sc;
}

function makeScoreButton(i, action, icon, label, title) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `vp-btn ${action === 'card' ? 'card-effect' : action}`;
  btn.title = title;
  btn.setAttribute('aria-label', `Player ${i + 1} — ${title}`);

  const ic = document.createElement('span');
  ic.className = 'btn-icon';
  ic.textContent = icon;

  const lb = document.createElement('span');
  lb.className = 'btn-label';
  lb.textContent = label;

  btn.append(ic, lb);
  btn.addEventListener('click', () => changeScore(i, 1, action));
  return btn;
}

function buildLogPanel(i, r) {
  const lp = document.createElement('div');
  lp.className = 'log-panel';

  const title = document.createElement('div');
  title.className = 'log-title';
  title.textContent = 'Event Log';

  const entries = document.createElement('div');
  entries.className = 'log-entries';

  lp.append(title, entries);
  r.logEntries = entries;
  return lp;
}

// ── In-place updates (hot path — no DOM teardown) ────────────────────────
function updateScores() {
  const maxScore = Math.max(...scores);

  for (let i = 0; i < 2; i++) {
    const r = refs[i];
    if (!r) continue;

    const s = scores[i];
    const isWinning = s === maxScore && s > 0;
    const atFinal = s === winTarget - 1 && !isWinning;
    const c = getColors(i);

    r.half.classList.toggle('at-final', atFinal);

    r.vpNumber.textContent = s;
    r.vpMax.textContent = `/ ${winTarget} vp`;
    r.vpFill.style.strokeDashoffset = RING_CIRC * (1 - Math.min(s / winTarget, 1));
    r.vpFill.setAttribute('stroke', buildRingGradient(i, atFinal || s >= winTarget));

    r.pips.forEach((pip, p) => {
      const isFinal = p === winTarget - 1 && s >= winTarget;
      const isFilled = p < s;
      pip.className = 'pip' + (isFinal ? ' final' : isFilled ? ' filled' : '');
      if (isFilled && !isFinal) {
        const t = winTarget > 1 ? p / (winTarget - 1) : 0;
        const color = blendColors(c.pip, c.pip2, t);
        pip.style.background = color;
        pip.style.borderColor = color;
        pip.style.boxShadow = `0 0 5px ${color}80`;
      } else {
        pip.style.background = '';
        pip.style.borderColor = '';
        pip.style.boxShadow = '';
      }
    });

    const capped = s >= winTarget;
    r.btnMinus.disabled = s <= 0;
    r.btnHold.disabled = capped;
    r.btnConquer.disabled = capped;
    r.btnCard.disabled = capped;
  }
}

function updateXp(i) {
  const r = refs[i];
  if (!r) return;
  r.xpValue.textContent = xp[i];
  r.xpMinus.disabled = xp[i] <= 0;
}

function makeLogEntryEl(entry) {
  const el = document.createElement('div');
  el.className = 'log-entry';

  const ts = document.createElement('span');
  ts.className = 'log-ts';
  ts.textContent = entry.ts;

  const act = document.createElement('span');
  act.className = ACTION_CLASS[entry.action];
  act.textContent = ACTION_VERB[entry.action];

  const score = document.createElement('span');
  score.className = 'log-score';
  score.textContent = `${entry.score} VP`;

  el.append(ts, act, document.createTextNode(' — '), score);
  return el;
}

function prependLogEntry(i, entry) {
  const r = refs[i];
  if (!r) return;
  const empty = r.logEntries.querySelector('.log-empty');
  if (empty) empty.remove();
  r.logEntries.prepend(makeLogEntryEl(entry));
  while (r.logEntries.children.length > MAX_LOG_ENTRIES) {
    r.logEntries.lastChild.remove();
  }
}

function rebuildLog(i) {
  const r = refs[i];
  if (!r) return;
  r.logEntries.textContent = '';

  if (logs[i].length === 0) {
    const empty = document.createElement('div');
    empty.className = 'log-empty';
    empty.textContent = 'No events yet';
    r.logEntries.appendChild(empty);
    return;
  }

  const frag = document.createDocumentFragment();
  logs[i].forEach((entry) => frag.appendChild(makeLogEntryEl(entry)));
  r.logEntries.appendChild(frag);
}

// ── Score logic ───────────────────────────────────────────────────────────
function changeScore(i, delta, action) {
  const prev = scores[i];
  scores[i] = Math.max(0, Math.min(winTarget, scores[i] + delta));
  if (scores[i] === prev) return;

  const ts = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const entry = { action, score: scores[i], ts };
  logs[i].unshift(entry);
  if (logs[i].length > MAX_LOG_ENTRIES) logs[i].pop();

  prependLogEntry(i, entry);
  updateScores();

  if (scores[i] >= winTarget && !winnerShown) {
    winnerShown = true;
    const name = names[i] || defaultNames[i];
    setTimeout(() => showWinner(name, i), 300);
  }
}

// ── XP logic ──────────────────────────────────────────────────────────────
function changeXp(i, delta) {
  const prev = xp[i];
  xp[i] = Math.max(0, xp[i] + delta);
  if (xp[i] !== prev) updateXp(i);
}

// ── Win target / reset controls ──────────────────────────────────────────
function setWinTarget(v) {
  winTarget = parseInt(v, 10);
  renderPanels();
}

function resetScores() {
  scores = [0, 0];
  logs = [[], []];
  xp = [0, 0];
  winnerShown = false;
  battlefields = [null, null];
  champions = ['', ''];
  document.getElementById('winner-overlay').classList.remove('show');
  renderPanels();
}

// ── Winner overlay + particle celebration ────────────────────────────────
function showWinner(name, playerIndex) {
  document.getElementById('winner-name').textContent = name;
  document.getElementById('winner-overlay').classList.add('show');

  const c = getColors(playerIndex);
  const colors = [c.pip || '#c9a84c', c.pip2 || '#f0c94a', c.ring || '#c9a84c', '#ffffff', '#c9a84c'];
  const container = document.getElementById('particles');

  for (let i = 0; i < 70; i++) {
    setTimeout(() => {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + 'vw';
      p.style.bottom = '0';
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.width = p.style.height = (3 + Math.random() * 5) + 'px';
      p.style.animationDuration = (2.5 + Math.random() * 2.5) + 's';
      container.appendChild(p);
      setTimeout(() => p.remove(), 6000);
    }, i * 35);
  }
}

function closeWinner() {
  document.getElementById('winner-overlay').classList.remove('show');
}

// ── Global control wiring ────────────────────────────────────────────────
document.getElementById('mode-select').addEventListener('change', (e) => {
  setWinTarget(e.target.value);
});

document.getElementById('btn-reset').addEventListener('click', () => {
  resetScores();
});

// ── Background lightness toggle ─────────────────────────────────────────
const BG_LEVELS = ['', 'bg-lighter-1', 'bg-lighter-2', 'bg-lighter-3'];
const BG_STORAGE_KEY = 'riftgauge-bg-level';

function applyBgLevel(level) {
  BG_LEVELS.forEach((cls) => cls && document.body.classList.remove(cls));
  if (level) document.body.classList.add(level);
  document.getElementById('btn-lighten').classList.toggle('active', !!level);
  localStorage.setItem(BG_STORAGE_KEY, level);
}

const savedBgLevel = localStorage.getItem(BG_STORAGE_KEY) || '';
applyBgLevel(BG_LEVELS.includes(savedBgLevel) ? savedBgLevel : '');

document.getElementById('btn-lighten').addEventListener('click', () => {
  const current = BG_LEVELS.indexOf(document.body.className.split(' ').find((c) => c.startsWith('bg-lighter-')) || '');
  const next = BG_LEVELS[(Math.max(current, 0) + 1) % BG_LEVELS.length];
  applyBgLevel(next);
});

document.getElementById('winner-close-btn').addEventListener('click', () => {
  closeWinner();
});

// ── Init ──────────────────────────────────────────────────────────────────
renderPanels();
