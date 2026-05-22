/* =========================================================
   PROYECTO 28 — luz controlable
     - Etapa 4: floating (mouse-follow + WASD a y=1).
     - Etapa 5: physics opt-in via tweak gravityEnabled (gravedad + saltos Kirby).
     - Etapa 6: activeTile callback + respawn al caer al vacío + HUD counter.
     - Etapa 6 polish (v0.8.0):
         · Continuous collision: raycast desde prevY para evitar traspaso
           cuando vy*dt es grande.
         · Respawn position dinámica sobre tiles[0] (no centro vacío).
         · Sombra mesh debajo de la luz (decal cyan) en todo momento.
   ========================================================= */

import * as THREE from 'three';

const LIGHT_Y = 1.0;
const RESPAWN_HEIGHT = 4.0;          // metros sobre el tile de respawn
const SPHERE_RADIUS = 0.18;
const TILE_TOP_Y = 0.19;              // TILE_HEIGHT/2 — debe coincidir con scene.js
const FOLLOW_SMOOTHING = 6;
const GROUND_EPSILON = 0.02;
const LIGHT_COLOR = 0x6BC4BB;
const LIGHT_EMISSIVE = 0x5ee5d6;
const VOID_Y = -10;
const FADE_IN_DURATION = 0.3;
const BASE_LIGHT_INTENSITY = 4.5;
const BASE_EMISSIVE_INTENSITY = 2.5;

// Sombra (decal) — círculo proyectado en la superficie bajo la luz
const SHADOW_RADIUS = 0.45;
const SHADOW_BASE_OPACITY = 0.5;
const SHADOW_Y_OFFSET = 0.012;         // evita z-fighting con el top del cubo
const FLOOR_Y = -0.20;                 // debe coincidir con scene.js floor.position.y

// Kirby feel: cada salto en aire es más débil que el anterior.
const KIRBY_MULTIPLIERS = [1.0, 0.85, 0.7, 0.55];

/**
 * @param {Object} opts
 * @param {THREE.Scene} opts.scene
 * @param {{ lightSpeed:number, mouseFollowDelay:number, gravity:number, jumpHeight:number, jumpCount:number, fallDuration:number }} opts.config  site.game (mutable — los tweaks lo modifican in place)
 * @param {THREE.Mesh[]} opts.tiles
 * @param {boolean} [opts.gravityEnabled=false]
 * @param {(tile:THREE.Mesh|null)=>void} [opts.onActiveTileChange]
 * @param {(fallCount:number)=>void} [opts.onRespawn]
 */
