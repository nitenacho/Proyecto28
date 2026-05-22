/* =========================================================
   PROYECTO 28 — luz controlable
     - Etapa 4 (default, sin físicas):
         · Esfera + PointLight flotando a y=1 sobre el grid.
         · Mouse-follow suave + WASD horizontal al mismo y.
         · Tras `mouseFollowDelay` sin WASD vuelve a seguir mouse.
     - Etapa 5 (opt-in via tweak `gravityEnabled`):
         · Cuando el tweak está ON, presionar WASD entra a "modo físicas"
           en la posición actual: gravedad + saltos múltiples (espacio).
         · Cualquier movimiento del mouse sale del modo físicas y la y
           lerpea de vuelta a 1.0 (no hay snap visible).
     - Etapa 6 (encima de físicas):
         · Cuando está grounded en physics, el cubo bajo la luz se marca
           como "activeTile" y se notifica via onActiveTileChange.
         · Caer al vacío (y<-10) dispara respawn: fade-out durante
           config.fallDuration mientras sigue cayendo, snap a (0,5,0),
           fade-in 0.3s. Incrementa contador y emite onRespawn(n).
   ========================================================= */

import * as THREE from 'three';

const LIGHT_Y = 1.0;
const SPAWN_POSITION = new THREE.Vector3(0, LIGHT_Y, 0);
const RESPAWN_POSITION = new THREE.Vector3(0, 5, 0);
const SPHERE_RADIUS = 0.18;
const TILE_TOP_Y = 0.19;            // TILE_HEIGHT/2 — debe coincidir con scene.js
const FOLLOW_SMOOTHING = 6;         // tasa exponencial → frame-rate independiente
const GROUND_EPSILON = 0.02;
const LIGHT_COLOR = 0x6BC4BB;
const LIGHT_EMISSIVE = 0x5ee5d6;
const VOID_Y = -10;
const FADE_IN_DURATION = 0.3;
const BASE_LIGHT_INTENSITY = 4.5;
const BASE_EMISSIVE_INTENSITY = 2.5;

// Kirby feel: cada salto en aire es más débil que el anterior.
const KIRBY_MULTIPLIERS = [1.0, 0.85, 0.7, 0.55];

/**
 * @param {Object} opts
 * @param {THREE.Scene} opts.scene
 * @param {{ lightSpeed:number, mouseFollowDelay:number, gravity:number, jumpHeight:number, jumpCount:number, fallDuration:number }} opts.config  site.game
 * @param {THREE.Mesh[]} opts.tiles  malla de cubos para raycast hacia abajo (modo físicas)
 * @param {boolean} [opts.gravityEnabled=false]  tweak inicial
 * @param {(tile:THREE.Mesh|null)=>void} [opts.onActiveTileChange]  callback al cambiar el cubo activo (sólo project tiles)
 * @param {(fallCount:number)=>void} [opts.onRespawn]  callback al completar un respawn (post fade-out)
 * @returns {{
 *   mesh: THREE.Mesh,
 *   light: THREE.PointLight,
 *   onKeyDown: (e:KeyboardEvent)=>void,
 *   onKeyUp: (e:KeyboardEvent)=>void,
 *   update: (dt:number, nowMs:number, raycaster:THREE.Raycaster|null)=>void,
 *   setGravityEnabled: (v:boolean)=>void,
 *   notifyMouseMoved: ()=>void,
 * }}
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
  mesh.position.copy(SPAWN_POSITION);
  scene.add(mesh);

  const light = new THREE.PointLight(LIGHT_COLOR, BASE_LIGHT_INTENSITY, 12, 1.8);
  light.position.copy(mesh.position);
  scene.add(light);

  let gravityFlag = !!gravityEnabled;
  let mode = 'floating';              // 'floating' | 'physics'

  const target = mesh.position.clone();
  const velocity = new THREE.Vector3();
  const keysActive = new Set();
  let lastWASDInput = -Infinity;

  // Estado físicas (sólo válido cuando mode === 'physics')
  let vy = 0;
  let grounded = false;
  let jumpsUsed = 0;
  let activeTile = null;

  // Estado respawn
  let respawnPhase = 'none';          // 'none' | 'fadingOut' | 'fadingIn'
  let respawnT = 0;
  let fallCount = 0;

  // Plano horizontal fijo a y=LIGHT_Y para proyectar el cursor.
  const cursorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -LIGHT_Y);
  const planeHit = new THREE.Vector3();

  // Raycast hacia abajo para detectar cubo bajo la luz (sólo modo físicas).
  const downRay = new THREE.Raycaster();
  const downOrigin = new THREE.Vector3();
  const downDir = new THREE.Vector3(0, -1, 0);
  downRay.far = 10;

  function setActiveTile(next) {
    if (next === activeTile) return;
    activeTile = next;
    if (onActiveTileChange) onActiveTileChange(activeTile);
  }

  function setOpacity(o) {
    mesh.material.opacity = o;
    light.intensity = BASE_LIGHT_INTENSITY * o;
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
    // y volverá a LIGHT_Y vía lerp en updateFloating
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
    // Smooth-return de y a LIGHT_Y (no-op cuando ya está ahí; útil tras salir de físicas).
    const kY = 1 - Math.exp(-dt * FOLLOW_SMOOTHING);
    mesh.position.y += (LIGHT_Y - mesh.position.y) * kY;
  }

  function updatePhysics(dt) {
    // Durante respawn fadingOut: seguimos cayendo, sin input WASD ni saltos
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
    mesh.position.y += vy * dt;

    // No raycast contra tiles mientras está cayendo al vacío.
    if (respawnPhase !== 'none') {
      setActiveTile(null);
      return;
    }

    downOrigin.copy(mesh.position);
    downRay.set(downOrigin, downDir);
    const hits = downRay.intersectObjects(tiles, false);

    let landed = false;
    let landedTile = null;
    if (hits.length > 0 && vy <= 0) {
      const tile = hits[0].object;
      const tileTopY = tile.position.y + TILE_TOP_Y;
      const lightBottomY = mesh.position.y - SPHERE_RADIUS;
      if (lightBottomY <= tileTopY + GROUND_EPSILON) {
        mesh.position.y = tileTopY + SPHERE_RADIUS;
        vy = 0;
        landed = true;
        landedTile = tile;
      }
    }
    if (landed) {
      if (!grounded) {
        grounded = true;
        jumpsUsed = 0;
      }
      setActiveTile(landedTile && landedTile.userData.isProject ? landedTile : null);
    } else {
      if (grounded) grounded = false;          // walked off the edge
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
        // Snap a posición de respawn, prep para fade-in
        mesh.position.copy(RESPAWN_POSITION);
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

  function update(dt, nowMs, raycaster) {
    if (mode === 'physics') {
      updatePhysics(dt);
      maybeStartRespawn();
      updateRespawn(dt);
    } else {
      updateFloating(dt, nowMs, raycaster);
    }
    light.position.copy(mesh.position);
  }

  return { mesh, light, onKeyDown, onKeyUp, update, setGravityEnabled, notifyMouseMoved };
}
