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
  const controlLight = createControllableLight({ scene: sceneCtx.scene, config: site.game });
  const popup = createPopup();

  const defaults = site.defaults;

  const tweaks = mountTweaks({
    host: document.getElementById('tweaks-root'),
    defaults,
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
    ],
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
      const targetY = (tile === hovered && ud.isProject) ? ud.hoverY : ud.restY;
      tile.position.y += (targetY - tile.position.y) * Math.min(dt * 8, 1);
      if (ud.isProject) {
        const breath = 0.5 + 0.5 * Math.sin(t * 1.4 + ud.breathPhase);
        const baseGlow = ud.baseEmissive * (0.85 + 0.3 * breath);
        const targetGlow = (tile === hovered) ? ud.hoverEmissive : baseGlow;
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
