/* =========================================================
   PROYECTO 28 — Tweaks panel (vanilla port of design's React panel)
   Same look, smaller bundle, no React/Babel required.
   ========================================================= */

const PANEL_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:pointer;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}
  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}
  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}
  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:pointer}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:pointer}
  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:pointer;padding:4px 6px;line-height:1.2}
  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:pointer;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}
  .twk-actions{display:flex;flex-direction:column;gap:7px;padding-top:10px;
    border-top:.5px solid rgba(0,0,0,.1)}
  .twk-action-btn{appearance:none;width:100%;min-height:30px;border:.5px solid rgba(0,0,0,.14);
    border-radius:8px;background:rgba(41,38,27,.9);color:#fff;
    font:inherit;font-weight:650;letter-spacing:.03em;cursor:pointer}
  .twk-action-btn:hover{background:#17150f}
  .twk-action-btn:disabled{opacity:.58;cursor:progress}
  .twk-feedback{box-sizing:border-box;width:100%;border-radius:7px;padding:6px 8px;
    font-size:10.5px;line-height:1.35;color:rgba(41,38,27,.78);
    background:rgba(255,255,255,.55);border:.5px solid rgba(0,0,0,.08)}
  .twk-feedback[data-kind="success"]{color:#155b31;background:rgba(52,199,89,.12);
    border-color:rgba(52,199,89,.28)}
  .twk-feedback[data-kind="error"]{color:#7a2d16;background:rgba(255,138,77,.14);
    border-color:rgba(255,138,77,.3)}
  .twk-fab{position:fixed;right:16px;bottom:16px;z-index:2147483645;width:42px;height:42px;
    border-radius:50%;border:1px solid rgba(127,211,203,.4);background:rgba(5,8,16,.7);
    color:#7FD3CB;font-size:18px;cursor:pointer;backdrop-filter:blur(12px);
    box-shadow:0 8px 24px rgba(0,0,0,.5),0 0 16px rgba(127,211,203,.18)}
  .twk-fab:hover{border-color:#5EE5D6;color:#5EE5D6}
`;

let styleInjected = false;
function injectStyle() {
  if (styleInjected) return;
  const s = document.createElement('style');
  s.textContent = PANEL_STYLE;
  document.head.appendChild(s);
  styleInjected = true;
}

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'className') node.className = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') node.innerHTML = v;
    else if (v === false || v == null) continue;
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(children)) {
    if (c == null || c === false) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

/**
 * Mount the tweaks panel into `host` and call `onChange(state)` on every update.
 * `defaults` provides initial values + key set.
 * `controls` is an array describing the form layout — see usage in main.js.
 * `initiallyVisible` (default false): cuando false, ni panel ni FAB se muestran;
 * el panel solo aparece tras llamar show() o setear window.adminMode=true.
 * `storageKey` (default 'p28-tweaks'): si está seteado, los valores se hidratan
 * desde localStorage al montar y se escriben en cada cambio. Solo se restauran
 * claves presentes en `defaults` (ignora schema legacy).
 */
export function mountTweaks({ host, defaults, controls, actions = [], onChange, title = 'Tweaks', initiallyVisible = false, storageKey = 'p28-tweaks' }) {
  injectStyle();

  // Hidratar desde localStorage: defaults primero, luego override con valores
  // guardados, filtrando claves ajenas al schema actual (defensivo ante upgrades).
  const state = { ...defaults };
  if (storageKey) {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw);
        for (const k of Object.keys(defaults)) {
          if (Object.prototype.hasOwnProperty.call(saved, k)) state[k] = saved[k];
        }
      }
    } catch { /* localStorage no disponible o JSON inválido: usar defaults */ }
  }
  for (const control of controls.flatMap((section) => section.items || [])) {
    if (!control.options || !Object.prototype.hasOwnProperty.call(state, control.key)) continue;
    const allowed = new Set(control.options.map((option) => option.value));
    if (!allowed.has(state[control.key])) state[control.key] = defaults[control.key];
  }

  let panel = null;
  let open = !!initiallyVisible;
  let visible = !!initiallyVisible;     // controla si el panel/FAB están permitidos
  let busyAction = null;
  let feedback = null;

  function persist() {
    if (!storageKey) return;
    try { localStorage.setItem(storageKey, JSON.stringify(state)); }
    catch { /* quota o modo privado: silenciar */ }
  }

  function emit() {
    onChange({ ...state });
    persist();
    render();
  }

  function setFeedback(kind, message) {
    feedback = message ? { kind, message } : null;
    render();
  }

  async function runAction(action) {
    if (busyAction) return;
    busyAction = action.key || action.label;
    feedback = null;
    render();
    try {
      await action.onClick({
        state: { ...state },
        getState: () => ({ ...state }),
        setState(partial) {
          Object.assign(state, partial);
          emit();
        },
        setFeedback,
      });
      if (!feedback) feedback = { kind: 'success', message: 'Listo.' };
    } catch (err) {
      feedback = { kind: 'error', message: err?.message || 'No se pudo completar la acción.' };
    } finally {
      busyAction = null;
      render();
    }
  }

  function setKey(key, value) {
    state[key] = value;
    emit();
  }

  function fabClick() {
    open = true;
    render();
  }

  let fab = null;
  function ensureFab() {
    if (fab) return;
    fab = el('button', { className: 'twk-fab', title: 'Abrir Tweaks', onClick: fabClick }, '⚙');
    host.appendChild(fab);
  }

  function buildSection(section) {
    return [
      el('div', { className: 'twk-sect' }, section.label),
      ...section.items.map((c) => buildControl(c)),
    ];
  }

  function buildControl(c) {
    if (c.type === 'radio') return buildRadio(c);
    if (c.type === 'select') return buildSelect(c);
    if (c.type === 'slider') return buildSlider(c);
    if (c.type === 'toggle') return buildToggle(c);
    return el('div', {}, `Unknown control: ${c.type}`);
  }

  function buildRadio({ key, label, options }) {
    const value = state[key];
    const idx = Math.max(0, options.findIndex((o) => o.value === value));
    const n = options.length;
    const track = el('div', { className: 'twk-seg', role: 'radiogroup' }, [
      el('div', {
        className: 'twk-seg-thumb',
        style: {
          left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
          width: `calc((100% - 4px) / ${n})`,
        },
      }),
      ...options.map((o) =>
        el('button', {
          type: 'button',
          role: 'radio',
          'aria-checked': o.value === value ? 'true' : 'false',
          onClick: () => setKey(key, o.value),
        }, o.label),
      ),
    ]);
    return el('div', { className: 'twk-row' }, [
      el('div', { className: 'twk-lbl' }, [el('span', {}, label)]),
      track,
    ]);
  }

  function buildSelect({ key, label, options }) {
    const sel = el('select', {
      className: 'twk-field',
      onChange: (e) => setKey(key, e.target.value),
    }, options.map((o) => {
      const opt = el('option', { value: o.value }, o.label);
      if (o.value === state[key]) opt.selected = true;
      return opt;
    }));
    return el('div', { className: 'twk-row' }, [
      el('div', { className: 'twk-lbl' }, [el('span', {}, label)]),
      sel,
    ]);
  }

  function buildSlider({ key, label, min, max, step = 1, unit = '' }) {
    const value = state[key];
    const valSpan = el('span', { className: 'twk-val' }, `${value}${unit}`);
    const input = el('input', {
      type: 'range', className: 'twk-slider', min, max, step, value,
      onInput: (e) => {
        const v = Number(e.target.value);
        valSpan.textContent = `${v}${unit}`;
        setKey(key, v);
      },
    });
    return el('div', { className: 'twk-row' }, [
      el('div', { className: 'twk-lbl' }, [el('span', {}, label), valSpan]),
      input,
    ]);
  }

  function buildToggle({ key, label }) {
    const value = state[key];
    const btn = el('button', {
      type: 'button', className: 'twk-toggle', role: 'switch',
      'aria-checked': value ? 'true' : 'false',
      dataset: { on: value ? '1' : '0' },
      onClick: () => setKey(key, !state[key]),
    }, [el('i', {})]);
    return el('div', { className: 'twk-row twk-row-h' }, [
      el('div', { className: 'twk-lbl' }, [el('span', {}, label)]),
      btn,
    ]);
  }

  function buildActions() {
    if (!actions.length) return [];
    return [el('div', { className: 'twk-actions' }, [
      ...actions.map((action) => {
        const key = action.key || action.label;
        const busy = busyAction === key;
        return el('button', {
          type: 'button',
          className: 'twk-action-btn',
          disabled: !!busyAction,
          onClick: () => runAction(action),
        }, busy ? (action.busyLabel || 'Publicando...') : action.label);
      }),
      feedback ? el('div', { className: 'twk-feedback', dataset: { kind: feedback.kind || 'info' } }, feedback.message) : null,
    ])];
  }

  function render() {
    if (panel) { panel.remove(); panel = null; }
    if (!visible) {
      if (fab) fab.style.display = 'none';
      return;
    }
    if (!open) {
      ensureFab();
      if (fab) fab.style.display = '';
      return;
    }
    if (fab) fab.style.display = 'none';
    const body = el('div', { className: 'twk-body' }, [
      ...controls.flatMap(buildSection),
      ...buildActions(),
    ]);
    const close = el('button', { className: 'twk-x', 'aria-label': 'Cerrar tweaks', onClick: () => { open = false; render(); } }, '✕');
    const hd = el('div', { className: 'twk-hd' }, [el('b', {}, title), close]);
    panel = el('div', { className: 'twk-panel' }, [hd, body]);

    // Drag
    hd.addEventListener('mousedown', (e) => {
      if (e.target === close) return;
      const startX = e.clientX;
      const startY = e.clientY;
      const r = panel.getBoundingClientRect();
      const startRight = window.innerWidth - r.right;
      const startBottom = window.innerHeight - r.bottom;
      function move(ev) {
        const right = Math.max(8, startRight - (ev.clientX - startX));
        const bottom = Math.max(8, startBottom - (ev.clientY - startY));
        panel.style.right = right + 'px';
        panel.style.bottom = bottom + 'px';
      }
      function up() {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
      }
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
    });

    host.appendChild(panel);
  }

  render();
  // Initial emit so consumers see the starting state.
  onChange({ ...state });

  return {
    setState(partial) {
      Object.assign(state, partial);
      emit();
    },
    getState() { return { ...state }; },
    setFeedback,
    show() { visible = true; open = true; render(); },
    hide() { visible = false; render(); },
    isVisible() { return visible; },
  };
}
