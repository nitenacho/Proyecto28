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
import { createFloorSystem } from './game/floors.js';
import { createLightProjectiles } from './game/projectiles.js';
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
  let sphereRun = null;
  let controlLight = null;
  let lightProjectiles = null;
  let activeFloorTiles = [...sceneCtx.tiles];
  let activeCollisionObjects = [...sceneCtx.tiles];
  function chooseRespawnTile(tiles) {
    if (!tiles.length) return sceneCtx.tiles[0] || null;
    return [...tiles].sort((a, b) => {
      const da = a.position.x * a.position.x + a.position.z * a.position.z;
      const db = b.position.x * b.position.x + b.position.z * b.position.z;
      return da - db;
    })[0];
  }
  function syncActiveFloor(activeTiles = activeFloorTiles, collisionObjects = activeCollisionObjects) {
    activeFloorTiles = activeTiles;
    activeCollisionObjects = collisionObjects;
    collectibles.setActiveTiles(activeFloorTiles);
    if (controlLight) {
      controlLight.setCollisionObjects(activeCollisionObjects);
      controlLight.setRespawnTile(chooseRespawnTile(activeFloorTiles));
    }
    if (sphereRun) refreshSphereGoal();
  }
  const floorSystem = createFloorSystem({
    scene: sceneCtx.scene,
    tiles: sceneCtx.tiles,
    config: site.game,
    onActiveTilesChange(activeTiles, collisionObjects) {
      syncActiveFloor(activeTiles, collisionObjects);
    },
  });
  const streamOverlay = createLazyStreamOverlay({ site, camera: sceneCtx.camera });
  let activeTile = null;
  let lightControlled = false;
  let touchControls = null;
  let touchControlsRequested = false;
  sphereRun = {
    active: false,
    complete: false,
    startAt: 0,
    elapsedMs: 0,
    collected: 0,
    goal: floorSystem.getSphereGoal(collectibles.total),
    floorLevel: 0,
    ascending: false,
    awaitingStair: false,
    bestMs: readBestSphereTime(),
  };

  hud.setFloorLevel(sphereRun.floorLevel);
  hud.setCollectibles(0, sphereRun.goal);
  hud.setTimer(0, false);
  hud.setBestTime(sphereRun.bestMs);
  hud.setControlActive(false);

  function refreshSphereGoal() {
    sphereRun.goal = floorSystem.getSphereGoal(collectibles.total);
    document.documentElement.dataset.p28FloorSphereGoal = String(sphereRun.goal);
    hud.setCollectibles(Math.min(sphereRun.collected, sphereRun.goal), sphereRun.goal);
  }

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
    sphereRun.ascending = false;
    sphereRun.awaitingStair = false;
    sphereRun.startAt = nowMs;
    sphereRun.elapsedMs = 0;
    sphereRun.collected = 0;
    refreshSphereGoal();
    collectibles.reset();
    collectibles.setActive(true);
    hud.setCollectibles(0, sphereRun.goal);
    hud.setTimer(0, true);
  }

  function resetSphereRun() {
    sphereRun.active = false;
    sphereRun.complete = false;
    sphereRun.ascending = false;
    sphereRun.awaitingStair = false;
    sphereRun.startAt = 0;
    sphereRun.elapsedMs = 0;
    sphereRun.collected = 0;
    refreshSphereGoal();
    floorSystem.cancelStaircase();
    collectibles.setActive(false);
    collectibles.reset();
    if (lightProjectiles) lightProjectiles.clear();
    hud.setCollectibles(0, sphereRun.goal);
    hud.setTimer(0, false);
  }

  function revealStaircase() {
    if (sphereRun.awaitingStair || sphereRun.ascending) return;
    sphereRun.active = false;
    sphereRun.awaitingStair = true;
    collectibles.setActive(false);
    floorSystem.prepareStaircase(sphereRun.floorLevel + 1);
    syncActiveFloor(floorSystem.activeTiles, floorSystem.collisionObjects);
    document.documentElement.dataset.p28FloorAwaitingStair = 'true';
  }

  function beginFloorAscension(nowMs) {
    if (sphereRun.complete || sphereRun.ascending) return;
    sphereRun.active = false;
    sphereRun.complete = true;
    sphereRun.ascending = true;
    sphereRun.awaitingStair = false;
    sphereRun.elapsedMs = Math.max(0, nowMs - sphereRun.startAt);
    collectibles.setActive(false);
    hud.setCollectibles(sphereRun.goal, sphereRun.goal);
    hud.setTimer(sphereRun.elapsedMs, false, true);
    if (!sphereRun.bestMs || sphereRun.elapsedMs < sphereRun.bestMs) {
      sphereRun.bestMs = sphereRun.elapsedMs;
      writeBestSphereTime(sphereRun.bestMs);
      hud.setBestTime(sphereRun.bestMs);
    }
    interactionAudio.playInteraction('victory');
    controlLight.flashVictory();
    delete document.documentElement.dataset.p28FloorAwaitingStair;
    floorSystem.startAscension(sphereRun.floorLevel + 1);
  }

  function completeFloorAscension(level, nowMs = performance.now()) {
    sphereRun.floorLevel = level;
    sphereRun.complete = false;
    sphereRun.ascending = false;
    sphereRun.awaitingStair = false;
    hud.setFloorLevel(level);
    document.documentElement.dataset.p28FloorLevel = String(level);
    if (lightControlled) startSphereRun(nowMs);
    else resetSphereRun();
  }

  function collectFromProjectile(point, radius) {
    if (!sphereRun?.active || sphereRun.awaitingStair || sphereRun.ascending) return 0;
    const picked = collectibles.collectNearPoint(point, radius);
    if (picked > 0) {
      sphereRun.collected = Math.min(sphereRun.goal, sphereRun.collected + picked);
      hud.setCollectibles(sphereRun.collected, sphereRun.goal);
      interactionAudio.playInteraction('collect');
      if (sphereRun.collected >= sphereRun.goal) revealStaircase();
    }
    return picked;
  }

  function updateSphereRun(nowMs, timeSeconds) {
    collectibles.update(timeSeconds);
    if (sphereRun.awaitingStair) {
      sphereRun.elapsedMs = Math.max(0, nowMs - sphereRun.startAt);
      hud.setTimer(sphereRun.elapsedMs, true);
      if (floorSystem.hasReachedStair(controlLight.mesh)) {
        beginFloorAscension(nowMs);
      }
      return;
    }
    if (!sphereRun.active) return;
    const picked = collectibles.collectNear(controlLight.mesh);
    if (picked > 0) {
      sphereRun.collected = Math.min(sphereRun.goal, sphereRun.collected + picked);
      hud.setCollectibles(sphereRun.collected, sphereRun.goal);
      interactionAudio.playInteraction('collect');
    }
    if (sphereRun.collected >= sphereRun.goal) {
      revealStaircase();
      return;
    }
    sphereRun.elapsedMs = Math.max(0, nowMs - sphereRun.startAt);
    hud.setTimer(sphereRun.elapsedMs, true);
  }

  lightProjectiles = createLightProjectiles({
    scene: sceneCtx.scene,
    config: site.game,
    onCollect: collectFromProjectile,
  });

  controlLight = createControllableLight({
    scene: sceneCtx.scene,
    config: site.game,
    tiles: activeCollisionObjects,
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
    onShoot({ position, direction, source }) {
      if (!lightControlled && source !== 'gamepad') return;
      const fired = lightProjectiles.fire({ position, direction, nowMs: performance.now() });
      if (fired > 0) interactionAudio.playInteraction('tap');
    },
  });
  syncActiveFloor(floorSystem.activeTiles, floorSystem.collisionObjects);
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
    gameTileCaptureRadius: site.game.tileCaptureRadius ?? 1.15,
    gameAscendSphereGoal: site.game.ascendSphereGoal ?? 6,
    gameFloorHeight: site.game.floorHeight ?? 4.2,
    gameGhostFloors: site.game.ghostFloors ?? 3,
    gameStairWidth: site.game.stairWidth ?? 1.35,
    gameStairTriggerRadius: site.game.stairTriggerRadius ?? 0.95,
    gameProjectileMax: site.game.projectileMax ?? 260,
    gameProjectileBurst: site.game.projectileBurst ?? 3,
    gameProjectileSpeed: site.game.projectileSpeed ?? 8.5,
    gameProjectileLifetime: site.game.projectileLifetime ?? 1.15,
    gameProjectileCooldown: site.game.projectileCooldown ?? 0.055,
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
      site.game.tileCaptureRadius = state.gameTileCaptureRadius;
      site.game.ascendSphereGoal = state.gameAscendSphereGoal;
      site.game.floorHeight = state.gameFloorHeight;
      site.game.ghostFloors = state.gameGhostFloors;
      site.game.stairWidth = state.gameStairWidth;
      site.game.stairTriggerRadius = state.gameStairTriggerRadius;
      site.game.projectileMax = state.gameProjectileMax;
      site.game.projectileBurst = state.gameProjectileBurst;
      site.game.projectileSpeed = state.gameProjectileSpeed;
      site.game.projectileLifetime = state.gameProjectileLifetime;
      site.game.projectileCooldown = state.gameProjectileCooldown;
      floorSystem.refreshStaircaseConfig();
      refreshSphereGoal();
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
          { type: 'slider', key: 'gameTileCaptureRadius', label: 'Radio captura popup', min: 0.8, max: 1.8, step: 0.05 },
          { type: 'slider', key: 'gameAscendSphereGoal', label: 'Esferas para subir', min: 1, max: 18, step: 1 },
          { type: 'slider', key: 'gameFloorHeight', label: 'Altura entre pisos', min: 2.8, max: 7.5, step: 0.1 },
          { type: 'slider', key: 'gameGhostFloors', label: 'Pisos visibles', min: 1, max: 4, step: 1 },
          { type: 'slider', key: 'gameStairWidth', label: 'Ancho escalera', min: 0.8, max: 2.4, step: 0.05 },
          { type: 'slider', key: 'gameStairTriggerRadius', label: 'Radio llegada escalera', min: 0.45, max: 1.8, step: 0.05 },
          { type: 'slider', key: 'gameProjectileMax', label: 'Max disparos activos', min: 40, max: 720, step: 20 },
          { type: 'slider', key: 'gameProjectileBurst', label: 'Esferas por disparo', min: 1, max: 8, step: 1 },
          { type: 'slider', key: 'gameProjectileSpeed', label: 'Velocidad disparo', min: 3, max: 18, step: 0.5 },
          { type: 'slider', key: 'gameProjectileLifetime', label: 'Vida disparo', min: 0.4, max: 2.4, step: 0.05, unit: 's' },
          { type: 'slider', key: 'gameProjectileCooldown', label: 'Cooldown disparo', min: 0.02, max: 0.25, step: 0.005, unit: 's' },
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

  const floorQaParams = new URLSearchParams(window.location.search);
  if (import.meta.env.DEV || floorQaParams.has('floor-test')) {
    window.p28FloorDebug = {
      revealStaircase() {
        revealStaircase();
        return this.state();
      },
      stepOnStair() {
        if (!floorSystem.isStairReady) revealStaircase();
        beginFloorAscension(performance.now());
        return this.state();
      },
      triggerAscension() {
        if (!floorSystem.isStairReady) revealStaircase();
        beginFloorAscension(performance.now());
        return this.state();
      },
      shoot(count = 1) {
        const n = Math.max(1, Math.min(20, Number(count) || 1));
        for (let i = 0; i < n; i += 1) {
          lightProjectiles.fire({
            position: controlLight.mesh.position,
            direction: new THREE.Vector3(0, 0, -1),
            nowMs: performance.now() + i * 100,
          });
        }
        return this.state();
      },
      state() {
        return {
          active: sphereRun.active,
          ascending: sphereRun.ascending,
          awaitingStair: sphereRun.awaitingStair,
          collected: sphereRun.collected,
          goal: sphereRun.goal,
          floorLevel: sphereRun.floorLevel,
          systemLevel: floorSystem.level,
          ghostCount: floorSystem.ghostCount,
          activeTileCount: floorSystem.activeTileCount,
          activeProjectCount: activeFloorTiles.filter((tile) => tile.userData?.isProject).length,
          activeNormalCount: activeFloorTiles.filter((tile) => !tile.userData?.isProject).length,
          layoutMode: floorSystem.layoutMode,
          nextFloorTileCount: floorSystem.nextFloorTileCount,
          stairVisible: floorSystem.staircase.visible,
          stairReady: floorSystem.isStairReady,
          stairWidth: floorSystem.stairWidth,
          stairTriggerRadius: floorSystem.stairTriggerRadius,
          projectileActive: lightProjectiles.activeCount,
          projectileMax: lightProjectiles.maxProjectiles,
          projectileFired: lightProjectiles.firedTotal,
          stairAnchor: floorSystem.stairAnchor ? {
            row: floorSystem.stairAnchor.userData.row,
            col: floorSystem.stairAnchor.userData.col,
          } : null,
          cameraLift: Number(floorSystem.cameraLift.toFixed(4)),
          ascensionState: document.documentElement.dataset.p28AscensionState || null,
          contentSource: document.documentElement.dataset.p28ContentSource || null,
        };
      },
    };
  }

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
  const capturePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const capturePoint = new THREE.Vector3();
  let hovered = null;
  let keyboardHovered = null;
  let pinnedTile = null;
  let pointerInsideViewport = false;
  let lastPointerHitAt = -Infinity;
  let hoverCandidate = null;
  let hoverCandidateSince = 0;

  const HOVER_EXIT_GRACE_MS = 180;
  const HOVER_SWITCH_GRACE_MS = 90;
  const DEFAULT_TILE_CAPTURE_RADIUS = 1.15;

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

  function getTileCaptureRadius() {
    const value = Number(site.game.tileCaptureRadius);
    if (!Number.isFinite(value)) return DEFAULT_TILE_CAPTURE_RADIUS;
    return Math.max(0.8, Math.min(1.8, value));
  }

  function findNearestProjectTileInCapture(ray) {
    if (!ray.intersectPlane(capturePlane, capturePoint)) return null;
    const radius = getTileCaptureRadius();
    const radiusSq = radius * radius;
    let bestTile = null;
    let bestDistSq = Infinity;
    for (const tile of activeFloorTiles) {
      if (!tile.userData?.isProject) continue;
      const dx = capturePoint.x - tile.position.x;
      const dz = capturePoint.z - tile.position.z;
      const distSq = dx * dx + dz * dz;
      if (distSq <= radiusSq && distSq < bestDistSq) {
        bestTile = tile;
        bestDistSq = distSq;
      }
    }
    return bestTile;
  }

  function resolveProjectTileFromPointer() {
    const hits = raycaster.intersectObjects(activeFloorTiles, false);
    const exactProject = hits.find((hit) => hit.object?.userData?.isProject)?.object || null;
    if (exactProject) return { tile: exactProject, mode: 'exact' };
    const captured = findNearestProjectTileInCapture(raycaster.ray);
    return captured ? { tile: captured, mode: 'magnet' } : { tile: null, mode: 'none' };
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
    const { tile, mode } = resolveProjectTileFromPointer();
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
    document.documentElement.dataset.p28TileCaptureMode = mode;
    document.documentElement.dataset.p28TileCaptureRadius = String(getTileCaptureRadius());
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
    if (!tile?.userData?.isProject || !tile.visible) return;
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

    const floorEvent = floorSystem.update(dt, t);
    sceneCtx.setCameraAscentOffset(floorSystem.cameraLift);
    if (sceneCtx.camState.drift) {
      const tiltOff = Math.sin(t * 0.18) * 1.2;
      const yawOff  = Math.sin(t * 0.13) * 2.0;
      sceneCtx.setCameraFromState(sceneCtx.camState.tilt + tiltOff, sceneCtx.camState.yaw + yawOff);
    } else {
      sceneCtx.setCameraFromState(sceneCtx.camState.tilt, sceneCtx.camState.yaw);
    }

    raycaster.setFromCamera(pointer, sceneCtx.camera);
    controlLight.update(dt, now, raycaster);
    lightProjectiles.update(dt);
    updateSphereRun(now, t);
    if (floorEvent?.type === 'ascended') {
      completeFloorAscension(floorEvent.level, now);
    }
    const { tile: pointerHit } = resolveProjectTileFromPointer();
    if (pointerInsideViewport && pointerHit) interactionAudio.playBlock(pointerHit);
    const hit = resolveHoverTarget(pointerHit, now);
    applyHoverTarget(hit);

    for (const tile of sceneCtx.tiles) {
      if (!tile.visible) {
        tile.userData.isLit = false;
        continue;
      }
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
