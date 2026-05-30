import { gsap } from 'gsap';

const EASE_OUT = 'power3.out';
const EASE_IN_OUT = 'power2.inOut';

function reducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function kill(target, props) {
  gsap.killTweensOf(target, props);
}

export function entranceTimeline(tiles = []) {
  if (reducedMotion() || !tiles.length) {
    tiles.forEach((tile) => tile.scale.setScalar(1));
    return null;
  }

  tiles.forEach((tile) => {
    tile.scale.setScalar(0.78);
    tile.rotation.y -= 0.08;
  });

  return gsap.timeline({ defaults: { ease: EASE_OUT } })
    .to(tiles.map((tile) => tile.scale), {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.58,
      stagger: 0.08,
    }, 0)
    .to(tiles.map((tile) => tile.rotation), {
      y: '+=0.08',
      duration: 0.58,
      stagger: 0.08,
    }, 0);
}

export function cubeActivateTimeline(cube) {
  if (!cube) return null;
  const ud = cube.userData || {};
  if (reducedMotion()) {
    cube.position.y = ud.hoverY ?? cube.position.y;
    cube.scale.setScalar(1.045);
    if (cube.material && ud.hoverEmissive != null) {
      cube.material.emissiveIntensity = ud.hoverEmissive;
    }
    return null;
  }

  ud.gsapAnimating = true;
  kill([cube.position, cube.scale, cube.material], 'y,x,z,emissiveIntensity');

  return gsap.timeline({
    defaults: { ease: EASE_OUT },
    onComplete: () => { ud.gsapAnimating = false; },
  })
    .to(cube.position, { y: ud.hoverY ?? 0.65, duration: 0.26 }, 0)
    .to(cube.scale, { x: 1.045, y: 1.055, z: 1.045, duration: 0.26 }, 0)
    .to(cube.material, { emissiveIntensity: ud.hoverEmissive ?? 1.4, duration: 0.22 }, 0);
}

export function cubeDeactivateTimeline(cube) {
  if (!cube) return null;
  const ud = cube.userData || {};
  if (reducedMotion()) {
    cube.position.y = ud.restY ?? 0;
    cube.scale.setScalar(1);
    if (cube.material && ud.baseEmissive != null) {
      cube.material.emissiveIntensity = ud.baseEmissive;
    }
    return null;
  }

  ud.gsapAnimating = true;
  kill([cube.position, cube.scale, cube.material], 'y,x,z,emissiveIntensity');

  return gsap.timeline({
    defaults: { ease: EASE_OUT },
    onComplete: () => { ud.gsapAnimating = false; },
  })
    .to(cube.position, { y: ud.restY ?? 0, duration: 0.34 }, 0)
    .to(cube.scale, { x: 1, y: 1, z: 1, duration: 0.34 }, 0)
    .to(cube.material, { emissiveIntensity: ud.baseEmissive ?? 0.35, duration: 0.26 }, 0);
}

export function popupEnterTimeline(popup) {
  if (!popup || reducedMotion()) return null;
  const parts = popup.querySelectorAll('.popup-eyebrow, .popup-title, .popup-subtitle, .popup-image-wrap:not([hidden]), .popup-desc, .popup-tags, .popup-actions');
  kill([popup, ...parts], 'opacity,y,filter');
  return gsap.timeline({ defaults: { ease: EASE_OUT } })
    .fromTo(popup, { filter: 'blur(4px)' }, { filter: 'blur(0px)', duration: 0.24 }, 0)
    .fromTo(parts, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.32, stagger: 0.035 }, 0.03);
}

export function popupExitTimeline(popup) {
  if (!popup || reducedMotion()) return null;
  const parts = popup.querySelectorAll('.popup-eyebrow, .popup-title, .popup-subtitle, .popup-image-wrap:not([hidden]), .popup-desc, .popup-tags, .popup-actions');
  kill([popup, ...parts], 'opacity,y,filter');
  return gsap.timeline({ defaults: { ease: 'power2.in' } })
    .to(parts, { opacity: 0, y: 6, duration: 0.14, stagger: 0.012 }, 0)
    .to(popup, { filter: 'blur(3px)', duration: 0.16 }, 0);
}

export function lightSquashTimeline(lightMesh, mode = 'jump') {
  if (!lightMesh || reducedMotion()) return null;
  const squash = mode === 'land'
    ? { x: 1.2, y: 0.72, z: 1.2 }
    : { x: 0.78, y: 1.28, z: 0.78 };

  kill(lightMesh.scale, 'x,y,z');
  return gsap.timeline({ defaults: { ease: EASE_OUT } })
    .to(lightMesh.scale, { ...squash, duration: 0.1 }, 0)
    .to(lightMesh.scale, { x: 1, y: 1, z: 1, duration: 0.28, ease: 'elastic.out(1, 0.45)' }, 0.08);
}

export function lightFallTimeline(lightMesh) {
  if (!lightMesh || reducedMotion()) return null;
  kill([lightMesh.scale, lightMesh.rotation], 'x,y,z');
  return gsap.timeline({ defaults: { ease: EASE_IN_OUT } })
    .to(lightMesh.scale, { x: 0.68, y: 0.68, z: 0.68, duration: 0.16 }, 0)
    .to(lightMesh.rotation, { z: '+=0.9', duration: 0.24 }, 0);
}

export function lightVictoryTimeline(lightMesh, pointLight) {
  if (!lightMesh || reducedMotion()) return null;
  kill([lightMesh.scale, lightMesh.material, pointLight], 'x,y,z,emissiveIntensity,intensity');
  const baseIntensity = pointLight?.intensity || 4.5;
  const baseEmissive = lightMesh.material?.emissiveIntensity || 2.5;
  return gsap.timeline({ defaults: { ease: EASE_OUT } })
    .to(lightMesh.scale, { x: 1.42, y: 1.42, z: 1.42, duration: 0.18 }, 0)
    .to(lightMesh.material, { emissiveIntensity: baseEmissive * 1.8, duration: 0.18 }, 0)
    .to(pointLight || {}, { intensity: baseIntensity * 1.8, duration: 0.18 }, 0)
    .to(lightMesh.scale, { x: 1, y: 1, z: 1, duration: 0.52, ease: 'elastic.out(1, 0.45)' }, 0.18)
    .to(lightMesh.material, { emissiveIntensity: baseEmissive, duration: 0.62 }, 0.28)
    .to(pointLight || {}, { intensity: baseIntensity, duration: 0.62 }, 0.28);
}

export function hudCounterTimeline(valueEl) {
  if (!valueEl || reducedMotion()) return null;
  kill(valueEl, 'scale,color,textShadow');
  return gsap.timeline({ defaults: { ease: EASE_OUT } })
    .fromTo(valueEl, {
      scale: 1,
      color: '#ff8a4d',
      textShadow: '0 0 14px rgba(255, 138, 77, 0.62)',
    }, {
      scale: 1.22,
      duration: 0.12,
    }, 0)
    .to(valueEl, {
      scale: 1,
      color: '#5ee5d6',
      textShadow: '0 0 0 rgba(94, 229, 214, 0)',
      duration: 0.32,
      ease: 'elastic.out(1, 0.5)',
    }, 0.1);
}

export function streamOverlayEnterTimeline(root) {
  if (!root || reducedMotion()) return null;
  const card = root.querySelector('.stream-card') || root;
  kill(card, 'scale,filter');
  return gsap.fromTo(card, {
    scale: 0.94,
    filter: 'blur(3px)',
  }, {
    scale: 1,
    filter: 'blur(0px)',
    duration: 0.24,
    ease: EASE_OUT,
  });
}
