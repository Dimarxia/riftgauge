// app.js — RiftGauge application entry point
// Handles state, rendering, scoring, and wiring for the two picker modals.

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
let winnerShown    = false;
const defaultNames = ['Champion Alpha', 'Champion Beta'];

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

function blendColors(hex1, hex2, t) {
  const parse = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const [r1, g1, b1] = parse(hex1);
  const [r2, g2, b2] = parse(hex2);
  const mix = (a, b) => Math.round(a + (b - a) * t).toString(16).padStart(2, '0');
  return `#${mix(r1, r2)}${mix(g1, g2)}${mix(b1, b2)}`;
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
    g = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    g.setAttribute('id', uid);
    g.setAttribute('x1', '0%'); g.setAttribute('y1', '0%');
    g.setAttribute('x2', '100%'); g.setAttribute('y2', '100%');
    defs.appendChild(g);
  }
  g.innerHTML = `<stop offset="0%" style="stop-color:${c.ring}"/><stop offset="100%" style="stop-color:${c.pip2}"/>`;
  return `url(#${uid})`;
}

// ── Render ────────────────────────────────────────────────────────────────
function renderPanels() {
  const maxScore = Math.max(...scores);

  for (let i = 0; i < 2; i++) {
    const s = scores[i];
    const isWinning = s === maxScore && s > 0;
    const atFinal = s === winTarget - 1 && !isWinning;

    const half = document.getElementById(`half-${i}`);
    half.className = `half ${i === 0 ? 'top' : 'bottom'}${flipped[i] ? ' flipped' : ''}${atFinal ? ' at-final' : ''}`;
    buildHalfBg(i);

    const panel = document.getElementById(`panel-${i}`);
    panel.innerHTML = '';
    const c = getColors(i);

    panel.appendChild(buildLeftBlock(i));
    panel.appendChild(buildScoreColumn(i, s, c, atFinal));
    panel.appendChild(buildLogPanel(i));
  }
}

function buildLeftBlock(i) {
  const lb = document.createElement('div');
  lb.className = 'left-block';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'player-name';
  nameInput.value = names[i];
  nameInput.placeholder = defaultNames[i];
  nameInput.maxLength = 24;
  nameInput.addEventListener('input', (e) => { names[i] = e.target.value; });
  nameInput.addEventListener('blur', () => renderPanels());

  const label = document.createElement('div');
  label.className = 'player-label';
  label.textContent = `Player ${i + 1}`;

  const legendBtn = document.createElement('button');
  legendBtn.type = 'button';
  legendBtn.className = 'btn-legend' + (legends[i] ? ' has-legend' : '');
  legendBtn.textContent = legends[i] ? legendById[legends[i]][1] : '⚔ Choose Legend';
  legendBtn.addEventListener('click', () => legendPicker.open(i, legends[i]));

  lb.appendChild(nameInput);
  lb.appendChild(label);
  lb.appendChild(legendBtn);

  if (legends[i]) {
    lb.appendChild(buildDomainBadges(legends[i]));
    lb.appendChild(buildChosenChampion(i));
  }

  lb.appendChild(buildBattlefieldButton(i));
  lb.appendChild(buildFlipButton(i));

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
  btn.addEventListener('click', () => {
    flipped[i] = !flipped[i];
    renderPanels();
  });
  return btn;
}

function buildScoreColumn(i, s, c, atFinal) {
  const sc = document.createElement('div');
  sc.className = 'score-col';

  sc.appendChild(buildVpDisplay(i, s, atFinal));
  sc.appendChild(buildPipRow(s, c));
  sc.appendChild(buildScoreButtons(i, s));

  return sc;
}

function buildVpDisplay(i, s, atFinal) {
  const vd = document.createElement('div');
  vd.className = 'vp-display';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 120 120');
  svg.classList.add('vp-svg');

  const r = 52, circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(s / winTarget, 1));

  const track = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  track.setAttribute('cx', 60); track.setAttribute('cy', 60); track.setAttribute('r', r);
  track.classList.add('vp-track');

  const fill = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  fill.setAttribute('cx', 60); fill.setAttribute('cy', 60); fill.setAttribute('r', r);
  fill.classList.add('vp-fill');
  fill.style.strokeDasharray = circ;
  fill.style.strokeDashoffset = offset;
  fill.setAttribute('stroke', buildRingGradient(i, atFinal || s >= winTarget));

  svg.appendChild(track);
  svg.appendChild(fill);
  vd.appendChild(svg);

  const inner = document.createElement('div');
  inner.className = 'vp-inner';

  const num = document.createElement('div');
  num.className = 'vp-number';
  num.textContent = s;

  const max = document.createElement('div');
  max.className = 'vp-max';
  max.textContent = `/ ${winTarget} vp`;

  inner.appendChild(num);
  inner.appendChild(max);
  vd.appendChild(inner);

  return vd;
}

