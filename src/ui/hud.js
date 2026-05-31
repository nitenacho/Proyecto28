/* =========================================================
   PROYECTO 28 — HUD
   Contadores discretos de caídas + mini-juego de esferas.
   ========================================================= */

import { hudCounterTimeline } from '../animations/timelines.js';

const STYLE_ID = 'p28-hud-style';
const HUD_CSS = `
.p28-hud {
  position: fixed;
  top: 64px;
  right: 24px;
  z-index: 30;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 3px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: var(--tr-wide);
  text-transform: uppercase;
  color: var(--ink-2);
  background: var(--bg-overlay);
  padding: 7px 9px;
  border: var(--bd-soft);
  border-radius: var(--r-sm);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  font-feature-settings: "tnum";
}
.p28-hud-head {
  display: flex;
  justify-content: flex-end;
  min-width: 118px;
  margin-bottom: 1px;
}
.p28-control-toggle {
  pointer-events: auto;
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 1px solid rgba(107, 196, 187, 0.36);
  border-radius: 50%;
  background: rgba(6, 15, 24, 0.66);
  color: var(--ink-3);
  cursor: pointer;
  box-shadow: 0 0 0 rgba(107, 196, 187, 0);
  transition: color 160ms ease, border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}
.p28-control-toggle::before {
  content: "";
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1px solid currentColor;
  box-sizing: border-box;
}
.p28-control-toggle:hover,
.p28-control-toggle:focus-visible {
  color: var(--cyan);
  border-color: rgba(107, 196, 187, 0.72);
  outline: none;
}
.p28-control-toggle.is-active {
  color: var(--warning);
  border-color: rgba(255, 200, 87, 0.72);
  box-shadow: 0 0 14px rgba(255, 200, 87, 0.22);
  transform: scale(1.04);
}
.p28-control-toggle.is-active::before {
  background: currentColor;
}
.p28-hud-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  min-width: 118px;
  line-height: 1.35;
}
.p28-hud-label {
  color: var(--ink-3);
}
.p28-hud-value {
  color: var(--cyan);
  font-weight: 600;
  display: inline-block;
  transform-origin: 50% 60%;
}
.p28-hud-value.is-idle {
  color: var(--ink-3);
}
.p28-hud-value.is-win {
  color: var(--warning);
  text-shadow: 0 0 12px rgba(255, 200, 87, 0.55);
}
.p28-hud-best {
  font-size: 9px;
  letter-spacing: 0.06em;
  opacity: 0.78;
}
@media (max-width: 1024px), (pointer: coarse), (max-aspect-ratio: 1/1) {
  .p28-hud {
    top: auto;
    bottom: 100px;
    right: 12px;
    padding: 5px 8px;
    font-size: 9px;
    letter-spacing: 0.08em;
    border-radius: 4px;
  }
  .p28-hud-head {
    min-width: 104px;
  }
  .p28-hud-row {
    min-width: 104px;
    gap: 8px;
  }
}
`;

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = HUD_CSS;
  document.head.appendChild(el);
}

function pad3(n) {
  return String(Math.max(0, Math.min(999, n | 0))).padStart(3, '0');
}

function pad2(n) {
  return String(Math.max(0, n | 0)).padStart(2, '0');
}

function formatTime(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '--:--.--';
  const totalCs = Math.floor(ms / 10);
  const minutes = Math.floor(totalCs / 6000);
  const seconds = Math.floor((totalCs % 6000) / 100);
  const centis = totalCs % 100;
  return `${pad2(minutes)}:${pad2(seconds)}.${pad2(centis)}`;
}

function makeRow(labelText, valueText, extraClass = '') {
  const row = document.createElement('div');
  row.className = `p28-hud-row ${extraClass}`.trim();
  const label = document.createElement('span');
  label.className = 'p28-hud-label';
  label.textContent = labelText;
  const value = document.createElement('span');
  value.className = 'p28-hud-value';
  value.textContent = valueText;
  row.appendChild(label);
  row.appendChild(value);
  return { row, value };
}

/**
 * @returns {{
 *   setFallCount: (n:number)=>void,
 *   setCollectibles: (current:number,total:number)=>void,
 *   setTimer: (ms:number, active?:boolean, complete?:boolean)=>void,
 *   setBestTime: (ms:number|null)=>void,
 *   setControlActive: (active:boolean)=>void,
 *   onControlToggle: (fn:()=>void)=>void,
 *   element: HTMLDivElement
 * }}
 */
export function mountHud() {
  ensureStyle();

  const root = document.createElement('div');
  root.className = 'p28-hud';
  let controlToggleHandler = null;

  const head = document.createElement('div');
  head.className = 'p28-hud-head';
  const controlButton = document.createElement('button');
  controlButton.type = 'button';
  controlButton.className = 'p28-control-toggle';
  controlButton.setAttribute('aria-label', 'Controlar luz');
  controlButton.setAttribute('aria-pressed', 'false');
  controlButton.title = 'Controlar luz';
  head.appendChild(controlButton);

  const falls = makeRow('Caidas', pad3(0));
  const spheres = makeRow('Esferas', '00/00');
  const timer = makeRow('Tiempo', formatTime(0));
  const best = makeRow('Mejor', formatTime(null), 'p28-hud-best');
  root.appendChild(head);
  root.appendChild(falls.row);
  root.appendChild(spheres.row);
  root.appendChild(timer.row);
  root.appendChild(best.row);

  document.body.appendChild(root);

  controlButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (controlToggleHandler) controlToggleHandler();
  });

  function setFallCount(n) {
    falls.value.textContent = pad3(n);
    hudCounterTimeline(falls.value);
  }

  function setCollectibles(current, total) {
    spheres.value.textContent = `${pad2(current)}/${pad2(total)}`;
    hudCounterTimeline(spheres.value);
  }

  function setTimer(ms, active = false, complete = false) {
    timer.value.textContent = formatTime(ms);
    timer.value.classList.toggle('is-idle', !active && !complete);
    timer.value.classList.toggle('is-win', !!complete);
  }

  function setBestTime(ms) {
    best.value.textContent = formatTime(ms);
  }

  function setControlActive(active) {
    controlButton.classList.toggle('is-active', !!active);
    controlButton.setAttribute('aria-pressed', active ? 'true' : 'false');
    controlButton.title = active ? 'Soltar luz' : 'Controlar luz';
    controlButton.setAttribute('aria-label', active ? 'Soltar luz' : 'Controlar luz');
  }

  function onControlToggle(fn) {
    controlToggleHandler = typeof fn === 'function' ? fn : null;
  }

  return {
    setFallCount,
    setCollectibles,
    setTimer,
    setBestTime,
    setControlActive,
    onControlToggle,
    element: root,
  };
}
