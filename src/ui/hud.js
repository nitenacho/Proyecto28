/* =========================================================
   PROYECTO 28 — HUD (Etapa 6)
   Contador "LUCES CAÍDAS" en esquina superior derecha.
   Estado en memoria — se resetea al recargar.
   ========================================================= */

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
  align-items: flex-end;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: var(--fs-12);
  letter-spacing: var(--tr-wide);
  text-transform: uppercase;
  color: var(--ink-2);
  background: var(--bg-overlay);
  padding: 8px 12px;
  border: var(--bd-soft);
  border-radius: var(--r-sm);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  font-feature-settings: "tnum";
}
.p28-hud-label {
  color: var(--ink-3);
}
.p28-hud-value {
  color: var(--cyan);
  font-weight: 600;
}
.p28-hud-value.p28-hud-pulse {
  animation: p28-hud-pulse 480ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
@keyframes p28-hud-pulse {
  0%   { color: var(--copper-bright); text-shadow: 0 0 12px rgba(255,138,77,0.6); }
  100% { color: var(--cyan); text-shadow: none; }
}
@media (max-width: 1024px), (pointer: coarse), (max-aspect-ratio: 1/1) {
  .p28-hud {
    top: auto;
    bottom: 100px;
    right: 12px;
    padding: 5px 8px;
    font-size: 10px;
    letter-spacing: 0.08em;
    border-radius: 4px;
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

/**
 * @returns {{ setFallCount: (n:number)=>void, element: HTMLDivElement }}
 */
export function mountHud() {
  ensureStyle();

  const root = document.createElement('div');
  root.className = 'p28-hud';

  const row = document.createElement('div');
  const label = document.createElement('span');
  label.className = 'p28-hud-label';
  label.textContent = 'Luces caídas · ';
  const value = document.createElement('span');
  value.className = 'p28-hud-value';
  value.textContent = pad3(0);
  row.appendChild(label);
  row.appendChild(value);
  root.appendChild(row);

  document.body.appendChild(root);

  let pulseTimer = 0;
  function setFallCount(n) {
    value.textContent = pad3(n);
    value.classList.remove('p28-hud-pulse');
    // force reflow para reiniciar la animación
    void value.offsetWidth;
    value.classList.add('p28-hud-pulse');
    clearTimeout(pulseTimer);
    pulseTimer = setTimeout(() => value.classList.remove('p28-hud-pulse'), 600);
  }

  return { setFallCount, element: root };
}