export function createControllableLight({
  scene, config, tiles,
  gravityEnabled = false,
  onActiveTileChange = null,
  onRespawn = null,
}) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(SPHERE_RADIUS, 24, 16),
    new THREE.MeshStandardMaterial({
      color: LIGHT_COLOR,
      emissive: LIGHT_EMISSIVE,
      emissiveIntensity: BASE_EMISSIVE_INTENSITY,
      roughness: 0.3,
      metalness: 0.0,
      transparent: true,
      opacity: 1.0,
    }),
  );
  scene.add(mesh);

  const light = new THREE.PointLight(LIGHT_COLOR, BASE_LIGHT_INTENSITY, 12, 1.8);
  scene.add(light);

  // Sombra (decal cyan) — siempre debajo de la luz, sobre cubo o floor
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(SHADOW_RADIUS, 32),
    new THREE.MeshBasicMaterial({
      color: 0x5ee5d6,
      transparent: true,
      opacity: SHADOW_BASE_OPACITY,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.renderOrder = 1;
  scene.add(shadow);

  // Posición de respawn: encima del primer cubo (top-left del grid)
  const RESPAWN_XZ = new THREE.Vector3(0, 0, 0);
  if (tiles && tiles.length > 0) {
    RESPAWN_XZ.set(tiles[0].position.x, 0, tiles[0].position.z);
  }
  const SPAWN_POSITION = new THREE.Vector3(RESPAWN_XZ.x, LIGHT_Y, RESPAWN_XZ.z);
  mesh.position.copy(SPAWN_POSITION);
  light.position.copy(mesh.position);

  let gravityFlag = !!gravityEnabled;
  let mode = 'floating';

  const target = mesh.position.clone();
  const velocity = new THREE.Vector3();
  const keysActive = new Set();
  let lastWASDInput = -Infinity;

  let vy = 0;
  let grounded = false;
  let jumpsUsed = 0;
  let activeTile = null;

  let respawnPhase = 'none';
  let respawnT = 0;
  let fallCount = 0;

  const cursorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -LIGHT_Y);
  const planeHit = new THREE.Vector3();

  const downRay = new THREE.Raycaster();
  const downOrigin = new THREE.Vector3();
  const downDir = new THREE.Vector3(0, -1, 0);

  // Raycaster auxiliar para la sombra (no comparte estado con el de física)
  const shadowRay = new THREE.Raycaster();
  const shadowOrigin = new THREE.Vector3();

  function setActiveTile(next) {
    if (next === activeTile) return;
    activeTile = next;
    if (onActiveTileChange) onActiveTileChange(activeTile);
  }

  function setOpacity(o) {
    mesh.material.opacity = o;
    light.intensity = BASE_LIGHT_INTENSITY * o;
    shadow.material.opacity = SHADOW_BASE_OPACITY * o;
  }

  function enterPhysics() {
    if (mode === 'physics') return;
    mode = 'physics';
    vy = 0;
    grounded = false;
    jumpsUsed = 0;
  }

  function exitPhysics() {
    if (mode === 'floating') return;
    mode = 'floating';
    setActiveTile(null);
  }

  function setGravityEnabled(v) {
    gravityFlag = !!v;
    if (!gravityFlag) exitPhysics();
  }

  function notifyMouseMoved() {
    if (mode === 'physics' && respawnPhase === 'none') exitPhysics();
  }

  function tryJump() {
    if (jumpsUsed >= config.jumpCount) return;
    const mult = KIRBY_MULTIPLIERS[Math.min(jumpsUsed, KIRBY_MULTIPLIERS.length - 1)];
    vy = Math.sqrt(2 * config.gravity * config.jumpHeight) * mult;
    jumpsUsed++;
    grounded = false;
  }

  function onKeyDown(e) {
    if (e.code === 'Space') {
      if (mode === 'physics' && respawnPhase === 'none' && !e.repeat) {
        e.preventDefault();
        tryJump();
      }
      return;
    }
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'a' || k === 's' || k === 'd') {
      keysActive.add(k);
      lastWASDInput = performance.now();
      if (gravityFlag && mode === 'floating') {
        enterPhysics();
      }
    }
  }

  function onKeyUp(e) {
    const k = e.key.toLowerCase();
    if (keysActive.delete(k)) {
      lastWASDInput = performance.now();
    }
  }

  function setMouseTarget(raycaster) {
    if (raycaster.ray.intersectPlane(cursorPlane, planeHit)) {
      target.set(planeHit.x, LIGHT_Y, planeHit.z);
    }
  }

  function updateFloating(dt, nowMs, raycaster) {
    const anyHeld = keysActive.size > 0;
    if (anyHeld) lastWASDInput = nowMs;

    const delayMs = config.mouseFollowDelay * 1000;
    const wasdMode = anyHeld || (nowMs - lastWASDInput) < delayMs;

    if (wasdMode) {
      velocity.set(0, 0, 0);
      if (keysActive.has('w')) velocity.z -= 1;
      if (keysActive.has('s')) velocity.z += 1;
      if (keysActive.has('a')) velocity.x -= 1;
      if (keysActive.has('d')) velocity.x += 1;
      if (velocity.lengthSq() > 0) velocity.normalize().multiplyScalar(config.lightSpeed);
      mesh.position.x += velocity.x * dt;
      mesh.position.z += velocity.z * dt;
      target.set(mesh.position.x, LIGHT_Y, mesh.position.z);
    } else {
      if (raycaster) setMouseTarget(raycaster);
      const k = 1 - Math.exp(-dt * FOLLOW_SMOOTHING);
      mesh.position.x += (target.x - mesh.position.x) * k;
      mesh.position.z += (target.z - mesh.position.z) * k;
    }
    const kY = 1 - Math.exp(-dt * FOLLOW_SMOOTHING);
    mesh.position.y += (LIGHT_Y - mesh.position.y) * kY;
  }

  function updatePhysics(dt) {
    const inputAllowed = respawnPhase === 'none';

    if (inputAllowed) {
      velocity.set(0, 0, 0);
      if (keysActive.has('w')) velocity.z -= 1;
      if (keysActive.has('s')) velocity.z += 1;
      if (keysActive.has('a')) velocity.x -= 1;
      if (keysActive.has('d')) velocity.x += 1;
      if (velocity.lengthSq() > 0) velocity.normalize().multiplyScalar(config.lightSpeed);
      mesh.position.x += velocity.x * dt;
      mesh.position.z += velocity.z * dt;
    }

    if (!grounded) {
      vy -= config.gravity * dt;
    }

    const prevY = mesh.position.y;
    const newY = prevY + vy * dt;

    if (respawnPhase !== 'none') {
      mesh.position.y = newY;
      setActiveTile(null);
      return;
    }

    // Continuous collision: si vamos hacia abajo o estamos en reposo,
    // raycast desde (newX, prevY, newZ) hacia abajo, far = (prevY - newY) + SPHERE_RADIUS + ε.
    // Si hay hit, la luz cruzó o está apoyada → snap al top del cubo.
    let landed = false;
    let landedTile = null;
    if (vy <= 0) {
      downOrigin.set(mesh.position.x, prevY, mesh.position.z);
      downRay.set(downOrigin, downDir);
      const drop = Math.max(0, prevY - newY);
      downRay.far = drop + SPHERE_RADIUS + GROUND_EPSILON;
      const hits = downRay.intersectObjects(tiles, false);
      if (hits.length > 0) {
        const tile = hits[0].object;
        const tileTopY = tile.position.y + TILE_TOP_Y;
        mesh.position.y = tileTopY + SPHERE_RADIUS;
        vy = 0;
        landed = true;
        landedTile = tile;
      }
    }

    if (!landed) {
      mesh.position.y = newY;
    }

    if (landed) {
      if (!grounded) {
        grounded = true;
        jumpsUsed = 0;
      }
      setActiveTile(landedTile && landedTile.userData.isProject ? landedTile : null);
    } else {
      if (grounded) grounded = false;
      setActiveTile(null);
    }
  }

  function maybeStartRespawn() {
    if (respawnPhase !== 'none') return;
    if (mode !== 'physics') return;
    if (mesh.position.y > VOID_Y) return;
    respawnPhase = 'fadingOut';
    respawnT = 0;
    setActiveTile(null);
  }

  function updateRespawn(dt) {
    if (respawnPhase === 'fadingOut') {
      respawnT += dt / Math.max(config.fallDuration, 0.01);
      if (respawnT >= 1) {
        mesh.position.set(
          RESPAWN_XZ.x,
          RESPAWN_XZ.y + RESPAWN_HEIGHT,
          RESPAWN_XZ.z,
        );
        vy = 0;
        grounded = false;
        jumpsUsed = 0;
        fallCount++;
        if (onRespawn) onRespawn(fallCount);
        respawnPhase = 'fadingIn';
        respawnT = 0;
        setOpacity(0);
      } else {
        setOpacity(1 - respawnT);
      }
    } else if (respawnPhase === 'fadingIn') {
      respawnT += dt / FADE_IN_DURATION;
      if (respawnT >= 1) {
        respawnPhase = 'none';
        respawnT = 0;
        setOpacity(1);
      } else {
        setOpacity(respawnT);
      }
    }
  }

  // Actualiza la sombra-decal bajo la luz: raycast hacia abajo desde la luz,
  // mete la mesh en el hit point (top del cubo o piso). Escala/opacidad
  // varían con la altura para dar feedback de distancia.
  function updateShadow() {
    shadowOrigin.set(mesh.position.x, mesh.position.y, mesh.position.z);
    shadowRay.set(shadowOrigin, downDir);
    shadowRay.far = 50;
    const hits = shadowRay.intersectObjects(tiles, false);
    let surfaceY = FLOOR_Y;
    if (hits.length > 0) {
      surfaceY = hits[0].point.y;
    }
    shadow.position.set(mesh.position.x, surfaceY + SHADOW_Y_OFFSET, mesh.position.z);

    const heightAbove = Math.max(0, mesh.position.y - SPHERE_RADIUS - surfaceY);
    const scale = 1 + heightAbove * 0.18;
    shadow.scale.setScalar(scale);
    const fadeFactor = Math.max(0.15, 1 - heightAbove * 0.10);
    const respawnFade = mesh.material.opacity;  // si la luz está en fade, sombra también
    shadow.material.opacity = SHADOW_BASE_OPACITY * fadeFactor * respawnFade;
    shadow.visible = mesh.position.y > VOID_Y + 1;  // ocultar mientras cae al vacío
  }

  function update(dt, nowMs, raycaster) {
    if (mode === 'physics') {
      updatePhysics(dt);
      maybeStartRespawn();
      updateRespawn(dt);
    } else {
      updateFloating(dt, nowMs, raycaster);
    }
    light.position.copy(mesh.position);
    updateShadow();
  }

  return { mesh, light, shadow, onKeyDown, onKeyUp, update, setGravityEnabled, notifyMouseMoved };
}
