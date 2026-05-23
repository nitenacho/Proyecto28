/* =========================================================
   PROYECTO 28 — main bootstrap
   Loads CMS content → builds the Three.js scene → wires the
   popup + tweaks panel + hover behaviour.
   ========================================================= */

import * as THREE from 'three';
import { loadContent } from './data/cms.js';
import { createScene } from './scene/scene.js';
import { createControllableLight } from './game/light.js';
import { createPopup } from './ui/popup.js';
import { mountTweaks } from './ui/tweaks.js';
import { mountAdminButton } from './ui/adminButton.js';
import { mountHud } from './ui/hud.js';
import { initGoogleAuth, signIn, signOut, getCurrentUser } from './auth/google.js';
import { checkWhitelist } from './auth/whitelist.js';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const canvas = document.getElementById('c');
const bootEl = document.getElementById('boot');
const coordModule = document.getElementById('coord-module');
const brandNameEl = document.getElementById('brand-name');

function applyHudVisibility({ showGrid, showScanlines, showViewfinder }) {
  const grid = document.querySelector('.scene-bg-grid');
  if (grid) grid.style.display = showGrid ? '' : 'none';
  const scan = document.querySelector('.scene-bg-scanlines');
  if (scan) scan.style.display = showScanlines ? '' : 'none';
  const vf = document.querySelector('.viewfinder');
  if (vf) vf.style.display = showViewfinder ? '' : 'none';
}

