/* =========================================================
   PROYECTO 28 — Split-screen touch controls
   Dynamic left joystick + right jump zone for the hidden game.
   ========================================================= */

const STYLE_ID = 'p28-touch-controls-style';
const MAX_RADIUS = 42;
const DEADZONE = 0.12;

const CSS = `
.p28-touch-controls {
  position: fixed;
  left: 0;
  right: 0;
  bottom: max(58px, env(safe-area-inset-bottom));
  height: min(31vh, 245px);
  z-index: 28;
  display: none;
  pointer-events: none;
  touch-action: none;
}
.p28-touch-controls.is-active {
  display: block;
}
.p28-touch-zone {
  position: absolute;
  top: 0;
  bottom: 0;
  pointer-events: auto;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.p28-touch-zone-left {
  left: 0;
  width: 50%;
}
.p28-touch-zone-right {
  right: 0;
  width: 50%;
}
.p28-joystick {
  position: fixed;
  left: 0;
  top: 0;
  width: 58px;
  height: 58px;
  margin: -29px 0 0 -29px;
  border: 1px solid rgba(107, 196, 187, 0.34);
  border-radius: 50%;
  background: rgba(5, 12, 20, 0.30);
  box-shadow: 0 0 18px rgba(107, 196, 187, 0.12);
  opacity: 0;
  transform: translate3d(-999px, -999px, 0) scale(0.92);
  transition: opacity 120ms ease;
  pointer-events: none;
}
.p28-joystick.is-visible {
  opacity: 0.82;
}
.p28-joystick-nub {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 18px;
  height: 18px;
  margin: -9px 0 0 -9px;
  border-radius: 50%;
  background: rgba(107, 196, 187, 0.78);
  box-shadow: 0 0 16px rgba(107, 196, 187, 0.28);
  transform: translate3d(0, 0, 0);
}
.p28-touch-jump-hint {
  position: fixed;
  right: max(18px, env(safe-area-inset-right));
  bottom: max(86px, calc(env(safe-area-inset-bottom) + 86px));
  width: 34px;
  height: 34px;
  border: 1px solid rgba(255, 200, 87, 0.38);
  border-radius: 50%;
  opacity: 0.42;
  transform: scale(1);
  pointer-events: none;
  box-shadow: 0 0 14px rgba(255, 200, 87, 0.12);
}
.p28-touch-jump-hint::before {
  content: "";
  position: absolute;
  inset: 9px;
  border-radius: 50%;
  background: rgba(255, 200, 87, 0.72);
  box-shadow: 0 0 12px rgba(255, 200, 87, 0.34);
}
.p28-touch-jump-hint.is-pulsing {
  opacity: 0.82;
  transform: scale(1.08);
  transition: opacity 90ms ease, transform 90ms ease;
}
@media (min-width: 1025px) and (pointer: fine) and (min-aspect-ratio: 1/1) {
  .p28-touch-controls {
    display: none !important;
  }
}
`;

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

function eventPoint(e) {
  return { x: e.clientX, y: e.clientY };
}

function clampVector(dx, dy) {
  const distance = Math.hypot(dx, dy);
  if (distance < 0.0001) return { x: 0, z: 0, knobX: 0, knobY: 0, active: false };
  const clamped = Math.min(distance, MAX_RADIUS);
  const nx = dx / distance;
  const ny = dy / distance;
  const rawX = (nx * clamped) / MAX_RADIUS;
  const rawZ = (ny * clamped) / MAX_RADIUS;
  const mag = Math.hypot(rawX, rawZ);
  if (mag < DEADZONE) return { x: 0, z: 0, knobX: nx * clamped, knobY: ny * clamped, active: false };
  return {
    x: rawX,
    z: rawZ,
    knobX: nx * clamped,
    knobY: ny * clamped,
    active: true,
  };
}

/**
 * @param {{onMove?:(x:number,z:number,active:boolean)=>void,onJump?:()=>void}} opts
 */
