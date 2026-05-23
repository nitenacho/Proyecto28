/* =========================================================
   PROYECTO 28 — Botón admin (Etapa 8 / v0.14.2 reposicionado)
   Trigger visible para abrir el panel de tweaks sin DevTools.
   v0.14.2: ahora REEMPLAZA al pill `.engine-pill` (que no tenía
   función) en la esquina superior-derecha. Estilo coherente con
   el resto del HUD (pill cyan border, fondo glass).
   ========================================================= */

const STYLE = `
  .admin-btn {
    appearance: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: rgba(5, 8, 16, 0.5);
    border: 1px solid var(--cyan-a28);
    border-radius: var(--r-pill);
    color: var(--ink-3);
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    cursor: pointer;
    transition: color .15s, border-color .15s, background .15s;
    pointer-events: auto;
  }
  .admin-btn::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--cyan);
    box-shadow: 0 0 8px var(--cyan);
  }
  .admin-btn:hover {
    color: var(--cyan-bright);
    border-color: var(--cyan-a70);
    background: rgba(5, 8, 16, 0.7);
  }
  .admin-btn[hidden] { display: none; }
`;

let styleInjected = false;
function injectStyle() {
  if (styleInjected) return;
  const s = document.createElement('style');
  s.textContent = STYLE;
  document.head.appendChild(s);
  styleInjected = true;
}

/**
 * Monta el botón "Admin". Reemplaza al `.engine-pill` si existe (preferido
 * — ocupa el lugar del pill antes-inútil "WEBGL · THREE.JS"). Si no existe,
 * fallback: appendea al `.brand` como un hijo más.
 * @param {Object} opts
 * @param {()=>void} opts.onActivate
 * @param {boolean}  [opts.visible=true]
 * @returns {{ setVisible:(v:boolean)=>void, destroy:()=>void }}
 */
export function mountAdminButton({ onActivate, visible = true }) {
  injectStyle();

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'admin-btn';
  btn.textContent = 'Admin';
  btn.setAttribute('aria-label', 'Abrir panel de administración');
  if (!visible) btn.hidden = true;
  btn.addEventListener('click', () => onActivate && onActivate());

  const enginePill = document.querySelector('.engine-pill');
  if (enginePill && enginePill.parentNode) {
    enginePill.parentNode.replaceChild(btn, enginePill);
  } else {
    const brand = document.querySelector('.brand');
    if (!brand) return { setVisible() {}, destroy() {} };
    brand.appendChild(btn);
  }

  return {
    setVisible(v) { btn.hidden = !v; },
    destroy() { btn.remove(); },
  };
}
