/* =========================================================
   PROYECTO 28 — Etapa 4: luz controlable
   PointLight + esfera emissiva cyan que sigue al mouse y
   acepta WASD. Sin físicas todavía (gravedad/saltos van en
   Etapa 5).

   Prioridad:
     - Si hay WASD presionado → modo WASD (velocity * dt).
     - Si soltaste WASD hace menos de mouseFollowDelay seg
       → seguimos en modo WASD (velocity=0).
     - En otro caso → mouse-follow con lerp exponencial.

   Reutiliza el THREE.Raycaster del bucle principal: se le
   pasa ya orientado desde la cámara con el pointer actual.
   ========================================================= */

import * as THREE from 'three';

const LIGHT_Y = 1.0;          // altura de la esfera sobre el grid (cubos están en y=0..0.19)
const SPHERE_RADIUS = 0.18;
const MOUSE_FOLLOW_SMOOTHING = 6; // tasa de exponencial → frame-rate independiente
const LIGHT_COLOR = 0x6BC4BB;
const LIGHT_EMISSIVE = 0x5ee5d6;

/**
 * @param {Object} opts
 * @param {THREE.Scene} opts.scene
 * @param {{ lightSpeed:number, mouseFollowDelay:number }} opts.config  site.game
 * @returns {{
 *   mesh: THREE.Mesh,
 *   light: THREE.PointLight,
 *   onKeyDown: (e:KeyboardEvent)=>void,
 *   onKeyUp: (e:KeyboardEvent)=>void,
 *   update: (dt:number, nowMs:number, raycaster:THREE.Raycaster)=>void,
 * }}
 */
export function createControllableLight({ scene, config }) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(SPHERE_RADIUS, 24, 16),
    new THREE.MeshStandardMaterial({
      color: LIGHT_COLOR,
      emissive: LIGHT_EMISSIVE,
      emissiveIntensity: 2.5,
      roughness: 0.3,
      metalness: 0.0,
    }),
  );
  mesh.position.set(0, LIGHT_Y, 0);
  scene.add(mesh);

  const light = new THREE.PointLight(LIGHT_COLOR, 4.5, 12, 1.8);
  light.position.copy(mesh.position);
  scene.add(light);

  const target = mesh.position.clone();             // destino para mouse-follow
  const velocity = new THREE.Vector3();
  const keysActive = new Set();
  let lastWASDInput = -Infinity;

  // Plano horizontal a la altura de la luz — el raycast del cursor lo cruza ahí.
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -LIGHT_Y);
  const planeHit = new THREE.Vector3();

  function setMouseTarget(raycaster) {
    if (raycaster.ray.intersectPlane(groundPlane, planeHit)) {
      target.set(planeHit.x, LIGHT_Y, planeHit.z);
    }
  }

  function onKeyDown(e) {
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'a' || k === 's' || k === 'd') {
      keysActive.add(k);
      lastWASDInput = performance.now();
    }
  }

  function onKeyUp(e) {
    const k = e.key.toLowerCase();
    if (keysActive.delete(k)) {
      lastWASDInput = performance.now();
    }
  }

  function update(dt, nowMs, raycaster) {
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
      // sync target así no hay snap-back cuando expire el delay
      target.copy(mesh.position);
    } else {
      if (raycaster) setMouseTarget(raycaster);
      const k = 1 - Math.exp(-dt * MOUSE_FOLLOW_SMOOTHING);
      mesh.position.x += (target.x - mesh.position.x) * k;
      mesh.position.z += (target.z - mesh.position.z) * k;
    }

    mesh.position.y = LIGHT_Y;
    light.position.copy(mesh.position);
  }

  return { mesh, light, onKeyDown, onKeyUp, update };
}
