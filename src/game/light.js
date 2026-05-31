/* =========================================================
   PROYECTO 28 — luz controlable
     - Etapa 4: floating (mouse-follow + WASD a y=1).
     - Etapa 5: physics opt-in via tweak gravityEnabled.
     - Etapa 6: activeTile callback + respawn al caer al vacío + HUD counter.
     - Polish v0.8.0: continuous collision + respawn dinámico + sombra-decal
       + tweaks de juego en vivo.
     - Polish v0.9.0 (este archivo):
         · Sombra ahora es ring (argolla) en vez de círculo relleno.
         · Tamaño de sombra controlable vía config.shadowSize.
         · Input: flechas del teclado mapeadas a WASD.
         · Input: gamepad (stick izq / D-pad para mover, button 0 = face bottom para saltar).
   ========================================================= */

import * as THREE from 'three';
import { lightFallTimeline, lightSquashTimeline, lightVictoryTimeline } from '../animations/timelines.js';

const LIGHT_Y = 1.0;
const RESPAWN_HEIGHT = 4.0;
const SPHERE_RADIUS = 0.18;
const TILE_TOP_Y = 0.19;
const FOLLOW_SMOOTHING = 6;
const GROUND_EPSILON = 0.02;
const LIGHT_COLOR = 0x6BC4BB;
const LIGHT_EMISSIVE = 0x5ee5d6;
const VOID_Y = -10;
const FADE_IN_DURATION = 0.3;
const BASE_LIGHT_INTENSITY = 4.5;
const BASE_EMISSIVE_INTENSITY = 2.5;
const VICTORY_GOLD = { color: 0xffc857, emissive: 0xffd166, shadow: 0xffc857 };

const LIGHT_PALETTES = {
  cyan:  { color: LIGHT_COLOR, emissive: LIGHT_EMISSIVE, shadow: 0x5ee5d6 },
  red:   { color: 0xd85a56, emissive: 0xff4d5e, shadow: 0xff5c7a },
  green: { color: 0x5ee5a0, emissive: 0x35ff94, shadow: 0x5ee5a0 },
};

// Sombra (decal) — geometry unitaria (outer=1), tamaño final via scale.
const SHADOW_INNER = 0.78;            // ratio inner/outer del ring (grosor relativo)
const SHADOW_BASE_OPACITY = 0.55;
const SHADOW_DEFAULT_SIZE = 0.45;      // fallback si config.shadowSize no existe
const SHADOW_Y_OFFSET = 0.012;
const FLOOR_Y = -0.20;

const KIRBY_MULTIPLIERS = [1.0, 0.85, 0.7, 0.55];

// Gamepad
const GAMEPAD_DEADZONE = 0.18;
const GAMEPAD_JUMP_BUTTON = 0;        // standard mapping: Face Button Bottom
const GAMEPAD_DPAD_UP = 12;
const GAMEPAD_DPAD_DOWN = 13;
const GAMEPAD_DPAD_LEFT = 14;
const GAMEPAD_DPAD_RIGHT = 15;
const GAMEPAD_DPAD_AXIS_DEADZONE = 0.45;

function arrowToWASD(key) {
  if (key === 'ArrowUp')    return 'w';
  if (key === 'ArrowDown')  return 's';
  if (key === 'ArrowLeft')  return 'a';
  if (key === 'ArrowRight') return 'd';
  return null;
}

/**
 * @param {Object} opts
 * @param {THREE.Scene} opts.scene
 * @param {{ lightSpeed:number, mouseFollowDelay:number, gravity:number, jumpHeight:number, jumpCount:number, fallDuration:number, shadowSize?:number, lightColor?:string }} opts.config
 * @param {THREE.Mesh[]} opts.tiles
 * @param {boolean} [opts.gravityEnabled=false]
 * @param {(tile:THREE.Mesh|null)=>void} [opts.onActiveTileChange]
 * @param {(fallCount:number)=>void} [opts.onRespawn]
 * @param {()=>void} [opts.onRespawnComplete]
 * @param {(controlled:boolean, mode:string)=>void} [opts.onControlModeChange]
 */
