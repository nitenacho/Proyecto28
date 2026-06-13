import * as THREE from 'three';

const POOL_CAPACITY = 720;
const DEFAULT_MAX = 260;
const DEFAULT_BURST = 3;
const DEFAULT_SPEED = 8.5;
const DEFAULT_LIFETIME = 1.15;
const DEFAULT_COOLDOWN = 0.055;
const PROJECTILE_RADIUS = 0.035;
const COLLECT_RADIUS = 0.24;

function clampNumber(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function clampInt(value, fallback, min, max) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export function createLightProjectiles({ scene, config = {}, onCollect = null }) {
  const geometry = new THREE.SphereGeometry(PROJECTILE_RADIUS, 8, 6);
  const material = new THREE.MeshBasicMaterial({
    color: 0xb9fff0,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, POOL_CAPACITY);
  mesh.name = 'p28-light-projectiles';
  mesh.frustumCulled = false;
  mesh.count = 0;
  scene.add(mesh);

  const active = new Uint8Array(POOL_CAPACITY);
  const age = new Float32Array(POOL_CAPACITY);
  const lifetime = new Float32Array(POOL_CAPACITY);
  const pos = new Float32Array(POOL_CAPACITY * 3);
  const vel = new Float32Array(POOL_CAPACITY * 3);

  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const basisSide = new THREE.Vector3();
  const basisDir = new THREE.Vector3();
  const shotSide = new THREE.Vector3();

  let cursor = 0;
  let activeTotal = 0;
  let firedTotal = 0;
  let lastFireMs = -Infinity;

  function getMaxProjectiles() {
    return clampInt(config.projectileMax, DEFAULT_MAX, 40, POOL_CAPACITY);
  }

  function getBurst() {
    return clampInt(config.projectileBurst, DEFAULT_BURST, 1, 8);
  }

  function getSpeed() {
    return clampNumber(config.projectileSpeed, DEFAULT_SPEED, 3, 18);
  }

  function getLifetime() {
    return clampNumber(config.projectileLifetime, DEFAULT_LIFETIME, 0.4, 2.4);
  }

  function getCooldownMs() {
    return clampNumber(config.projectileCooldown, DEFAULT_COOLDOWN, 0.02, 0.25) * 1000;
  }

  function deactivate(index) {
    if (!active[index]) return;
    active[index] = 0;
    activeTotal = Math.max(0, activeTotal - 1);
  }

  function nextSlot(maxProjectiles) {
    const needsFreeSlot = activeTotal < maxProjectiles;
    for (let attempts = 0; attempts < POOL_CAPACITY; attempts += 1) {
      const index = cursor;
      cursor = (cursor + 1) % POOL_CAPACITY;
      if (needsFreeSlot && !active[index]) return index;
      if (!needsFreeSlot && active[index]) return index;
    }
    return 0;
  }

  function spawn(index, origin, direction, sideOffset, upwardOffset) {
    if (!active[index]) activeTotal += 1;
    active[index] = 1;
    age[index] = 0;
    lifetime[index] = getLifetime();
    const base = index * 3;
    pos[base] = origin.x + direction.x * 0.2 + sideOffset.x * 0.055;
    pos[base + 1] = origin.y + 0.02 + upwardOffset;
    pos[base + 2] = origin.z + direction.z * 0.2 + sideOffset.z * 0.055;
    vel[base] = direction.x * getSpeed() + sideOffset.x * 0.75;
    vel[base + 1] = 0.04 + upwardOffset * 2.2;
    vel[base + 2] = direction.z * getSpeed() + sideOffset.z * 0.75;
  }

  function fire({ position: origin, direction, nowMs = performance.now() } = {}) {
    if (!origin) return 0;
    if ((nowMs - lastFireMs) < getCooldownMs()) return 0;
    lastFireMs = nowMs;

    basisDir.copy(direction || { x: 0, y: 0, z: -1 });
    basisDir.y = 0;
    if (basisDir.lengthSq() < 0.0001) basisDir.set(0, 0, -1);
    basisDir.normalize();
    basisSide.set(-basisDir.z, 0, basisDir.x);

    const maxProjectiles = getMaxProjectiles();
    const burst = getBurst();
    let spawned = 0;
    const center = (burst - 1) * 0.5;
    for (let i = 0; i < burst; i += 1) {
      const spread = (i - center) * 0.42;
      const upward = ((i % 2) - 0.5) * 0.018;
      const slot = nextSlot(maxProjectiles);
      shotSide.copy(basisSide).multiplyScalar(spread);
      spawn(slot, origin, basisDir, shotSide, upward);
      spawned += 1;
    }
    firedTotal += spawned;
    return spawned;
  }

  function clear() {
    active.fill(0);
    activeTotal = 0;
    mesh.count = 0;
    mesh.instanceMatrix.needsUpdate = true;
  }

  function update(dt) {
    let drawIndex = 0;
    for (let i = 0; i < POOL_CAPACITY; i += 1) {
      if (!active[i]) continue;
      const base = i * 3;
      age[i] += dt;
      pos[base] += vel[base] * dt;
      pos[base + 1] += vel[base + 1] * dt;
      pos[base + 2] += vel[base + 2] * dt;

      const picked = onCollect
        ? onCollect({ x: pos[base], y: pos[base + 1], z: pos[base + 2] }, COLLECT_RADIUS)
        : 0;
      if (picked > 0 || age[i] >= lifetime[i]) {
        deactivate(i);
        continue;
      }

      const fade = 1 - age[i] / Math.max(lifetime[i], 0.01);
      position.set(pos[base], pos[base + 1], pos[base + 2]);
      scale.setScalar(0.42 + fade * 0.72);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(drawIndex, matrix);
      drawIndex += 1;
    }
    mesh.count = drawIndex;
    mesh.instanceMatrix.needsUpdate = true;
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.p28ProjectileActive = String(activeTotal);
      document.documentElement.dataset.p28ProjectileMax = String(getMaxProjectiles());
      document.documentElement.dataset.p28ProjectileFired = String(firedTotal);
    }
  }

  return {
    mesh,
    fire,
    clear,
    update,
    get activeCount() { return activeTotal; },
    get maxProjectiles() { return getMaxProjectiles(); },
    get firedTotal() { return firedTotal; },
  };
}
