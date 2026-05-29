/* =========================================================
   Floating 3D model that appears above the currently-hovered
   project tile. If the project supplies a .glb URL we load it
   (with GLTFLoader); otherwise we synthesize a procedural mesh
   tinted by the project's color. Both spin softly and bob
   vertically with a sine wave.
   ========================================================= */

import * as THREE from 'three';

const PALETTE_TO_HEX = {
  cyan:   { color: 0x9FE5DC, emissive: 0x39C7B6 },
  copper: { color: 0xFFB48A, emissive: 0xFF7A38 },
};

const SHAPE_BUILDERS = {
  icosa:     () => new THREE.IcosahedronGeometry(0.4, 0),
  octa:      () => new THREE.OctahedronGeometry(0.46, 0),
  tetra:     () => new THREE.TetrahedronGeometry(0.52, 0),
  dodeca:    () => new THREE.DodecahedronGeometry(0.42, 0),
  torus:     () => new THREE.TorusGeometry(0.34, 0.11, 16, 48),
  torusKnot: () => new THREE.TorusKnotGeometry(0.30, 0.08, 80, 12),
};

let gltfLoaderPromise = null;
const gltfCache = new Map(); // url -> Promise<Object3D>

export function createHoverModel(scene) {
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);

  let currentProject = null;
  let activeMesh = null;
  const tmpVec = new THREE.Vector3();

  function clearMesh() {
    if (activeMesh) {
      group.remove(activeMesh);
      activeMesh.traverse((o) => {
        if (o.geometry) o.geometry.dispose?.();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose?.());
          else o.material.dispose?.();
        }
      });
      activeMesh = null;
    }
  }

  function buildProcedural(project) {
    const builder = SHAPE_BUILDERS[project.modelShape] || SHAPE_BUILDERS.icosa;
    const geom = builder();
    const palette = PALETTE_TO_HEX[project.color] || PALETTE_TO_HEX.cyan;
    const mat = new THREE.MeshStandardMaterial({
      color: palette.color,
      emissive: palette.emissive,
      emissiveIntensity: 0.9,
      metalness: 0.6,
      roughness: 0.25,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = true;
    return mesh;
  }

  function loadGLB(url) {
    if (gltfCache.has(url)) return gltfCache.get(url);
    if (!gltfLoaderPromise) {
      gltfLoaderPromise = import('three/addons/loaders/GLTFLoader.js')
        .then(({ GLTFLoader }) => new GLTFLoader());
    }
    const p = gltfLoaderPromise.then((gltfLoader) => new Promise((resolve) => {
      gltfLoader.load(
        url,
        (gltf) => {
          const obj = gltf.scene;
          // Normalize: fit into a ~0.9 unit sphere
          const box = new THREE.Box3().setFromObject(obj);
          const size = box.getSize(new THREE.Vector3()).length() || 1;
          obj.scale.setScalar(0.9 / size);
          box.setFromObject(obj);
          const center = box.getCenter(new THREE.Vector3());
          obj.position.sub(center);
          obj.traverse((c) => { if (c.isMesh) { c.castShadow = true; } });
          resolve(obj);
        },
        undefined,
        (err) => { console.warn('[hover-model] glb load failed', url, err); resolve(null); },
      );
    }));
    gltfCache.set(url, p);
    return p;
  }

  function setHovered(tile, project) {
    if (!tile || !project) {
      currentProject = null;
      group.visible = false;
      return;
    }
    if (currentProject && currentProject.id === project.id && group.visible) {
      // Same project — just retarget position (handled in update())
      return;
    }
    currentProject = project;
    clearMesh();
    group.visible = true;

    if (project.modelURL) {
      loadGLB(project.modelURL).then((obj) => {
        if (currentProject !== project) return;  // hover moved on
        clearMesh();
        if (obj) {
          activeMesh = obj;
        } else {
          activeMesh = buildProcedural(project);
        }
        group.add(activeMesh);
      });
    } else {
      activeMesh = buildProcedural(project);
      group.add(activeMesh);
    }
  }

  function update(elapsed, tile) {
    if (!group.visible || !tile) return;
    // Float ~1.0 unit above the tile top with sine bob
    tmpVec.set(0, 1.05 + Math.sin(elapsed * 1.9) * 0.07, 0).add(tile.position);
    group.position.copy(tmpVec);
    group.rotation.y = elapsed * 0.6;
    group.rotation.x = Math.sin(elapsed * 0.7) * 0.15;
  }

  return { setHovered, update, group };
}
