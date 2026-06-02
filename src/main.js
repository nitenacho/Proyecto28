/* =========================================================
   PROYECTO 28 — main bootstrap
   Loads CMS content → builds the Three.js scene → wires the
   popup + tweaks panel + hover behaviour.
   ========================================================= */

import * as THREE from 'three';
import { loadContent } from './data/cms.js';
import { createInteractionAudio } from './audio/interactionAudio.js';
import { createScene } from './scene/scene.js';
import { createControllableLight } from './game/light.js';
import { createCollectibleSpheres } from './game/collectibles.js';
import { createLazyStreamOverlay } from './streaming/lazyStreamOverlay.js';
import { createPopup } from './ui/popup.js';
import { mountCubeA11y } from './ui/cubeA11y.js';
import { mountTweaks } from './ui/tweaks.js';
import { mountAdminButton } from './ui/adminButton.js';
import { mountHud } from './ui/hud.js';
import { mountSystemControls } from './ui/systemControls.js';
import { mountTouchControls } from './ui/touchControls.js';
import { initGoogleAuth, signIn, signOut, getCurrentUser } from './auth/google.js';
import { checkWhitelist } from './auth/whitelist.js';
import { publishTweaksSnapshot } from './admin/publish.js';
import { cubeActivateTimeline, cubeDeactivateTimeline, entranceTimeline } from './animations/timelines.js';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const canvas = document.getElementById('c');
const bootEl = document.getElementById('boot');
const coordModule = document.getElementById('coord-module');
const brandNameEl = document.getElementById('brand-name');
const brandMarkEl = document.querySelector('.brand-mark');
const BEST_TIME_KEY = 'p28-sphere-best-time-ms-v1';

function normalizeStreamingMode(mode) {
  return mode === 'per-cube' || mode === 'dedicated' ? 'per-cube' : 'shared';
}

function setBootProgress(value, label) {
  window.p28SetBootProgress?.(value, label);
}

function applyBrandLogo(logoImageURL) {
  if (!brandMarkEl) return;
  if (logoImageURL) {
    brandMarkEl.style.backgroundImage = `url(${JSON.stringify(logoImageURL)})`;
    brandMarkEl.classList.add('brand-mark-custom');
    return;
  }
  brandMarkEl.style.backgroundImage = '';
  brandMarkEl.classList.remove('brand-mark-custom');
}

function applyHudVisibility({ showGrid, showScanlines, showViewfinder }) {
  const grid = document.querySelector('.scene-bg-grid');
  if (grid) grid.style.display = showGrid ? '' : 'none';
  const scan = document.querySelector('.scene-bg-scanlines');
  if (scan) scan.style.display = showScanlines ? '' : 'none';
  const vf = document.querySelector('.viewfinder');
  if (vf) vf.style.display = showViewfinder ? '' : 'none';
}