export function mountTouchControls({ onMove = null, onJump = null } = {}) {
  ensureStyle();

  const root = document.createElement('div');
  root.className = 'p28-touch-controls';
  root.setAttribute('aria-hidden', 'true');

  const leftZone = document.createElement('div');
  leftZone.className = 'p28-touch-zone p28-touch-zone-left';
  const rightZone = document.createElement('div');
  rightZone.className = 'p28-touch-zone p28-touch-zone-right';

  const joystick = document.createElement('div');
  joystick.className = 'p28-joystick';
  const nub = document.createElement('div');
  nub.className = 'p28-joystick-nub';
  joystick.appendChild(nub);

  const jumpHint = document.createElement('div');
  jumpHint.className = 'p28-touch-jump-hint';

  root.appendChild(leftZone);
  root.appendChild(rightZone);
  root.appendChild(joystick);
  root.appendChild(jumpHint);
  document.body.appendChild(root);

  let enabled = false;
  let pointerId = null;
  let anchor = { x: 0, y: 0 };
  let pulseTimer = 0;

  function emitMove(x, z, active) {
    if (onMove) onMove(x, z, active);
  }

  function setJoystickPosition(x, y) {
    joystick.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1)`;
  }

  function setNubPosition(x, y) {
    nub.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  function resetJoystick() {
    pointerId = null;
    joystick.classList.remove('is-visible');
    setNubPosition(0, 0);
    emitMove(0, 0, false);
  }

  function shouldHandle(e) {
    return enabled && (e.pointerType === 'touch' || e.pointerType === 'pen');
  }

  leftZone.addEventListener('pointerdown', (e) => {
    if (!shouldHandle(e) || pointerId !== null) return;
    pointerId = e.pointerId;
    anchor = eventPoint(e);
    try { leftZone.setPointerCapture?.(pointerId); } catch { /* Synthetic events in tests may not be capturable. */ }
    setJoystickPosition(anchor.x, anchor.y);
    setNubPosition(0, 0);
    joystick.classList.add('is-visible');
    emitMove(0, 0, false);
    e.preventDefault();
    e.stopPropagation();
  });

  leftZone.addEventListener('pointermove', (e) => {
    if (!shouldHandle(e) || e.pointerId !== pointerId) return;
    const point = eventPoint(e);
    const next = clampVector(point.x - anchor.x, point.y - anchor.y);
    setNubPosition(next.knobX, next.knobY);
    emitMove(next.x, next.z, next.active);
    e.preventDefault();
    e.stopPropagation();
  });

  function endJoystick(e) {
    if (e.pointerId !== pointerId) return;
    try { leftZone.releasePointerCapture?.(pointerId); } catch { /* Pointer capture may already be gone. */ }
    resetJoystick();
    e.preventDefault();
    e.stopPropagation();
  }

  leftZone.addEventListener('pointerup', endJoystick);
  leftZone.addEventListener('pointercancel', endJoystick);
  leftZone.addEventListener('lostpointercapture', () => resetJoystick());

  rightZone.addEventListener('pointerdown', (e) => {
    if (!shouldHandle(e)) return;
    if (onJump) onJump();
    jumpHint.classList.add('is-pulsing');
    if (pulseTimer) window.clearTimeout(pulseTimer);
    pulseTimer = window.setTimeout(() => {
      pulseTimer = 0;
      jumpHint.classList.remove('is-pulsing');
    }, 120);
    e.preventDefault();
    e.stopPropagation();
  });

  function setActive(active) {
    enabled = !!active;
    root.classList.toggle('is-active', enabled);
    root.setAttribute('aria-hidden', enabled ? 'false' : 'true');
    if (!enabled) resetJoystick();
  }

  function destroy() {
    setActive(false);
    if (pulseTimer) window.clearTimeout(pulseTimer);
    root.remove();
  }

  return { element: root, setActive, destroy };
}