async function boot() {
  const { site, projects, grid, source } = await loadContent();
  console.log(`[p28] content source: ${source}`);

  const sceneCtx = createScene({ canvas, grid, projects });
  const defaults = site.defaults;
  const hud = mountHud();
  let activeTile = null;
  const controlLight = createControllableLight({
    scene: sceneCtx.scene,
    config: site.game,
    tiles: sceneCtx.tiles,
    gravityEnabled: defaults.gravityEnabled,
    onActiveTileChange(tile) { activeTile = tile; },
    onRespawn(n) { hud.setFallCount(n); },
  });
  const popup = createPopup();

  // Botón admin (Etapa 8) — declarado antes de mountTweaks para que el
  // onChange del panel pueda llamarlo. Se monta más abajo con tweaks.show
  // como onActivate.
  let adminButton = null;

  // Defaults para el panel: empieza con site.defaults y agrega los campos
  // de site.game / site.streaming / site.admin que el usuario puede ajustar
  // en vivo (Etapa 6 polish + Etapa 7 cierre).
  const tweakDefaults = {
    ...defaults,
    gameLightSpeed: site.game.lightSpeed,
    gameJumpHeight: site.game.jumpHeight,
    gameJumpCount: site.game.jumpCount,
    gameGravity: site.game.gravity,
    gameVelocityCurve: site.game.velocityCurve,
    gameMouseFollowDelay: site.game.mouseFollowDelay,
    gameFallDuration: site.game.fallDuration,
    gameShadowSize: site.game.shadowSize ?? 0.45,
    streamingEnabled: site.streaming.enabled,
    streamingMode: site.streaming.mode,
    adminButtonVisible: site.admin.buttonVisible,
  };

  const tweaks = mountTweaks({
    host: document.getElementById('tweaks-root'),
    defaults: tweakDefaults,
    initiallyVisible: false,           // v0.10.0: panel oculto por default
    onChange(state) {
      // Brand
      brandNameEl.textContent = state.logo;
      // Popup placement
      popup.setPlacement(state.popupPlacement);
      // HUD toggles
      applyHudVisibility(state);
      // Camera + tiles
      sceneCtx.camState.tilt  = state.tilt;
      sceneCtx.camState.yaw   = state.yaw;
      sceneCtx.camState.drift = !!state.cameraDrift;
      if (!state.cameraDrift) sceneCtx.setCameraFromState(state.tilt, state.yaw);
      sceneCtx.applyTileStyle(state.tileStyle);
      // Game — mutación in place de site.game para que controlLight (que captura
      // la referencia) use los nuevos valores en el siguiente frame.
      controlLight.setGravityEnabled(!!state.gravityEnabled);
      site.game.lightSpeed       = state.gameLightSpeed;
      site.game.jumpHeight       = state.gameJumpHeight;
      site.game.jumpCount        = state.gameJumpCount;
      site.game.gravity          = state.gameGravity;
      site.game.velocityCurve    = state.gameVelocityCurve;
      site.game.mouseFollowDelay = state.gameMouseFollowDelay;
      site.game.fallDuration     = state.gameFallDuration;
      site.game.shadowSize       = state.gameShadowSize;
      // Streaming — sólo persiste el estado (efectos en Etapa 11).
      site.streaming.enabled     = !!state.streamingEnabled;
      site.streaming.mode        = state.streamingMode;
      // Admin — mutación in place + sincroniza visibilidad del botón en vivo (Etapa 8).
      site.admin.buttonVisible   = !!state.adminButtonVisible;
      if (adminButton) adminButton.setVisible(site.admin.buttonVisible);
    },
    controls: [
      {
        label: 'Marca',
        items: [
          { type: 'radio', key: 'logo', label: 'Logo', options: site.logoOptions },
        ],
      },
      {
        label: 'Popup',
        items: [
          {
            type: 'radio', key: 'popupPlacement', label: 'Posición',
            options: [
              { value: 'side',   label: 'Lateral' },
              { value: 'cursor', label: 'Cursor'  },
              { value: 'corner', label: 'Esquina' },
            ],
          },
        ],
      },
      {
        label: 'Tiles 3D',
        items: [
          {
            type: 'select', key: 'tileStyle', label: 'Color',
            options: [
              { value: 'cyan-copper', label: 'Cyan + Copper' },
              { value: 'cyan-only',   label: 'Solo cyan' },
              { value: 'copper-only', label: 'Solo copper' },
              { value: 'mono',        label: 'Mono (outline)' },
            ],
          },
          { type: 'slider', key: 'tilt', label: 'Inclinación cámara', min: 30, max: 75, step: 1, unit: '°' },
          { type: 'slider', key: 'yaw',  label: 'Rotación cámara',    min: -60, max: 60, step: 1, unit: '°' },
          { type: 'toggle', key: 'cameraDrift', label: 'Deriva de cámara' },
        ],
      },
      {
        label: 'HUD',
        items: [
          { type: 'toggle', key: 'showGrid',       label: 'Grilla de fondo' },
          { type: 'toggle', key: 'showScanlines',  label: 'Scanlines' },
          { type: 'toggle', key: 'showViewfinder', label: 'Viewfinder' },
        ],
      },
      {
        label: 'Juego',
        items: [
          { type: 'toggle', key: 'gravityEnabled', label: 'Gravedad + saltos (WASD/↑↓←→/Pad)' },
          { type: 'slider', key: 'gameLightSpeed',       label: 'Velocidad',         min: 1,   max: 12,  step: 0.5 },
          { type: 'slider', key: 'gameJumpHeight',       label: 'Altura salto',      min: 0.5, max: 6,   step: 0.25 },
          { type: 'slider', key: 'gameJumpCount',        label: 'Saltos máximos',    min: 1,   max: 6,   step: 1 },
          { type: 'slider', key: 'gameGravity',          label: 'Gravedad',          min: 5,   max: 40,  step: 0.5 },
          {
            type: 'select', key: 'gameVelocityCurve', label: 'Curva de salto',
            options: [
              { value: 'kirby',    label: 'Kirby (decreciente)' },
              { value: 'linear',   label: 'Lineal' },
              { value: 'constant', label: 'Constante' },
            ],
          },
          { type: 'slider', key: 'gameMouseFollowDelay', label: 'Delay mouse-follow', min: 0,   max: 3,   step: 0.1, unit: 's' },
          { type: 'slider', key: 'gameFallDuration',    label: 'Duración caída',     min: 0.2, max: 3,   step: 0.1, unit: 's' },
          { type: 'slider', key: 'gameShadowSize',       label: 'Tamaño sombra',     min: 0.15, max: 1.2, step: 0.05 },
        ],
      },
      {
        label: 'Streaming',
        items: [
          { type: 'toggle', key: 'streamingEnabled', label: 'Pixel Streaming activo' },
          {
            type: 'select', key: 'streamingMode', label: 'Modo',
            options: [
              { value: 'shared',    label: 'Compartido' },
              { value: 'dedicated', label: 'Dedicado' },
            ],
          },
        ],
      },
      {
        label: 'Admin',
        items: [
          { type: 'toggle', key: 'adminButtonVisible', label: 'Botón admin visible' },
        ],
      },
    ],
  });

  // v0.13.0 (Etapa 9): Google OAuth + whitelist check.
  // Carga GIS lazy si VITE_GOOGLE_CLIENT_ID está seteado. Si no hay client
  // id (dev local sin env var), el click del botón abre el panel directo —
  // permite seguir trabajando sin auth en entorno local.
  if (GOOGLE_CLIENT_ID) {
    initGoogleAuth({ clientId: GOOGLE_CLIENT_ID }).catch((err) => {
      console.warn('[p28 auth] GIS init failed:', err.message);
    });
  }

  async function handleAdminActivate() {
    // 1) Cached user: confiamos en el cache de localStorage (validado contra
    //    exp). El owner ya pagó el costo del whitelist check la primera vez.
    if (getCurrentUser()) {
      tweaks.show();
      return;
    }
    // 2) No hay client id configurado (dev local sin env): bypass auth.
    if (!GOOGLE_CLIENT_ID) {
      console.warn('[p28 auth] VITE_GOOGLE_CLIENT_ID missing — bypass auth, opening panel.');
      tweaks.show();
      return;
    }
    // 3) Auth + whitelist check.
    try {
      const user = await signIn();
      const { allowed, role } = await checkWhitelist(user.email);
      if (!allowed) {
        signOut();
        alert(`Acceso denegado: ${user.email} no está en la whitelist.`);
        return;
      }
      console.log(`[p28 auth] signed in as ${user.email} (role: ${role || 'unknown'})`);
      tweaks.show();
    } catch (err) {
      console.warn('[p28 auth] sign-in failed:', err.message);
    }
  }

  // v0.12.0 + v0.13.0: botón "Admin" anclado bajo .brand-meta. Visibilidad
  // controlada por site.admin.buttonVisible (toggle del panel, persistido en
  // localStorage). Click dispara el flujo de auth.
  adminButton = mountAdminButton({
    onActivate: handleAdminActivate,
    visible: site.admin.buttonVisible,
  });

  // QA helper: forzar sign-out manual via DevTools.
  window.p28SignOut = () => { signOut(); console.log('[p28 auth] signed out'); };

  // v0.10.0: gate del panel por window.adminMode. Por default = false → panel
  // oculto. Asignar window.adminMode = true desde DevTools console lo muestra.
  // (Fallback de QA, persiste vigente además del botón Admin de Etapa 8.)
  let _adminMode = false;
  Object.defineProperty(window, 'adminMode', {
    configurable: true,
    get() { return _adminMode; },
    set(v) {
      _adminMode = !!v;
      if (_adminMode) tweaks.show(); else tweaks.hide();
    },
  });

  // Raycaster — hover/click on tiles
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(-10, -10);
  const pointerPx = { x: 0, y: 0 };
  let hovered = null;

  function setPointerFromEvent(e) {
    pointerPx.x = e.clientX;
    pointerPx.y = e.clientY;
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  window.addEventListener('pointermove', (e) => {
    setPointerFromEvent(e);
    controlLight.notifyMouseMoved();
    if (popup.placement === 'cursor') popup.positionAtCursor(e.clientX, e.clientY);
  });

  window.addEventListener('pointerdown', (e) => {
    setPointerFromEvent(e);
    raycaster.setFromCamera(pointer, sceneCtx.camera);
    const hits = raycaster.intersectObjects(sceneCtx.tiles, false);
    if (hits.length && hits[0].object.userData.isProject) {
      navigateTo(hits[0].object.userData.project);
    }
  });

  window.addEventListener('pointerleave', () => { pointer.x = pointer.y = -10; });

  window.addEventListener('keydown', controlLight.onKeyDown);
  window.addEventListener('keyup', controlLight.onKeyUp);

  // Route overlay (mock for relative URLs)
  const routeEl = document.getElementById('route-overlay');
  const routeLabelEl = document.getElementById('route-label');
  const routeBackEl = document.getElementById('route-back');
  function navigateTo(project) {
    if (!project.redirectURL) return;
    if (/^https?:\/\//i.test(project.redirectURL)) {
      window.open(project.redirectURL, '_blank', 'noopener');
      return;
    }
    routeLabelEl.textContent = project.redirectURL;
    routeEl.classList.add('visible');
  }
  routeBackEl.addEventListener('click', () => routeEl.classList.remove('visible'));

  // Render loop
  let lastT = performance.now();
  const tmpVec = new THREE.Vector3();

  function animate(now) {
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;
    const t = now / 1000;

    if (sceneCtx.camState.drift) {
      const tiltOff = Math.sin(t * 0.18) * 1.2;
      const yawOff  = Math.sin(t * 0.13) * 2.0;
      sceneCtx.setCameraFromState(sceneCtx.camState.tilt + tiltOff, sceneCtx.camState.yaw + yawOff);
    } else {
      sceneCtx.setCameraFromState(sceneCtx.camState.tilt, sceneCtx.camState.yaw);
    }

    raycaster.setFromCamera(pointer, sceneCtx.camera);
    controlLight.update(dt, now, raycaster);
    const hits = raycaster.intersectObjects(sceneCtx.tiles, false);
    const hit = hits.length ? hits[0].object : null;

    if (hit !== hovered) {
      hovered = hit;
      if (hit && hit.userData.isProject) {
        popup.show(hit.userData.project);
        sceneCtx.hoverModel.setHovered(hit, hit.userData.project);
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = 'default';
        sceneCtx.hoverModel.setHovered(null, null);
        popup.scheduleHide();
      }
    }

    for (const tile of sceneCtx.tiles) {
      const ud = tile.userData;
      const isLit = (tile === hovered || tile === activeTile) && ud.isProject;
      const targetY = isLit ? ud.hoverY : ud.restY;
      tile.position.y += (targetY - tile.position.y) * Math.min(dt * 8, 1);
      if (ud.isProject) {
        const breath = 0.5 + 0.5 * Math.sin(t * 1.4 + ud.breathPhase);
        const baseGlow = ud.baseEmissive * (0.85 + 0.3 * breath);
        const targetGlow = isLit ? ud.hoverEmissive : baseGlow;
        tile.material.emissiveIntensity += (targetGlow - tile.material.emissiveIntensity) * Math.min(dt * 6, 1);
      }
    }

    sceneCtx.hoverModel.update(t, hovered);

    // Tile-anchored popup placement (used when not in cursor/side/corner)
    if (hovered && hovered.userData.isProject && popup.placement === 'cursor') {
      popup.positionAtCursor(pointerPx.x, pointerPx.y);
    }

    sceneCtx.composer.render();
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  // Hide boot splash
  setTimeout(() => {
    bootEl.classList.add('gone');
    setTimeout(() => bootEl.remove(), 700);
  }, 400);
}

boot().catch((err) => {
  console.error('Boot failed', err);
  bootEl.innerHTML = `<div style="color:#ff8a4d">Error al cargar</div>
    <pre style="color:#9AB1CC;font-size:10px;text-align:left;max-width:80vw;overflow:auto">${err.stack || err.message}</pre>`;
});
