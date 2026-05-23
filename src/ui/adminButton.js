/* =========================================================
   PROYECTO 28 — Botón admin (Etapa 8)
   Trigger visible para abrir el panel de tweaks sin DevTools.
   Se ancla absoluto debajo de .brand-meta (chrome-top) y respeta
   site.admin.buttonVisible para mostrarse/ocultarse en vivo.
   ========================================================= */

const STYLE = `
  .admin-btn {
    position: absolute;
    top: calc(100% + 6px);
    left: 48px;
    appearance: none;
    border: 1px solid var(--cyan-a28);
    background: rgba(5, 8, 16, 0.5);
    color: var(--ink-3);
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    padding: 4px 10px;
    border-radius: 4px;
    cursor: pointer;
    backdrop-filter: blur(8px);
    transition: color .15s, border-color .15s, background .15s;
    pointer-events: auto;
  }
  .admin-btn:hover {
    color: #7FD3CB;
    border-color: #5EE5D6;
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
 * Monta el botón "Admin" bajo el .brand del header.
 * @param {Object} opts
 * @param {()=>void} opts.onActivate  callback cuando el usuario clickea.
 * @param {boolean}  [opts.visible=true]
 * @returns {{ setVisible:(v:boolean)=>void, destroy:()=>void }}
 */
export function mountAdminButton({ onActivate, visible = true }) {
  injectStyle();
  const brand = document.querySelector('.brand');
  if (!brand) {
    return { setVisible() {}, destroy() {} };
  }
  brand.style.position = 'relative';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'admin-btn';
  btn.textContent = 'Admin';
  btn.setAttribute('aria-label', 'Abrir panel de administración');
  if (!visible) btn.hidden = true;
  btn.addEventListener('click', () => onActivate && onActivate());
  brand.appendChild(btn);

  return {
    setVisible(v) { btn.hidden = !v; },
    destroy() { btn.remove(); },
  };
}