export function createControllableLight({
  scene, config, tiles,
  gravityEnabled = false,
  onActiveTileChange = null,
  onRespawn = null,
  onRespawnComplete = null,
  onControlModeChange = null,
}) {
  let paletteKey = LIGHT_PALETTES[config.lightColor] ? config.lightColor : 'cyan';
  let victoryFlashTimer = 0;
  let victoryFlashing = false;
  let manualControlActive = false;
  let controlLocked = false;

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(SPHERE_RADIUS, 24, 16),
    new THREE.MeshStandardMaterial({
      color: LIGHT_PALETTES[paletteKey].color,
      emissive: LIGHT_PALETTES[paletteKey].emissive,
      emissiveIntensity: BASE_EMISSIVE_INTENSITY,
      roughness: 0.3,
      metalness: 0.0,
      transparent: true,
      opacity: 1.0,
    }),
  );
  scene.add(mesh);

  const light = new THREE.PointLight(LIGHT_PALETTES[paletteKey].color, BASE_LIGHT_INTENSITY, 12, 1.8);
  scene.add(light);

  // Sombra-anillo: RingGeometry unitaria (outer = 1.0). El tamaño final
  // se ajusta vía mesh.scale en updateShadow combinando config.shadowSize
  // con el factor de altura.
  const shadow = new THREE.Mesh(
    new THREE.RingGeometry(SHADOW_INNER, 1.0, 48),
    new THREE.MeshBasicMaterial({
      color: LIGHT_PALETTES[paletteKey].shadow,
      transparent: true,
      opacity: SHADOW_BASE_OPACITY,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.renderOrder = 1;
  scene.add(shadow);

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
  const externalMove = { x: 0, z: 0, active: false };
  let lastMoveInput = -Infinity;
  let prevJumpButton = false;
  let gamepadActiveThisFrame = false;

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

  const shadowRay = new THREE.Raycaster();
  const shadowOrigin = new THREE.Vector3();

  function applyPalette(palette) {
    mesh.material.color.setHex(palette.color);
    mesh.material.emissive.setHex(palette.emissive);
    light.color.setHex(palette.color);
    shadow.material.color.setHex(palette.shadow);
  }

  function setLightColor(key = 'cyan') {
    paletteKey = LIGHT_PALETTES[key] ? key : 'cyan';
    if (!victoryFlashing) applyPalette(LIGHT_PALETTES[paletteKey]);
  }

  function setManualControlActive(active) {
    if (manualControlActive === active) return;
    manualControlActive = active;
    if (onControlModeChange) onControlModeChange(manualControlActive, mode);
  }

  function flashVictory() {
    victoryFlashing = true;
    if (victoryFlashTimer) window.clearTimeout(victoryFlashTimer);
    applyPalette(VICTORY_GOLD);
    lightVictoryTimeline(mesh, light);
    victoryFlashTimer = window.setTimeout(() => {
      victoryFlashing = false;
      victoryFlashTimer = 0;
      applyPalette(LIGHT_PALETTES[paletteKey]);
    }, 1000);
  }

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
    setManualControlActive(true);
  }

  function exitPhysics() {
    if (mode === 'floating') return;
    mode = 'floating';
    target.set(mesh.position.x, LIGHT_Y, mesh.position.z);
    setActiveTile(null);
    setManualControlActive(false);
  }

  function setGravityEnabled(v) {
    gravityFlag = !!v;
    if (!gravityFlag) {
      controlLocked = false;
      setExternalMoveVector(0, 0, false);
      exitPhysics();
    }
  }

  function notifyMouseMoved() {
    if (mode === 'physics' && respawnPhase === 'none' && !controlLocked) exitPhysics();
  }

  function tryJump() {
    if (jumpsUsed >= config.jumpCount) return false;
    const mult = KIRBY_MULTIPLIERS[Math.min(jumpsUsed, KIRBY_MULTIPLIERS.length - 1)];
    vy = Math.sqrt(2 * config.gravity * config.jumpHeight) * mult;
    jumpsUsed++;
    grounded = false;
    lightSquashTimeline(mesh, 'jump');
    return true;
  }

  function jump() {
    if (mode !== 'physics' || respawnPhase !== 'none') return false;
    return tryJump();
  }

  function isControlActive() {
    return mode === 'physics' || manualControlActive;
  }

  function setControlActive(active) {
    controlLocked = !!active;
    if (active) {
      target.set(mesh.position.x, LIGHT_Y, mesh.position.z);
      enterPhysics();
    } else {
      keysActive.clear();
      lastMoveInput = -Infinity;
      setExternalMoveVector(0, 0, false);
      if (mode === 'physics') exitPhysics();
      else setManualControlActive(false);
    }
    return isControlActive();
  }

  function toggleControl() {
    return setControlActive(!isControlActive());
  }

  function setExternalMoveVector(x = 0, z = 0, active = true) {
    externalMove.x = THREE.MathUtils.clamp(Number.isFinite(x) ? x : 0, -1, 1);
    externalMove.z = THREE.MathUtils.clamp(Number.isFinite(z) ? z : 0, -1, 1);
    externalMove.active = !!active && (externalMove.x !== 0 || externalMove.z !== 0);
  }

  function handleMoveKey(k) {
    keysActive.add(k);
    lastMoveInput = performance.now();
    if (gravityFlag && mode === 'floating') {
      enterPhysics();
    }
  }

  function onKeyDown(e) {
    if (e.code === 'Space') {
      if (mode === 'physics' && respawnPhase === 'none' && !e.repeat) {
        e.preventDefault();
        tryJump();
      }
      return;
    }
    const arrow = arrowToWASD(e.key);
    if (arrow) {
      e.preventDefault();         // evita scroll de la página
      handleMoveKey(arrow);
      return;
    }
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'a' || k === 's' || k === 'd') {
      handleMoveKey(k);
    }
  }

  function onKeyUp(e) {
    const arrow = arrowToWASD(e.key);
    if (arrow) {
      if (keysActive.delete(arrow)) lastMoveInput = performance.now();
      return;
    }
    const k = e.key.toLowerCase();
    if (keysActive.delete(k)) {
      lastMoveInput = performance.now();
    }
  }

  function buttonPressed(buttons, index) {
    return !!(buttons[index] && buttons[index].pressed);
  }

  function readDpadAxes(pad) {
    let x = 0;
    let z = 0;
    const ax = pad.axes[6];
    const az = pad.axes[7];
    if (Number.isFinite(ax) && Math.abs(ax) > GAMEPAD_DPAD_AXIS_DEADZONE) x += Math.sign(ax);
    if (Number.isFinite(az) && Math.abs(az) > GAMEPAD_DPAD_AXIS_DEADZONE) z += Math.sign(az);
    return { x, z };
  }

  // Lee primer gamepad conectado (standard mapping). Retorna movimiento + edge del botón 0.
  function readGamepad() {
    gamepadActiveThisFrame = false;
    if (!navigator.getGamepads) return { x: 0, z: 0, jumpEdge: false };
    const pads = navigator.getGamepads();
    let pad = null;
    for (const p of pads) {
      if (p && p.connected) { pad = p; break; }
    }
    if (!pad) {
      prevJumpButton = false;
      return { x: 0, z: 0, jumpEdge: false };
    }
    let ax = pad.axes[0] || 0;
    let az = pad.axes[1] || 0;
    if (Math.abs(ax) < GAMEPAD_DEADZONE) ax = 0;
    if (Math.abs(az) < GAMEPAD_DEADZONE) az = 0;

    let dpadX = 0;
    let dpadZ = 0;
    if (buttonPressed(pad.buttons, GAMEPAD_DPAD_UP)) dpadZ -= 1;
    if (buttonPressed(pad.buttons, GAMEPAD_DPAD_DOWN)) dpadZ += 1;
    if (buttonPressed(pad.buttons, GAMEPAD_DPAD_LEFT)) dpadX -= 1;
    if (buttonPressed(pad.buttons, GAMEPAD_DPAD_RIGHT)) dpadX += 1;
    if (dpadX === 0 && dpadZ === 0) {
      const axisDpad = readDpadAxes(pad);
      dpadX = axisDpad.x;
      dpadZ = axisDpad.z;
    }
    ax += dpadX;
    az += dpadZ;

    const jumpBtn = pad.buttons[GAMEPAD_JUMP_BUTTON];
    const jumpPressed = !!(jumpBtn && jumpBtn.pressed);
    const jumpEdge = jumpPressed && !prevJumpButton;
    prevJumpButton = jumpPressed;

    if (ax !== 0 || az !== 0 || jumpPressed) {
      gamepadActiveThisFrame = true;
    }
    const mag = Math.hypot(ax, az);
    if (mag > 1) { ax /= mag; az /= mag; }
    return { x: ax, z: az, jumpEdge };
  }

  // Combina input de teclado + gamepad + sensores externos en un vector horizontal normalizado.
  function getMoveVector(padInput) {
    let mx = 0, mz = 0;
    if (keysActive.has('w')) mz -= 1;
    if (keysActive.has('s')) mz += 1;
    if (keysActive.has('a')) mx -= 1;
    if (keysActive.has('d')) mx += 1;
    mx += padInput.x;
    mz += padInput.z;
    if (externalMove.active) {
      mx += externalMove.x;
      mz += externalMove.z;
    }
    const mag = Math.hypot(mx, mz);
    if (mag > 1) { mx /= mag; mz /= mag; }
    return { x: mx, z: mz };
  }

  function setMouseTarget(raycaster) {
    if (raycaster.ray.intersectPlane(cursorPlane, planeHit)) {
      target.set(planeHit.x, LIGHT_Y, planeHit.z);
    }
  }

  function updateFloating(dt, nowMs, raycaster, padInput) {
    const move = getMoveVector(padInput);
    const anyMove = (move.x !== 0 || move.z !== 0);
    if (anyMove) lastMoveInput = nowMs;
    if (gamepadActiveThisFrame && gravityFlag) {
      enterPhysics();
      return;
    }

    const delayMs = config.mouseFollowDelay * 1000;
    const wasdMode = anyMove || (nowMs - lastMoveInput) < delayMs;
    setManualControlActive(wasdMode);

    if (wasdMode) {
      velocity.set(move.x, 0, move.z).multiplyScalar(config.lightSpeed);
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

  function updatePhysics(dt, padInput) {
    const inputAllowed = respawnPhase === 'none';

    if (inputAllowed) {
      const move = getMoveVector(padInput);
      velocity.set(move.x, 0, move.z).multiplyScalar(config.lightSpeed);
      mesh.position.x += velocity.x * dt;
      mesh.position.z += velocity.z * dt;

      if (padInput.jumpEdge) tryJump();
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
        lightSquashTimeline(mesh, 'land');
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
    lightFallTimeline(mesh);
  }

  function updateRespawn(dt) {
    if (respawnPhase === 'fadingOut') {
      respawnT += dt / Math.max(config.fallDuration, 0.01);
      if (respawnT >= 1) {
        mesh.position.set(RESPAWN_XZ.x, RESPAWN_XZ.y + RESPAWN_HEIGHT, RESPAWN_XZ.z);
        vy = 0;
        grounded = false;
        jumpsUsed = 0;
        fallCount++;
        if (onRespawn) onRespawn(fallCount);
        respawnPhase = 'fadingIn';
        respawnT = 0;
        setOpacity(0);
        lightSquashTimeline(mesh, 'jump');
      } else {
        setOpacity(1 - respawnT);
      }
    } else if (respawnPhase === 'fadingIn') {
      respawnT += dt / FADE_IN_DURATION;
      if (respawnT >= 1) {
        respawnPhase = 'none';
        respawnT = 0;
        setOpacity(1);
        if (onRespawnComplete) onRespawnComplete();
      } else {
        setOpacity(respawnT);
      }
    }
  }

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
    const baseSize = (typeof config.shadowSize === 'number') ? config.shadowSize : SHADOW_DEFAULT_SIZE;
    const altitudeFactor = 1 + heightAbove * 0.18;
    shadow.scale.setScalar(baseSize * altitudeFactor);

    const fadeFactor = Math.max(0.15, 1 - heightAbove * 0.10);
    const respawnFade = mesh.material.opacity;
    shadow.material.opacity = SHADOW_BASE_OPACITY * fadeFactor * respawnFade;
    shadow.visible = mesh.position.y > VOID_Y + 1;
  }

  function update(dt, nowMs, raycaster) {
    const padInput = readGamepad();
    if (mode === 'physics') {
      updatePhysics(dt, padInput);
      maybeStartRespawn();
      updateRespawn(dt);
    } else {
      updateFloating(dt, nowMs, raycaster, padInput);
    }
    light.position.copy(mesh.position);
    updateShadow();
  }

  return {
    mesh,
    light,
    shadow,
    onKeyDown,
    onKeyUp,
    update,
    setGravityEnabled,
    setLightColor,
    flashVictory,
    notifyMouseMoved,
    setControlActive,
    toggleControl,
    isControlActive,
    setExternalMoveVector,
    jump,
  };
}
