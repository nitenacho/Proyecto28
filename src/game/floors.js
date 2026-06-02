import * as THREE from 'three';

const TILE_SIZE = 1.6;
const GHOST_TILE_HEIGHT = 0.12;
const DEFAULT_SPHERE_GOAL = 6;
const DEFAULT_FLOOR_HEIGHT = 4.2;
const DEFAULT_GHOST_FLOORS = 3;
const ASCEND_DELAY = 0.58;
const ASCEND_DURATION = 1.85;

function easeInOut(t) {
  const x = THREE.MathUtils.clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function clampInt(value, fallback, min, max) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function createStaircase() {
  const group = new THREE.Group();
  group.name = 'p28-floor-staircase';
  group.visible = false;

  const stepCount = 7;
  const geometry = new THREE.BoxGeometry(0.68, 0.12, 0.42);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffc857,
    emissive: 0xffd166,
    emissiveIntensity: 0.75,
    roughness: 0.36,
    metalness: 0.12,
    transparent: true,
    opacity: 0.92,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, stepCount);
  mesh.name = 'p28-floor-staircase-steps';
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < stepCount; i += 1) {
    position.set(-2.65 + i * 0.42, 0.36 + i * 0.16, 2.95 - i * 0.38);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(i, matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  group.add(mesh);

  const railGeometry = new THREE.BoxGeometry(3.2, 0.045, 0.045);
  const railMaterial = new THREE.MeshBasicMaterial({
    color: 0x5ee5d6,
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
  });
  const rail = new THREE.Mesh(railGeometry, railMaterial);
  rail.name = 'p28-floor-staircase-guide';
  rail.position.set(-1.45, 1.0, 1.85);
  rail.rotation.y = -0.74;
  rail.rotation.z = 0.28;
  group.add(rail);

  return { group, material, railMaterial };
}

function createGhostFloor({ tiles, floorHeight, index }) {
  const group = new THREE.Group();
  group.name = `p28-ghost-floor-${index}`;

  const geometry = new THREE.BoxGeometry(TILE_SIZE, GHOST_TILE_HEIGHT, TILE_SIZE);
  const material = new THREE.MeshBasicMaterial({
    color: 0x5ee5d6,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    wireframe: true,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, tiles.length);
  mesh.name = 'p28-ghost-floor-grid-window';
  mesh.frustumCulled = false;

  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < tiles.length; i += 1) {
    const tile = tiles[i];
    position.set(tile.position.x, tile.position.y, tile.position.z);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(i, matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  group.add(mesh);
  group.position.y = -floorHeight;
  return { group, material };
}

export function createFloorSystem({ scene, tiles, config = {} }) {
  const root = new THREE.Group();
  root.name = 'p28-floor-system';
  scene.add(root);

  const ghostRoot = new THREE.Group();
  ghostRoot.name = 'p28-floor-ghosts';
  root.add(ghostRoot);

  const staircase = createStaircase();
  root.add(staircase.group);

  const ghostFloors = [];
  let currentLevel = 0;
  let pendingLevel = 0;
  let ascendT = 0;
  let transitionState = 'idle';
  let cameraLift = 0;

  function getFloorHeight() {
    const value = Number(config.floorHeight);
    return Number.isFinite(value) ? THREE.MathUtils.clamp(value, 2.8, 7.5) : DEFAULT_FLOOR_HEIGHT;
  }

  function getMaxGhostFloors() {
    return clampInt(config.ghostFloors, DEFAULT_GHOST_FLOORS, 1, 4);
  }

  function getSphereGoal(total) {
    return clampInt(config.ascendSphereGoal, DEFAULT_SPHERE_GOAL, 1, Math.max(1, total));
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
    const floorHeight = getFloorHeight();
    const floor = createGhostFloor({ tiles, floorHeight, index: currentLevel });
    ghostRoot.add(floor.group);
    ghostFloors.unshift(floor);
    while (ghostFloors.length > getMaxGhostFloors()) {
      const removed = ghostFloors.pop();
      ghostRoot.remove(removed.group);
      removed.group.traverse((child) => {
        if (child.geometry) child.geometry.dispose?.();
      });
      removed.material.dispose?.();
    }
    updateGhostLayout(true);
    floor.group.position.y = 0;
    floor.group.scale.setScalar(1);
    floor.material.opacity = 0.28;
  }

  function setStaircaseVisible(visible) {
    staircase.group.visible = !!visible;
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.p28StairVisible = visible ? 'true' : 'false';
    }
  }

  function startAscension(nextLevel = currentLevel + 1) {
    if (transitionState !== 'idle') return false;
    pendingLevel = Math.max(currentLevel + 1, nextLevel);
    snapshotCurrentFloor();
    ascendT = 0;
    cameraLift = 0;
    transitionState = 'stair';
    setStaircaseVisible(true);
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
    setStaircaseVisible(false);
    updateGhostLayout(false);
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.p28AscensionState = 'idle';
      document.documentElement.dataset.p28FloorLevel = String(currentLevel);
    }
    return { type: 'ascended', level: currentLevel };
  }

  function update(dt, timeSeconds) {
    if (staircase.group.visible) {
      const pulse = 0.72 + Math.sin(timeSeconds * 5.2) * 0.18;
      staircase.material.emissiveIntensity = pulse;
      staircase.railMaterial.opacity = 0.44 + Math.sin(timeSeconds * 4.1) * 0.16;
      staircase.group.position.y = Math.sin(timeSeconds * 2.6) * 0.035;
    }

    if (transitionState === 'idle') return null;

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
    cameraLift = Math.sin(p * Math.PI) * 1.35 + (1 - p) * 0.85;
    if (ascendT >= ASCEND_DURATION) {
      return completeAscension();
    }
    return null;
  }

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.p28FloorLevel = String(currentLevel);
    document.documentElement.dataset.p28AscensionState = 'idle';
    document.documentElement.dataset.p28FloorSphereGoal = String(getSphereGoal(tiles.length));
  }

  return {
    root,
    ghostRoot,
    staircase: staircase.group,
    get cameraLift() { return cameraLift; },
    get level() { return currentLevel; },
    get ghostCount() { return ghostFloors.length; },
    get isTransitioning() { return transitionState !== 'idle'; },
    getSphereGoal,
    startAscension,
    update,
  };
}