function readBestSphereTime() {
  try {
    const value = Number(localStorage.getItem(BEST_TIME_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeBestSphereTime(ms) {
  try { localStorage.setItem(BEST_TIME_KEY, String(Math.max(0, Math.floor(ms)))); }
  catch { /* localStorage can be unavailable in private contexts. */ }
}

async function boot() {
  setBootProgress(12, 'Conectando Strapi');
  const { site, projects, grid, source } = await loadContent();
  console.log(`[p28] content source: ${source}`);
  setBootProgress(source === 'cms' ? 34 : 28, source === 'cms' ? 'Contenido Strapi listo' : 'Fallback local activo');

  setBootProgress(46, 'Preparando escena');
  const sceneCtx = await createScene({ canvas, grid, projects });
  entranceTimeline(sceneCtx.tiles);
  setBootProgress(66, 'Activando controles');
  const defaults = site.defaults;
  const { logoImageURL, ...tweakableDefaults } = defaults;
  applyBrandLogo(logoImageURL);
  const hud = mountHud();
  const interactionAudio = createInteractionAudio(site.audio);
  mountSystemControls({ audio: interactionAudio });
  const collectibles = createCollectibleSpheres({
    scene: sceneCtx.scene,
    tiles: sceneCtx.tiles,
  });
  const streamOverlay = createLazyStreamOverlay({ site, camera: sceneCtx.camera });
  let activeTile = null;
  let lightControlled = false;
  let controlLight = null;
  let touchControls = null;
  let touchControlsRequested = false;
  const sphereRun = {
    active: false,
    complete: false,
    startAt: 0,
    elapsedMs: 0,
    collected: 0,
    bestMs: readBestSphereTime(),
  };

  hud.setCollectibles(0, collectibles.total);
  hud.setTimer(0, false);
  hud.setBestTime(sphereRun.bestMs);
  hud.setControlActive(false);

  function setTouchControlsActive(active) {
    touchControlsRequested = !!active;
    if (touchControls) touchControls.setActive(touchControlsRequested && lightControlled);
    if (controlLight) {
      controlLight.setExternalMoveVector(0, 0, false);
    }
  }

  function startSphereRun(nowMs = performance.now()) {
    if (!collectibles.total) return;
    sphereRun.active = true;
    sphereRun.complete = false;
    sphereRun.startAt = nowMs;
    sphereRun.elapsedMs = 0;
    sphereRun.collected = 0;
    collectibles.reset();
    collectibles.setActive(true);
    hud.setCollectibles(0, collectibles.total);
    hud.setTimer(0, true);
  }

  function resetSphereRun() {
    sphereRun.active = false;
    sphereRun.complete = false;
    sphereRun.startAt = 0;
    sphereRun.elapsedMs = 0;
    sphereRun.collected = 0;
    collectibles.setActive(false);
    collectibles.reset();
    hud.setCollectibles(0, collectibles.total);
    hud.setTimer(0, false);
  }

  function finishSphereRun(nowMs) {
    if (sphereRun.complete) return;
    sphereRun.active = false;
    sphereRun.complete = true;
    sphereRun.elapsedMs = Math.max(0, nowMs - sphereRun.startAt);
    collectibles.setActive(false);
    hud.setCollectibles(collectibles.total, collectibles.total);
    hud.setTimer(sphereRun.elapsedMs, false, true);
    if (!sphereRun.bestMs || sphereRun.elapsedMs < sphereRun.bestMs) {
      sphereRun.bestMs = sphereRun.elapsedMs;
      writeBestSphereTime(sphereRun.bestMs);
      hud.setBestTime(sphereRun.bestMs);
    }
    interactionAudio.playInteraction('victory');
    controlLight.flashVictory();
  }

  function updateSphereRun(nowMs, timeSeconds) {
    collectibles.update(timeSeconds);
    if (!sphereRun.active) return;
    const picked = collectibles.collectNear(controlLight.mesh);
    if (picked > 0) {
      sphereRun.collected = Math.min(collectibles.total, sphereRun.collected + picked);
      hud.setCollectibles(sphereRun.collected, collectibles.total);
      interactionAudio.playInteraction('collect');
    }
    if (sphereRun.collected >= collectibles.total) {
      finishSphereRun(nowMs);
      return;
    }
    sphereRun.elapsedMs = Math.max(0, nowMs - sphereRun.startAt);
    hud.setTimer(sphereRun.elapsedMs, true);
  }

  controlLight = createControllableLight({
    scene: sceneCtx.scene,
    config: site.game,
    tiles: sceneCtx.tiles,
    gravityEnabled: defaults.gravityEnabled,
    onActiveTileChange(tile) {
      activeTile = tile;
      streamOverlay.setActiveTile(tile);
      if (tile) interactionAudio.playBlock(tile);
    },
    onRespawn(n) {
      hud.setFallCount(n);
      interactionAudio.playInteraction('fall');
      resetSphereRun();
    },
    onRespawnComplete() {
      if (lightControlled) startSphereRun();
    },
    onControlModeChange(controlled) {
      lightControlled = controlled;
      hud.setControlActive(controlled);
      if (touchControls) touchControls.setActive(touchControlsRequested && controlled);
      if (controlled) {
        interactionAudio.playInteraction('control');
        startSphereRun();
      } else {
        setTouchControlsActive(false);
        resetSphereRun();
      }
    },
  });
  touchControls = mountTouchControls({
    onMove(x, z, active) {
      if (!controlLight || !lightControlled || !touchControlsRequested) return;
      controlLight.setExternalMoveVector(x, z, active);
    },
    onJump() {
      if (!controlLight || !lightControlled || !touchControlsRequested) return;
      interactionAudio.resume();
      if (controlLight.jump()) interactionAudio.playInteraction('tap');
    },
  });
  hud.onControlToggle(() => {
    interactionAudio.resume();
    const wantsTouchControls = !controlLight.isControlActive();
    touchControlsRequested = wantsTouchControls;
    const active = controlLight.toggleControl();
    hud.setControlActive(active);
    if (!active) touchControlsRequested = false;
    if (touchControls) touchControls.setActive(active && touchControlsRequested);
  });
  const popup = createPopup({ onClose: releasePinnedPopup });

  // Botón admin (Etapa 8) — declarado antes de mountTweaks para que el
  // onChange del panel pueda llamarlo. Se monta más abajo con tweaks.show
  // como onActivate.
  let adminButton = null;

  // Defaults para el panel: empieza con site.defaults y agrega los campos
  // de site.game / site.streaming / site.admin que el usuario puede ajustar
  // en vivo (Etapa 6 polish + Etapa 7 cierre).
  const tweakDefaults = {
    ...tweakableDefaults,
    gameLightSpeed: site.game.lightSpeed,
    gameJumpHeight: site.game.jumpHeight,
    gameJumpCount: site.game.jumpCount,
    gameGravity: site.game.gravity,
    gameVelocityCurve: site.game.velocityCurve,
    gameLightColor: site.game.lightColor || 'cyan',
    gameMouseFollowDelay: site.game.mouseFollowDelay,
    gameFallDuration: site.game.fallDuration,
    gameShadowSize: site.game.shadowSize ?? 0.45,
    streamingEnabled: site.streaming.enabled,
    streamingPreviewEnabled: site.streaming.previewEnabled,
    streamingMode: normalizeStreamingMode(site.streaming.mode),
    audioEnabled: site.audio.enabled,
    audioPreset: site.audio.preset,
    audioMasterVolume: site.audio.masterVolume,
    audioHoverVolume: site.audio.hoverVolume,
    audioInteractionVolume: site.audio.interactionVolume,
    adminButtonVisible: site.admin.buttonVisible,
  };
  let publishedBaseline = { ...tweakDefaults };

  const tweaks = mountTweaks({
    host: document.getElementById('tweaks-root'),
    defaults: tweakDefaults,
    initiallyVisible: false,           // v0.10.0: panel oculto por default
    actions: [
      {
        key: 'publish',
        label: 'PUBLICAR CAMBIOS',
        busyLabel: 'PUBLICANDO...',
        async onClick({ state, setFeedback }) {
          const result = await publishTweaksSnapshot({ state, baseline: publishedBaseline });
          publishedBaseline = { ...state };
          const changedCount = Object.keys(result.changed || {}).length;
          const ignoredCount = Object.keys(result.ignored || {}).length;
          const suffix = ignoredCount ? ` (${ignoredCount} omitido${ignoredCount === 1 ? '' : 's'})` : '';
          setFeedback('success', `Publicado en Strapi: ${changedCount} cambio${changedCount === 1 ? '' : 's'}${suffix}.`);
        },
      },
    ],
    onChange(state) {
      // Brand
      if (brandNameEl) brandNameEl.textContent = state.logo;
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
      site.game.lightColor       = state.gameLightColor;
      site.game.mouseFollowDelay = state.gameMouseFollowDelay;
      site.game.fallDuration     = state.gameFallDuration;
      site.game.shadowSize       = state.gameShadowSize;
      controlLight.setLightColor(site.game.lightColor);
      // Streaming — Etapa 11: iframe sobre el cubo activo o fallback local.
      site.streaming.enabled     = !!state.streamingEnabled;
      site.streaming.previewEnabled = !!state.streamingPreviewEnabled;
      site.streaming.mode        = normalizeStreamingMode(state.streamingMode);
      streamOverlay.setStreamingConfig(site.streaming);
      // Audio interactivo — sintetizador WebAudio configurable desde Tweaks/Strapi.
      site.audio.enabled            = !!state.audioEnabled;
      site.audio.preset             = state.audioPreset;
      site.audio.masterVolume       = state.audioMasterVolume;
      site.audio.hoverVolume        = state.audioHoverVolume;
      site.audio.interactionVolume  = state.audioInteractionVolume;
      interactionAudio.setConfig(site.audio);
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
              { value: 'easeOut',  label: 'Ease out' },
              { value: 'easeInOut', label: 'Ease in-out' },
            ],
          },
          {
            type: 'select', key: 'gameLightColor', label: 'Color luz',
            options: [
              { value: 'cyan',  label: 'Gema cyan' },
              { value: 'red',   label: 'Gema rojiza' },
              { value: 'green', label: 'Gema verde' },
            ],
          },
          { type: 'slider', key: 'gameMouseFollowDelay', label: 'Delay mouse-follow', min: 0,   max: 3,   step: 0.1, unit: 's' },
          { type: 'slider', key: 'gameFallDuration',    label: 'Duración caída',     min: 0.2, max: 3,   step: 0.1, unit: 's' },
          { type: 'slider', key: 'gameShadowSize',       label: 'Tamaño sombra',     min: 0.15, max: 1.2, step: 0.05 },
        ],
      },
      {
        label: 'Audio',
        items: [
          { type: 'toggle', key: 'audioEnabled', label: 'Sonido interactivo' },
          {
            type: 'select', key: 'audioPreset', label: 'Timbre',
            options: [
              { value: 'midi',  label: 'MIDI moderno' },
              { value: 'glass', label: 'Cristal' },
              { value: 'soft',  label: 'Suave' },
            ],
          },
          { type: 'slider', key: 'audioMasterVolume',      label: 'Volumen master',   min: 0, max: 1, step: 0.01 },
          { type: 'slider', key: 'audioHoverVolume',       label: 'Volumen bloques',  min: 0, max: 1, step: 0.01 },
          { type: 'slider', key: 'audioInteractionVolume', label: 'Volumen acciones', min: 0, max: 1, step: 0.01 },
        ],
      },
      {
        label: 'Streaming',
        items: [
          { type: 'toggle', key: 'streamingEnabled', label: 'Pixel Streaming activo' },
          { type: 'toggle', key: 'streamingPreviewEnabled', label: 'Preview visible' },
          {
            type: 'select', key: 'streamingMode', label: 'Modo',
            options: [
              { value: 'shared',    label: 'Compartido' },
              { value: 'per-cube',  label: 'Por cubo' },
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
      alert(`No se pudo iniciar sesión con Google: ${err.message || 'intenta nuevamente con una cuenta permitida.'}`);
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

  if (import.meta.env.DEV) {
    window.p28StreamDebug = {
      show(projectId = '028.A', overrides = null) {
        const tile = sceneCtx.tiles.find((t) => t.userData.project?.id === projectId) || null;
        activeTile = tile;
        if (overrides) streamOverlay.setPreviewTile(tile, overrides);
        else streamOverlay.setActiveTile(tile);
        return !!tile;
      },
      hide() {
        activeTile = null;
        streamOverlay.setActiveTile(null);
      },
      setEnabled(enabled = true) {
        site.streaming.enabled = !!enabled;
        streamOverlay.setStreamingConfig(site.streaming);
      },
      setPreviewEnabled(enabled = true) {
        site.streaming.previewEnabled = !!enabled;
        streamOverlay.setStreamingConfig(site.streaming);
      },
      metrics() {
        return {
          activeProject: streamOverlay.activeProject?.id || null,
          body: document.body.scrollWidth,
          html: document.documentElement.scrollWidth,
          inner: window.innerWidth,
          visual: window.visualViewport?.width || null,
        };
      },
    };

    const previewParams = new URLSearchParams(window.location.search);
    const previewProjectId = previewParams.get('streamPreview');
    const previewStreamURL = previewParams.get('streamPreviewUrl');
    const previewLevelName = previewParams.get('streamPreviewLevel');
    if (previewProjectId) {
      requestAnimationFrame(() => {
        const overrides = previewStreamURL ? {
          unrealEnabled: true,
          unrealStreamURL: previewStreamURL,
          unrealLevelName: previewLevelName || `Preview_${previewProjectId.replace('.', '_')}`,
        } : null;
        site.streaming.previewEnabled = true;
        if (previewStreamURL) site.streaming.enabled = true;
        streamOverlay.setStreamingConfig(site.streaming);
        window.p28StreamDebug.show(previewProjectId, overrides);
      });
    }
  }

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
  let keyboardHovered = null;
  let pinnedTile = null;
  let pointerInsideViewport = false;
  let lastPointerHitAt = -Infinity;
  let hoverCandidate = null;
  let hoverCandidateSince = 0;

  const HOVER_EXIT_GRACE_MS = 180;
  const HOVER_SWITCH_GRACE_MS = 90;

  function clearHoverCandidate() {
    hoverCandidate = null;
    hoverCandidateSince = 0;
  }

  function setPointerFromEvent(e) {
    pointerInsideViewport = true;
    pointerPx.x = e.clientX;
    pointerPx.y = e.clientY;
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  function applyHoverTarget(nextHover, { force = false, immediateHide = false } = {}) {
    if (pinnedTile && nextHover !== pinnedTile) return;
    if (!force && nextHover === hovered) return;
    hovered = nextHover;
    if (hovered && hovered.userData.isProject) {
      popup.show(hovered.userData.project);
      sceneCtx.hoverModel.setHovered(hovered, hovered.userData.project);
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.cursor = 'default';
      sceneCtx.hoverModel.setHovered(null, null);
      if (immediateHide) popup.hideNow();
      else popup.scheduleHide();
    }
  }

  function resolveHoverTarget(pointerHit, nowMs) {
    if (pinnedTile) {
      clearHoverCandidate();
      return pinnedTile;
    }

    if (keyboardHovered) {
      clearHoverCandidate();
      return keyboardHovered;
    }

    const projectHit = pointerHit?.userData?.isProject ? pointerHit : null;
    if (!pointerInsideViewport) {
      clearHoverCandidate();
      return null;
    }

    if (projectHit) {
      lastPointerHitAt = nowMs;
      if (!hovered || projectHit === hovered) {
        clearHoverCandidate();
        return projectHit;
      }

      if (hoverCandidate !== projectHit) {
        hoverCandidate = projectHit;
        hoverCandidateSince = nowMs;
        return hovered;
      }

      if (nowMs - hoverCandidateSince >= HOVER_SWITCH_GRACE_MS) {
        clearHoverCandidate();
        return projectHit;
      }

      return hovered;
    }

    clearHoverCandidate();
    if (hovered?.userData?.isProject && nowMs - lastPointerHitAt < HOVER_EXIT_GRACE_MS) {
      return hovered;
    }
    return null;
  }

  function setVisualTileTarget(tile) {
    hovered = tile;
    if (tile?.userData?.isProject) {
      popup.show(tile.userData.project);
      sceneCtx.hoverModel.setHovered(tile, tile.userData.project);
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.cursor = 'default';
      sceneCtx.hoverModel.setHovered(null, null);
    }
  }

  function pinPopupToTile(tile) {
    if (!tile?.userData?.isProject) return;
    pinnedTile = tile;
    keyboardHovered = null;
    lastPointerHitAt = performance.now();
    clearHoverCandidate();
    popup.setPinned(true);
    document.documentElement.dataset.p28PinnedProject = tile.userData.project.id || '';
    controlLight.pinToTile(tile);
    setVisualTileTarget(tile);
  }

  function releasePinnedPopup() {
    if (!pinnedTile) return;
    pinnedTile = null;
    popup.setPinned(false);
    delete document.documentElement.dataset.p28PinnedProject;
    controlLight.releasePin();
    keyboardHovered = null;
    lastPointerHitAt = -Infinity;
    clearHoverCandidate();
    hovered = null;
    canvas.style.cursor = 'default';
    sceneCtx.hoverModel.setHovered(null, null);
  }

  window.addEventListener('pointermove', (e) => {
    keyboardHovered = null;
    setPointerFromEvent(e);
    if (!pinnedTile) controlLight.notifyMouseMoved();
    if (!pinnedTile && popup.placement === 'cursor') popup.positionAtCursor(e.clientX, e.clientY);
  });

  // Click/tap sobre un cubo fija el popup y ancla la luz en su centro.
  // La navegacion queda en el CTA del popup para que el detalle no parpadee
  // por hover, mouse-follow o taps fuera.
  const TAP_THRESHOLD_PX = 8;
  let downXY = { x: 0, y: 0, type: 'mouse' };

  window.addEventListener('pointerdown', (e) => {
    downXY = { x: e.clientX, y: e.clientY, type: e.pointerType || 'mouse' };
    setPointerFromEvent(e);
  });

  window.addEventListener('pointerup', (e) => {
    const dx = Math.abs(e.clientX - downXY.x);
    const dy = Math.abs(e.clientY - downXY.y);
    if (dx > TAP_THRESHOLD_PX || dy > TAP_THRESHOLD_PX) return;   // drag, no tap
    setPointerFromEvent(e);
    raycaster.setFromCamera(pointer, sceneCtx.camera);
    const hits = raycaster.intersectObjects(sceneCtx.tiles, false);
    const tile = hits.length ? hits[0].object : null;
    if (!tile || !tile.userData.isProject) {
      // Tap fuera de un cubo en mobile cierra solo popups no fijados.
      if (downXY.type === 'touch' && !pinnedTile) {
        keyboardHovered = null;
        lastPointerHitAt = -Infinity;
        clearHoverCandidate();
        applyHoverTarget(null, { force: true, immediateHide: true });
      }
      return;
    }
    interactionAudio.playInteraction('tap');
    pinPopupToTile(tile);
  });

  window.addEventListener('pointerleave', () => {
    if (pinnedTile) return;
    pointerInsideViewport = false;
    lastPointerHitAt = -Infinity;
    clearHoverCandidate();
    pointer.x = pointer.y = -10;
    applyHoverTarget(null);
  });

  window.addEventListener('keydown', controlLight.onKeyDown);
  window.addEventListener('keyup', controlLight.onKeyUp);

  // Route overlay (mock for relative URLs)
  const routeEl = document.getElementById('route-overlay');
  const routeLabelEl = document.getElementById('route-label');
  const routeBackEl = document.getElementById('route-back');

  function closeRouteOverlay() {
    routeEl.classList.remove('visible');
    routeEl.setAttribute('aria-hidden', 'true');
  }

  function openRouteOverlay(project) {
    routeLabelEl.textContent = project.redirectURL;
    routeEl.classList.add('visible');
    routeEl.setAttribute('aria-hidden', 'false');
    routeBackEl.focus({ preventScroll: true });
  }

  function focusTileForKeyboard(tile, focusPopup = false) {
    if (!tile?.userData?.isProject) return;
    if (focusPopup) {
      pinPopupToTile(tile);
      popup.focus();
      return;
    }
    keyboardHovered = tile;
    clearHoverCandidate();
    applyHoverTarget(tile, { force: true });
  }

  routeBackEl.addEventListener('click', () => {
    interactionAudio.playInteraction('ui');
    closeRouteOverlay();
  });

  mountCubeA11y({
    tiles: sceneCtx.tiles,
    onFocusTile(tile) {
      interactionAudio.playBlock(tile);
      focusTileForKeyboard(tile, false);
    },
    onOpenTile(tile) {
      interactionAudio.playInteraction('tap');
      focusTileForKeyboard(tile, true);
    },
    onClear() {
      if (pinnedTile) return;
      keyboardHovered = null;
      clearHoverCandidate();
      applyHoverTarget(null, { immediateHide: true });
    },
  });

  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (routeEl.classList.contains('visible')) {
      closeRouteOverlay();
      return;
    }
    if (pinnedTile) return;
    keyboardHovered = null;
    clearHoverCandidate();
    applyHoverTarget(null, { immediateHide: true });
  });

  function navigateTo(project) {
    if (!project.redirectURL) return;
    if (/^https?:\/\//i.test(project.redirectURL)) {
      window.open(project.redirectURL, '_blank', 'noopener');
      return;
    }
    openRouteOverlay(project);
  }

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
    updateSphereRun(now, t);
    const hits = raycaster.intersectObjects(sceneCtx.tiles, false);
    const pointerHit = hits.length ? hits[0].object : null;
    if (pointerInsideViewport && pointerHit) interactionAudio.playBlock(pointerHit);
    const hit = resolveHoverTarget(pointerHit, now);
    applyHoverTarget(hit);

    for (const tile of sceneCtx.tiles) {
      const ud = tile.userData;
      const isLit = (tile === hovered || tile === activeTile) && ud.isProject;
      if (ud.isProject && ud.isLit !== isLit) {
        ud.isLit = isLit;
        if (isLit) cubeActivateTimeline(tile);
        else cubeDeactivateTimeline(tile);
      }
      if (ud.isProject) {
        const breath = 0.5 + 0.5 * Math.sin(t * 1.4 + ud.breathPhase);
        const baseGlow = ud.baseEmissive * (0.85 + 0.3 * breath);
        if (!isLit && !ud.gsapAnimating) {
          tile.material.emissiveIntensity = baseGlow;
        }
      }
    }

    sceneCtx.hoverModel.update(t, hovered);
    streamOverlay.update(sceneCtx.camera);

    // Tile-anchored popup placement (used when not in cursor/side/corner)
    if (hovered && hovered.userData.isProject && popup.placement === 'cursor') {
      popup.positionAtCursor(pointerPx.x, pointerPx.y);
    }

    sceneCtx.composer.render();
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  // Hide boot splash
  setBootProgress(100, 'Listo');
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
