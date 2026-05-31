const STYLE_ID = 'p28-system-controls-style';

const CSS = `
.p28-system-controls {
  position: fixed;
  left: 18px;
  top: 86px;
  z-index: 45;
  display: flex;
  gap: 6px;
  pointer-events: auto;
}
.p28-system-btn {
  appearance: none;
  position: relative;
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(127, 211, 203, 0.34);
  border-radius: 50%;
  background: rgba(5, 8, 16, 0.44);
  color: rgba(185, 255, 240, 0.9);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.26), inset 0 0 0 1px rgba(255,255,255,0.04);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  font: 13px/1 var(--font-mono);
  cursor: pointer;
  opacity: 0.78;
}
.p28-system-btn:hover,
.p28-system-btn:focus-visible {
  opacity: 1;
  border-color: rgba(94, 229, 214, 0.72);
  color: #5EE5D6;
}
.p28-system-btn[disabled] {
  opacity: 0.35;
  cursor: not-allowed;
}
.p28-system-btn.is-muted::after {
  content: "";
  position: absolute;
  width: 15px;
  height: 1px;
  background: currentColor;
  transform: rotate(-42deg);
  opacity: 0.9;
}
@media (max-width: 1024px), (pointer: coarse), (max-aspect-ratio: 1/1) {
  .p28-system-controls {
    left: 10px;
    top: calc(114px + env(safe-area-inset-top));
    gap: 5px;
  }
  .p28-system-btn {
    width: 25px;
    height: 25px;
    font-size: 12px;
    background: rgba(5, 8, 16, 0.58);
  }
}
`;

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.appendChild(el);
}

function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

function fullscreenEnabled() {
  return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
}

async function requestFullscreen() {
  const target = document.documentElement;
  if (target.requestFullscreen) return target.requestFullscreen();
  if (target.webkitRequestFullscreen) return target.webkitRequestFullscreen();
  return null;
}

async function exitFullscreen() {
  if (document.exitFullscreen) return document.exitFullscreen();
  if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
  return null;
}

function makeButton({ label, title, onClick }) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'p28-system-btn';
  btn.textContent = label;
  btn.title = title;
  btn.setAttribute('aria-label', title);
  btn.addEventListener('click', (event) => {
    event.stopPropagation();
    onClick(event);
  });
  return btn;
}

export function mountSystemControls({ audio } = {}) {
  ensureStyle();

  const root = document.createElement('div');
  root.className = 'p28-system-controls';

  const fullscreen = makeButton({
    label: '⛶',
    title: 'Pantalla completa',
    onClick: async () => {
      audio?.resume?.();
      audio?.playInteraction?.('ui');
      try {
        if (isFullscreen()) await exitFullscreen();
        else await requestFullscreen();
      } catch (err) {
        console.warn('[p28 fullscreen] request failed:', err.message);
      }
    },
  });

  const mute = makeButton({
    label: '♪',
    title: 'Sonido activado',
    onClick: () => {
      audio?.resume?.();
      const muted = audio?.toggleMuted?.();
      if (!muted) audio?.playInteraction?.('ui');
    },
  });

  function updateFullscreen() {
    const active = isFullscreen();
    fullscreen.classList.toggle('is-fullscreen', active);
    fullscreen.setAttribute('aria-pressed', active ? 'true' : 'false');
    fullscreen.title = active ? 'Salir de pantalla completa' : 'Pantalla completa';
    fullscreen.setAttribute('aria-label', fullscreen.title);
  }

  function updateMute() {
    const muted = !!audio?.isMuted?.();
    mute.classList.toggle('is-muted', muted);
    mute.setAttribute('aria-pressed', muted ? 'true' : 'false');
    mute.title = muted ? 'Sonido desactivado' : 'Sonido activado';
    mute.setAttribute('aria-label', mute.title);
  }

  if (!fullscreenEnabled()) {
    fullscreen.disabled = true;
    fullscreen.title = 'Pantalla completa no disponible';
    fullscreen.setAttribute('aria-label', fullscreen.title);
  }

  document.addEventListener('fullscreenchange', updateFullscreen);
  document.addEventListener('webkitfullscreenchange', updateFullscreen);
  const unsubscribeAudio = audio?.onChange?.(updateMute) || null;

  root.appendChild(fullscreen);
  root.appendChild(mute);
  document.body.appendChild(root);
  updateFullscreen();
  updateMute();

  return {
    element: root,
    destroy() {
      document.removeEventListener('fullscreenchange', updateFullscreen);
      document.removeEventListener('webkitfullscreenchange', updateFullscreen);
      if (unsubscribeAudio) unsubscribeAudio();
      root.remove();
    },
  };
}
