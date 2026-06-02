import * as THREE from 'three';

const TILE_TOP_Y = 0.19;
const FLOAT_HEIGHT = 0.36;
const FLOAT_AMPLITUDE = 0.055;
const SPHERE_RADIUS = 0.065;
const PICKUP_RADIUS = 0.34;
const PICKUP_RADIUS_SQ = PICKUP_RADIUS * PICKUP_RADIUS;

export function createCollectibleSpheres({ scene, tiles }) {
  const group = new THREE.Group();
  group.name = 'p28-collectible-spheres';
  group.visible = false;
  scene.add(group);

  const geometry = new THREE.SphereGeometry(SPHERE_RADIUS, 16, 10);
  const material = new THREE.MeshStandardMaterial({
    color: 0xb9fff0,
    emissive: 0x5ee5a0,
    emissiveIntensity: 1.35,
    roughness: 0.28,
    metalness: 0.08,
    transparent: true,
    opacity: 0.86,
  });

  const spheres = [];
  const sphereByTile = new Map();
  let activeSphereSet = new Set();
  for (const tile of tiles) {
    if (tile.userData?.isProject) continue;
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(
      tile.position.x,
      tile.position.y + TILE_TOP_Y + FLOAT_HEIGHT,
      tile.position.z,
    );
    sphere.userData = {
      tile,
      collected: false,
      baseY: sphere.position.y,
      phase: Math.random() * Math.PI * 2,
    };
    group.add(sphere);
    spheres.push(sphere);
    sphereByTile.set(tile, sphere);
  }

  function activeSpheres() {
    return spheres.filter((sphere) => activeSphereSet.has(sphere));
  }

  function setActiveTiles(activeTiles = tiles) {
    activeSphereSet = new Set(
      activeTiles
        .map((tile) => sphereByTile.get(tile))
        .filter(Boolean),
    );
    for (const sphere of spheres) {
      const active = activeSphereSet.has(sphere);
      if (!active) {
        sphere.userData.collected = true;
        sphere.visible = false;
      }
    }
  }

  function setActive(active) {
    group.visible = !!active;
    for (const sphere of spheres) {
      sphere.visible = !!active && activeSphereSet.has(sphere) && !sphere.userData.collected;
    }
  }

  function reset() {
    for (const sphere of spheres) {
      const active = activeSphereSet.has(sphere);
      sphere.userData.collected = !active;
      sphere.visible = group.visible && active;
      sphere.scale.setScalar(1);
    }
  }

  function collectNear(lightMesh) {
    if (!group.visible || !lightMesh) return 0;
    let picked = 0;
    for (const sphere of activeSpheres()) {
      if (sphere.userData.collected || !sphere.visible) continue;
      const dx = sphere.position.x - lightMesh.position.x;
      const dz = sphere.position.z - lightMesh.position.z;
      if ((dx * dx + dz * dz) > PICKUP_RADIUS_SQ) continue;
      sphere.userData.collected = true;
      sphere.visible = false;
      picked++;
    }
    return picked;
  }

  function update(timeSeconds) {
    if (!group.visible) return;
    for (const sphere of activeSpheres()) {
      if (sphere.userData.collected) continue;
      const phaseT = timeSeconds * 2.1 + sphere.userData.phase;
      sphere.position.y = sphere.userData.baseY + Math.sin(phaseT) * FLOAT_AMPLITUDE;
      sphere.rotation.y += 0.012;
      sphere.scale.setScalar(0.92 + Math.sin(phaseT * 1.35) * 0.08);
    }
  }

  setActiveTiles(tiles);

  return {
    group,
    spheres,
    get total() { return activeSphereSet.size; },
    setActiveTiles,
    setActive,
    reset,
    collectNear,
    update,
  };
}