function buildPipRow(s, c) {
  const row = document.createElement('div');
  row.className = 'pip-row';

  for (let p = 0; p < winTarget; p++) {
    const pip = document.createElement('div');
    const isFinal = p === winTarget - 1 && s >= winTarget;
    const isFilled = p < s;
    pip.className = 'pip' + (isFinal ? ' final' : isFilled ? ' filled' : '');

    if (isFilled && !isFinal) {
      const t = winTarget > 1 ? p / (winTarget - 1) : 0;
      const color = blendColors(c.pip, c.pip2, t);
      pip.style.background = color;
      pip.style.borderColor = color;
      pip.style.boxShadow = `0 0 5px ${color}80`;
    }
    row.appendChild(pip);
  }

  return row;
}

function buildScoreButtons(i, s) {
  const wrap = document.createElement('div');
  wrap.className = 'vp-btns';

  const minus = document.createElement('button');
  minus.type = 'button';
  minus.className = 'vp-btn minus';
  minus.textContent = '−';
  minus.title = 'Remove VP';
  minus.disabled = s <= 0;
  minus.addEventListener('click', () => changeScore(i, -1, 'remove'));

  const hold = document.createElement('button');
  hold.type = 'button';
  hold.className = 'vp-btn hold';
  hold.disabled = s >= winTarget;
  hold.title = 'Score: Hold Battlefield';
  hold.innerHTML = '<span class="btn-icon">⚑</span><span class="btn-label">Hold</span>';
  hold.addEventListener('click', () => changeScore(i, 1, 'hold'));

  const conquer = document.createElement('button');
  conquer.type = 'button';
  conquer.className = 'vp-btn conquer';
  conquer.disabled = s >= winTarget;
  conquer.title = 'Score: Conquer Battlefield';
  conquer.innerHTML = '<span class="btn-icon">⚔</span><span class="btn-label">Conquer</span>';
  conquer.addEventListener('click', () => changeScore(i, 1, 'conquer'));

  const cardEffect = document.createElement('button');
  cardEffect.type = 'button';
  cardEffect.className = 'vp-btn card-effect';
  cardEffect.disabled = s >= winTarget;
  cardEffect.title = 'Score: Card Effect';
  cardEffect.innerHTML = '<span class="btn-icon">✦</span><span class="btn-label">Card</span>';
  cardEffect.addEventListener('click', () => changeScore(i, 1, 'card'));

  wrap.appendChild(minus);
  wrap.appendChild(hold);
  wrap.appendChild(conquer);
  wrap.appendChild(cardEffect);

  return wrap;
}

function buildLogPanel(i) {
  const lp = document.createElement('div');
  lp.className = 'log-panel';

  const title = document.createElement('div');
  title.className = 'log-title';
  title.textContent = 'Event Log';

  const entries = document.createElement('div');
  entries.className = 'log-entries';

  if (logs[i].length === 0) {
    const empty = document.createElement('div');
    empty.className = 'log-empty';
    empty.textContent = 'No events yet';
    entries.appendChild(empty);
  } else {
    const ACTION_CLASS = { hold: 'log-action-hold', conquer: 'log-action-conquer', card: 'log-action-card', remove: 'log-action-remove' };
    const ACTION_VERB  = { hold: 'Held battlefield', conquer: 'Conquered', card: 'Card effect', remove: 'Removed VP' };

    logs[i].forEach((entry) => {
      const el = document.createElement('div');
      el.className = 'log-entry';
      el.innerHTML = `
        <span class="log-ts">${entry.ts}</span>
        <span class="${ACTION_CLASS[entry.action]}">${ACTION_VERB[entry.action]}</span>
        — <span class="log-score">${entry.score} VP</span>
      `;
      entries.appendChild(el);
    });
  }

  lp.appendChild(title);
  lp.appendChild(entries);
  return lp;
}

// ── Score logic ───────────────────────────────────────────────────────────
function changeScore(i, delta, action) {
  const prev = scores[i];
  scores[i] = Math.max(0, Math.min(winTarget, scores[i] + delta));
  if (scores[i] === prev) return;

  const ts = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  logs[i].unshift({ action, score: scores[i], ts });
  if (logs[i].length > 50) logs[i].pop();

  renderPanels();

  if (scores[i] >= winTarget && !winnerShown) {
    winnerShown = true;
    const name = names[i] || defaultNames[i];
    setTimeout(() => showWinner(name, i), 300);
  }
}

// ── Win target / reset controls ──────────────────────────────────────────
function setWinTarget(v) {
  winTarget = parseInt(v, 10);
  renderPanels();
}

function resetScores() {
  scores = [0, 0];
  logs = [[], []];
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

document.getElementById('winner-close-btn').addEventListener('click', () => {
  closeWinner();
});

// ── Initial render ────────────────────────────────────────────────────────
renderPanels();
