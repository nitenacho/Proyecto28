import * as THREE from 'three';

const TILE_SIZE = 1.6;
const GHOST_TILE_HEIGHT = 0.12;
const DEFAULT_SPHERE_GOAL = 6;
const DEFAULT_FLOOR_HEIGHT = 4.2;
const DEFAULT_GHOST_FLOORS = 3;
const DEFAULT_STAIR_WIDTH = 1.35;
const DEFAULT_STAIR_TRIGGER_RADIUS = 0.95;
const ASCEND_DELAY = 0.42;
const ASCEND_DURATION = 1.72;
const STAIR_STEP_COUNT = 7;
const STAIR_STEP_HEIGHT = 0.16;
const STAIR_STEP_DEPTH = 0.52;
const STAIR_STEP_RISE = 0.16;
const STAIR_STEP_RUN = 0.38;
const STAIR_STEP_START_Y = 0.18;
const STAIR_STEP_START_Z = 0.34;

function easeInOut(t) {
  const x = THREE.MathUtils.clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function clampInt(value, fallback, min, max) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function clampNumber(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function seededRandom(seed) {
  let t = seed + 0x6D2B79F5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createStaircase() {
  const group = new THREE.Group();
  group.name = 'p28-floor-staircase';
  group.visible = false;

  const stepCount = STAIR_STEP_COUNT;
  const geometry = new THREE.BoxGeometry(1, STAIR_STEP_HEIGHT, STAIR_STEP_DEPTH);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffc857,
    emissive: 0xffd166,
    emissiveIntensity: 0.75,
    roughness: 0.36,
    metalness: 0.12,
    transparent: true,
    opacity: 0.92,
  });
  const steps = new THREE.InstancedMesh(geometry, material, stepCount);
  steps.name = 'p28-floor-staircase-steps';
  steps.castShadow = true;
  steps.receiveShadow = true;

  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  function setWidth(width = DEFAULT_STAIR_WIDTH) {
    scale.set(width, 1, 1);
    for (let i = 0; i < stepCount; i += 1) {
      position.set(0, STAIR_STEP_START_Y + i * STAIR_STEP_RISE, STAIR_STEP_START_Z + i * STAIR_STEP_RUN);
      matrix.compose(position, quaternion, scale);
      steps.setMatrixAt(i, matrix);
    }
    steps.instanceMatrix.needsUpdate = true;
  }
  setWidth(DEFAULT_STAIR_WIDTH);
  group.add(steps);

  const railGeometry = new THREE.BoxGeometry(0.045, 0.045, 2.7);
  const railMaterial = new THREE.MeshBasicMaterial({
    color: 0x5ee5d6,
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
  });
  const rail = new THREE.Mesh(railGeometry, railMaterial);
  rail.name = 'p28-floor-staircase-guide';
  rail.position.set(-0.78, 0.78, 1.38);
  rail.rotation.x = -0.25;
  group.add(rail);

  return {
    group,
    steps,
    material,
    railMaterial,
    stepCount,
    stepRun: STAIR_STEP_RUN,
    stepRise: STAIR_STEP_RISE,
    stepStartY: STAIR_STEP_START_Y,
    stepStartZ: STAIR_STEP_START_Z,
    setWidth,
  };
}

function tileColor(tile) {
  return tile.userData?.isProject ? tile.material.color.getHex() : 0x0A1220;
}

function createFloorInstances({ tiles, layout, name, opacity, wireframe = false }) {
  const geometry = new THREE.BoxGeometry(TILE_SIZE, GHOST_TILE_HEIGHT, TILE_SIZE);
  const material = new THREE.MeshBasicMaterial({
    color: 0x5ee5d6,
    transparent: true,
    opacity,
    depthWrite: false,
    wireframe,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, layout.length);
  mesh.name = name;
  mesh.frustumCulled = false;

  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < layout.length; i += 1) {
    const tile = tiles[layout[i]];
    position.set(tile.position.x, tile.position.y, tile.position.z);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(i, matrix);
    if (mesh.setColorAt) mesh.setColorAt(i, new THREE.Color(tileColor(tile)));
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return { mesh, material, geometry };
}

function createGhostFloor({ tiles, layout, floorHeight, index }) {
  const group = new THREE.Group();
  group.name = `p28-ghost-floor-${index}`;
  const floor = createFloorInstances({
    tiles,
    layout,
    name: 'p28-ghost-floor-grid-window',
    opacity: 0.22,
    wireframe: true,
  });
  group.add(floor.mesh);
  group.position.y = -floorHeight;
  return { group, material: floor.material, geometry: floor.geometry };
}

function createNextFloorPreview({ tiles, layout, floorHeight }) {
  const group = new THREE.Group();
  group.name = 'p28-next-floor-preview';
  const floor = createFloorInstances({
    tiles,
    layout,
    name: 'p28-next-floor-preview-grid',
    opacity: 0.44,
    wireframe: false,
  });
  group.add(floor.mesh);
  group.position.y = floorHeight;
  group.scale.setScalar(0.94);
  return { group, material: floor.material, geometry: floor.geometry };
}

export function createFloorSystem({ scene, tiles, config = {}, onActiveTilesChange = null }) {
  const root = new THREE.Group();
  root.name = 'p28-floor-system';
  scene.add(root);

  const ghostRoot = new THREE.Group();
  ghostRoot.name = 'p28-floor-ghosts';
  root.add(ghostRoot);

  const previewRoot = new THREE.Group();
  previewRoot.name = 'p28-floor-preview-root';
  root.add(previewRoot);

  const staircase = createStaircase();
  root.add(staircase.group);

  const allLayout = tiles.map((_, index) => index);
  const ghostFloors = [];
  let activeLayout = [...allLayout];
  let nextLayout = null;
  let nextPreview = null;
  let currentLevel = 0;
  let pendingLevel = 0;
  let ascendT = 0;
  let transitionState = 'idle';
  let cameraLift = 0;
  let stairAnchor = null;
  let stairDirection = new THREE.Vector2(0, 1);
  const stairTrigger = new THREE.Vector3();

  const rows = Math.max(...tiles.map((tile) => tile.userData.row)) + 1;
  const cols = Math.max(...tiles.map((tile) => tile.userData.col)) + 1;

  function getFloorHeight() {
    const value = Number(config.floorHeight);
    return Number.isFinite(value) ? THREE.MathUtils.clamp(value, 2.8, 7.5) : DEFAULT_FLOOR_HEIGHT;
  }

  function getMaxGhostFloors() {
    return clampInt(config.ghostFloors, DEFAULT_GHOST_FLOORS, 1, 4);
  }

  function getStairWidth() {
    return clampNumber(config.stairWidth, DEFAULT_STAIR_WIDTH, 0.8, 2.4);
  }

  function getStairTriggerRadius() {
    return clampNumber(config.stairTriggerRadius, DEFAULT_STAIR_TRIGGER_RADIUS, 0.45, 1.8);
  }

  function getSphereGoal(total) {
    return clampInt(config.ascendSphereGoal, DEFAULT_SPHERE_GOAL, 1, Math.max(1, total));
  }

  function getActiveTiles() {
    return activeLayout.map((index) => tiles[index]).filter(Boolean);
  }

  function getCollisionObjects() {
    const objects = getActiveTiles();
    if (staircase.group.visible) objects.push(staircase.steps);
    return objects;
  }

  function applyLayout(layout) {
    activeLayout = [...layout];
    const active = new Set(activeLayout);
    tiles.forEach((tile, index) => {
      const visible = active.has(index);
      tile.visible = visible;
      tile.userData.floorActive = visible;
    });
    if (onActiveTilesChange) onActiveTilesChange(getActiveTiles(), getCollisionObjects());
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.p28FloorActiveTiles = String(activeLayout.length);
      document.documentElement.dataset.p28FloorLayoutMode = activeLayout.length === tiles.length ? 'full' : 'sparse';
    }
  }

  function pickRandom(list, rand) {
    return list[Math.floor(rand() * list.length)];
  }

  function shuffle(list, rand) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rand() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function makeSparseLayout(level) {
    const rand = seededRandom(0x2800 + level * 97 + Math.floor(Math.random() * 997));
    const projectIndexes = allLayout.filter((index) => tiles[index].userData.isProject);
    const normalIndexes = allLayout.filter((index) => !tiles[index].userData.isProject);
    const edgeIndexes = allLayout.filter((index) => isEdgeTile(tiles[index]));
    const minCount = 3;
    const maxCount = Math.max(minCount, Math.min(10, allLayout.length - 2));
    const targetCount = minCount + Math.floor(rand() * (maxCount - minCount + 1));
    const selected = new Set();
    selected.add(pickRandom(projectIndexes, rand));
    selected.add(pickRandom(normalIndexes, rand));
    selected.add(pickRandom(edgeIndexes, rand));

    for (const index of shuffle(allLayout, rand)) {
      if (selected.size >= targetCount) break;
      selected.add(index);
    }
    return [...selected].sort((a, b) => a - b);
  }

  function createLayoutForLevel(level) {
    return level % 2 === 0 ? [...allLayout] : makeSparseLayout(level);
  }

  function isEdgeTile(tile) {
    const { row, col } = tile.userData;
    return row === 0 || col === 0 || row === rows - 1 || col === cols - 1;
  }

  function edgeDirections(tile) {
    const dirs = [];
    const { row, col } = tile.userData;
    if (col === 0) dirs.push(new THREE.Vector2(-1, 0));
    if (col === cols - 1) dirs.push(new THREE.Vector2(1, 0));
    if (row === 0) dirs.push(new THREE.Vector2(0, -1));
    if (row === rows - 1) dirs.push(new THREE.Vector2(0, 1));
    return dirs;
  }

  function chooseStairAnchor() {
    const activeTiles = getActiveTiles();
    const edgeTiles = activeTiles.filter(isEdgeTile);
    const candidates = edgeTiles.length ? edgeTiles : activeTiles;
    const anchor = candidates[Math.floor(Math.random() * candidates.length)] || activeTiles[0] || tiles[0];
    const dirs = edgeDirections(anchor);
    const dir = dirs.length ? dirs[Math.floor(Math.random() * dirs.length)] : new THREE.Vector2(0, 1);
    return { anchor, dir };
  }

  function disposePreview() {
    if (!nextPreview) return;
    previewRoot.remove(nextPreview.group);
    nextPreview.geometry.dispose?.();
    nextPreview.material.dispose?.();
    nextPreview = null;
  }

  function disposeGhost(floor) {
    ghostRoot.remove(floor.group);
    floor.geometry.dispose?.();
    floor.material.dispose?.();
  }

  function updateGhostLayout(skipNewest = false) {
    const floorHeight = getFloorHeight();
    ghostFloors.forEach((floor, index) => {
      if (skipNewest && index === 0) return;
      const depth = index + 1;
      const scale = Math.max(0.58, 0.86 - index * 0.08);
      floor.group.position.y = -floorHeight * depth;
      floor.group.scale.setScalar(scale);
      floor.material.opacity = Math.max(0.055, 0.22 - index * 0.055);
    });
  }

  function snapshotCurrentFloor() {
    const floor = createGhostFloor({
      tiles,
      layout: activeLayout,
      floorHeight: getFloorHeight(),
      index: currentLevel,
    });
    ghostRoot.add(floor.group);
    ghostFloors.unshift(floor);
    while (ghostFloors.length > getMaxGhostFloors()) disposeGhost(ghostFloors.pop());
    updateGhostLayout(true);
    floor.group.position.y = 0;
    floor.group.scale.setScalar(1);
    floor.material.opacity = 0.28;
  }

  function setStaircaseVisible(visible) {
    staircase.group.visible = !!visible;
    if (onActiveTilesChange) onActiveTilesChange(getActiveTiles(), getCollisionObjects());
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.p28StairVisible = visible ? 'true' : 'false';
    }
  }

  function positionStaircase(anchor, dir) {
    stairAnchor = anchor;
    stairDirection.copy(dir);
    staircase.setWidth(getStairWidth());
    const angle = Math.atan2(dir.x, dir.y);
    staircase.group.position.set(
      anchor.position.x + dir.x * (TILE_SIZE * 0.45),
      anchor.position.y,
      anchor.position.z + dir.y * (TILE_SIZE * 0.45),
    );
    staircase.group.userData.baseY = anchor.position.y;
    staircase.group.rotation.y = angle;
    const triggerDistance = staircase.stepStartZ + (staircase.stepCount - 1) * staircase.stepRun + TILE_SIZE * 0.45;
    stairTrigger.set(
      anchor.position.x + dir.x * triggerDistance,
      anchor.position.y + staircase.stepStartY + (staircase.stepCount - 1) * staircase.stepRise,
      anchor.position.z + dir.y * triggerDistance,
    );
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.p28StairAnchor = `${anchor.userData.row},${anchor.userData.col}`;
      document.documentElement.dataset.p28StairDirection = `${dir.x},${dir.y}`;
      document.documentElement.dataset.p28StairWidth = String(getStairWidth());
      document.documentElement.dataset.p28StairTriggerRadius = String(getStairTriggerRadius());
    }
  }

  function prepareStaircase(nextLevel = currentLevel + 1) {
    if (transitionState !== 'idle') return false;
    pendingLevel = Math.max(currentLevel + 1, nextLevel);
    nextLayout = createLayoutForLevel(pendingLevel);
    disposePreview();
    nextPreview = createNextFloorPreview({ tiles, layout: nextLayout, floorHeight: getFloorHeight() });
    previewRoot.add(nextPreview.group);
    const { anchor, dir } = chooseStairAnchor();
    positionStaircase(anchor, dir);
    ascendT = 0;
    cameraLift = 0;
    transitionState = 'ready';
    setStaircaseVisible(true);
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.p28AscensionState = 'stair-ready';
      document.documentElement.dataset.p28FloorLevelNext = String(pendingLevel);
      document.documentElement.dataset.p28NextFloorTiles = String(nextLayout.length);
    }
    return true;
  }

  function hasReachedStair(lightMesh) {
    if (transitionState !== 'ready' || !lightMesh) return false;
    const dx = lightMesh.position.x - stairTrigger.x;
    const dz = lightMesh.position.z - stairTrigger.z;
    const radius = getStairTriggerRadius();
    return (dx * dx + dz * dz) <= radius * radius;
  }

  function refreshStaircaseConfig() {
    staircase.setWidth(getStairWidth());
    if (stairAnchor) positionStaircase(stairAnchor, stairDirection);
  }

  function cancelStaircase() {
    if (transitionState !== 'ready') return;
    transitionState = 'idle';
    nextLayout = null;
    disposePreview();
    setStaircaseVisible(false);
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.p28AscensionState = 'idle';
      delete document.documentElement.dataset.p28NextFloorTiles;
    }
  }

  function startAscension(nextLevel = currentLevel + 1) {
    if (transitionState === 'idle') prepareStaircase(nextLevel);
    if (transitionState !== 'ready') return false;
    pendingLevel = Math.max(currentLevel + 1, nextLevel);
    snapshotCurrentFloor();
    ascendT = 0;
    cameraLift = 0;
    transitionState = 'stair';
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.p28AscensionState = 'stair';
      document.documentElement.dataset.p28FloorLevelNext = String(pendingLevel);
    }
    return true;
  }

  function completeAscension() {
    currentLevel = pendingLevel;
    transitionState = 'idle';
    ascendT = 0;
    cameraLift = 0;
    const layout = nextLayout || createLayoutForLevel(currentLevel);
    applyLayout(layout);
    nextLayout = null;
    disposePreview();
    setStaircaseVisible(false);
    updateGhostLayout(false);
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.p28AscensionState = 'idle';
      document.documentElement.dataset.p28FloorLevel = String(currentLevel);
      delete document.documentElement.dataset.p28NextFloorTiles;
    }
    return { type: 'ascended', level: currentLevel, activeTiles: getActiveTiles() };
  }

  function update(dt, timeSeconds) {
    if (staircase.group.visible) {
      const pulse = 0.72 + Math.sin(timeSeconds * 5.2) * 0.18;
      staircase.material.emissiveIntensity = pulse;
      staircase.railMaterial.opacity = 0.44 + Math.sin(timeSeconds * 4.1) * 0.16;
      staircase.group.position.y = staircase.group.userData.baseY || 0;
    }

    if (nextPreview) {
      const p = 0.5 + Math.sin(timeSeconds * 1.8) * 0.5;
      nextPreview.material.opacity = 0.32 + p * 0.18;
      nextPreview.group.position.y = getFloorHeight() + Math.sin(timeSeconds * 1.35) * 0.055;
    }

    if (transitionState === 'idle' || transitionState === 'ready') return null;

    ascendT += dt;
    if (transitionState === 'stair') {
      const p = easeInOut(ascendT / ASCEND_DELAY);
      cameraLift = p * 0.85;
      if (ascendT >= ASCEND_DELAY) {
        transitionState = 'ascend';
        ascendT = 0;
        if (typeof document !== 'undefined') {
          document.documentElement.dataset.p28AscensionState = 'ascend';
        }
      }
      return null;
    }

    const p = easeInOut(ascendT / ASCEND_DURATION);
    const latest = ghostFloors[0];
    const floorHeight = getFloorHeight();
    if (latest) {
      latest.group.position.y = -floorHeight * p;
      latest.group.scale.setScalar(1 - p * 0.14);
      latest.material.opacity = 0.28 - p * 0.06;
    }
    if (nextPreview) {
      nextPreview.group.position.y = floorHeight * (1 - p);
      nextPreview.group.scale.setScalar(0.94 + p * 0.06);
      nextPreview.material.opacity = 0.42 + p * 0.16;
    }
    cameraLift = Math.sin(p * Math.PI) * 1.35 + (1 - p) * 0.85;
    if (ascendT >= ASCEND_DURATION) return completeAscension();
    return null;
  }

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.p28FloorLevel = String(currentLevel);
    document.documentElement.dataset.p28AscensionState = 'idle';
    document.documentElement.dataset.p28FloorSphereGoal = String(getSphereGoal(tiles.length));
  }
  applyLayout(activeLayout);

  return {
    root,
    ghostRoot,
    staircase: staircase.group,
    get cameraLift() { return cameraLift; },
    get level() { return currentLevel; },
    get ghostCount() { return ghostFloors.length; },
    get activeTiles() { return getActiveTiles(); },
    get activeTileCount() { return activeLayout.length; },
    get collisionObjects() { return getCollisionObjects(); },
    get isTransitioning() { return transitionState !== 'idle' && transitionState !== 'ready'; },
    get isStairReady() { return transitionState === 'ready'; },
    get layoutMode() { return activeLayout.length === tiles.length ? 'full' : 'sparse'; },
    get stairAnchor() { return stairAnchor; },
    get stairWidth() { return getStairWidth(); },
    get stairTriggerRadius() { return getStairTriggerRadius(); },
    get nextFloorTileCount() { return nextLayout?.length || 0; },
    getSphereGoal,
    refreshStaircaseConfig,
    prepareStaircase,
    hasReachedStair,
    cancelStaircase,
    startAscension,
    update,
  };
}
