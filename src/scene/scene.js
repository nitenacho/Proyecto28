/* =========================================================
   PROYECTO 28 — Three.js scene (Vite-bundled port of the
   design's three-scene.js, plus a CMS-driven project DB
   and a floating-model-on-hover behaviour).
   ========================================================= */

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createHoverModel } from './hoverModel.js';

const TILE_SIZE   = 1.6;
const TILE_HEIGHT = 0.38;
const TILE_GAP    = 0.34;

const PALETTE = {
  cyan:   { color: 0x6BC4BB, emissive: 0x2EB5A8 },
  copper: { color: 0xD87340, emissive: 0xC45520 },
  empty:  { color: 0x0A1220, emissive: 0x000000 },
  mono:   { color: 0x18253D, emissive: 0x1a2438 },
};

function makeGridTexture() {
  const s = 512;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#020509';
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = 'rgba(127, 211, 203, 0.22)';
  ctx.lineWidth = 1;
  const step = 32;
  for (let i = 0; i <= s; i += step) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(s, i); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(127, 211, 203, 0.45)';
  for (let i = 0; i <= s; i += step * 4) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(s, i); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.anisotropy = 8;
  return tex;
}

export function createScene({ canvas, grid, projects }) {
  // Index projects by slot
  const projectBySlot = new Map();
  for (const p of projects) projectBySlot.set(p.slot, p);

  function getViewportSize() {
    const vv = window.visualViewport;
    if (vv && vv.width > 0 && vv.height > 0) return { w: vv.width, h: vv.height };
    return { w: window.innerWidth, h: window.innerHeight };
  }

  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: false, powerPreference: 'high-performance',
  });
  const initialViewport = getViewportSize();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(initialViewport.w, initialViewport.h, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x000000, 18, 38);

  // v0.14.4: cámara adaptativa por aspect ratio. El threshold de width
  // fallaba en iPad portrait (810-1180px). Usamos aspect ratio como driver
  // principal para que phone, tablet portrait, tablet landscape y desktop
  // wide tengan encuadre apropiado sin breakpoints arbitrarios.
  function computeCamFov() {
    const { w, h } = getViewportSize();
    const aspect = w / Math.max(h, 1);
    if (aspect < 0.7) return 56;   // phone portrait estrecho
    if (aspect < 0.95) return 48;  // tablet portrait
    if (aspect < 1.4) return 42;   // square/laptop
    return 34;                     // desktop wide
  }
  function computeCamRadius() {
    const { w, h } = getViewportSize();
    const aspect = w / Math.max(h, 1);
    if (aspect < 0.7) return 24;
    if (aspect < 0.95) return 22;
    if (aspect < 1.4) return 19;
    return 15;
  }
  const camera = new THREE.PerspectiveCamera(computeCamFov(), initialViewport.w / Math.max(initialViewport.h, 1), 0.1, 100);
  const CAM_TARGET = new THREE.Vector3(0, 0, 0);
  let camRadius = computeCamRadius();
  const camState = { tilt: 58, yaw: 0, drift: true };

  function setCameraFromState(tiltDeg, yawDeg) {
    const t = THREE.MathUtils.degToRad(tiltDeg);
    const y = THREE.MathUtils.degToRad(yawDeg);
    const hr = camRadius * Math.cos(t);
    camera.position.set(hr * Math.sin(y), camRadius * Math.sin(t), hr * Math.cos(y));
    camera.lookAt(CAM_TARGET);
  }
  setCameraFromState(camState.tilt, camState.yaw);

  // Lighting
  scene.add(new THREE.HemisphereLight(0x6BC4BB, 0x050810, 0.35));
  scene.add(new THREE.AmbientLight(0x1a2438, 0.4));
  const keyLight = new THREE.DirectionalLight(0xc7e6e0, 1.6);
  keyLight.position.set(-6, 12, 4);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 30;
  keyLight.shadow.camera.left = -10;
  keyLight.shadow.camera.right = 10;
  keyLight.shadow.camera.top = 10;
  keyLight.shadow.camera.bottom = -10;
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.radius = 6;
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0xff8a4d, 0.4);
  rimLight.position.set(8, 4, -6);
  scene.add(rimLight);
  const fill = new THREE.PointLight(0x5ee5d6, 0.6, 18, 1.5);
  fill.position.set(0, -1.5, 0);
  scene.add(fill);

  // Floor
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x020509, map: makeGridTexture(), roughness: 0.95, metalness: 0.1,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -TILE_HEIGHT / 2 - 0.01;
  floor.receiveShadow = true;
  scene.add(floor);

  // Tiles
  const tileGeom = new RoundedBoxGeometry(TILE_SIZE, TILE_HEIGHT, TILE_SIZE, 4, 0.18);
  const tilesGroup = new THREE.Group();
  scene.add(tilesGroup);

  const ROWS = grid.length;
  const COLS = grid[0].length;
  const totalW = COLS * TILE_SIZE + (COLS - 1) * TILE_GAP;
  const totalD = ROWS * TILE_SIZE + (ROWS - 1) * TILE_GAP;
  const startX = -totalW / 2 + TILE_SIZE / 2;
  const startZ = -totalD / 2 + TILE_SIZE / 2;

  const tiles = [];
  grid.forEach((row, r) => {
    row.forEach((slot, c) => {
      const project = projectBySlot.get(slot) || null;
      const palette = project ? PALETTE[project.color] : PALETTE.empty;
      const isProject = !!project;
      const mat = new THREE.MeshStandardMaterial({
        color: palette.color,
        emissive: palette.emissive,
        emissiveIntensity: isProject ? 0.35 : 0.0,
        roughness: isProject ? 0.42 : 0.85,
        metalness: isProject ? 0.18 : 0.05,
      });
      const mesh = new THREE.Mesh(tileGeom, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.position.set(startX + c * (TILE_SIZE + TILE_GAP), 0, startZ + r * (TILE_SIZE + TILE_GAP));
      mesh.userData = {
        slot, row: r, col: c, project, isProject,
        restY: 0, hoverY: 0.65,
        baseEmissive: isProject ? 0.35 : 0.0,
        hoverEmissive: isProject ? 1.4 : 0.6,
        activeEmissive: isProject ? 0.95 : 0.0,
        breathPhase: Math.random() * Math.PI * 2,
        defaultColorKey: project ? project.color : 'empty',
      };
      tilesGroup.add(mesh);
      tiles.push(mesh);
    });
  });

  function resolvePalette(style, defaultKey) {
    if (defaultKey === 'empty') return PALETTE.empty;
    if (style === 'cyan-only')   return PALETTE.cyan;
    if (style === 'copper-only') return PALETTE.copper;
    if (style === 'mono')        return PALETTE.mono;
    return PALETTE[defaultKey];
  }

  function applyTileStyle(style) {
    for (const tile of tiles) {
      const ud = tile.userData;
      if (!ud.isProject) continue;
      const p = resolvePalette(style, ud.defaultColorKey);
      tile.material.color.setHex(p.color);
      tile.material.emissive.setHex(p.emissive);
      if (style === 'mono') {
        ud.baseEmissive = 0.08;
        ud.hoverEmissive = 0.4;
        ud.activeEmissive = 0.25;
        tile.material.roughness = 0.7;
        tile.material.metalness = 0.05;
      } else {
        ud.baseEmissive = 0.35;
        ud.hoverEmissive = 1.4;
        ud.activeEmissive = 0.95;
        tile.material.roughness = 0.42;
        tile.material.metalness = 0.18;
      }
    }
  }

  // Post-processing
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(initialViewport.w, initialViewport.h),
    0.55, 0.85, 0.15,
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // Hover model
  const hoverModel = createHoverModel(scene);

  // Resize — recalcula FOV + radius para que el grid encaje en mobile/desktop.
  function handleResize() {
    const { w, h } = getViewportSize();
    camera.aspect = w / h;
    camera.fov = computeCamFov();
    camRadius = computeCamRadius();
    camera.updateProjectionMatrix();
    setCameraFromState(camState.tilt, camState.yaw);
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.setSize(w, h);
  }
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
  }
  // Re-corregir tras carga inicial (mobile a veces reporta innerHeight chico
  // hasta que la URL bar se asienta).
  setTimeout(handleResize, 200);

  return {
    renderer, scene, camera, composer, tiles, tilesGroup, hoverModel,
    setCameraFromState, applyTileStyle, camState,
  };
}
