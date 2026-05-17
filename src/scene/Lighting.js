import * as THREE from 'three'
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js'

export function buildLighting(scene) {
  RectAreaLightUniformsLib.init()

  // ── Ambient (very dark) ──
  scene.add(new THREE.AmbientLight(0x050a14, 1))

  // ── Main key light (cool blue-white from above) ──
  const key = new THREE.DirectionalLight(0x8888ff, 0.6)
  key.position.set(2, 10, 4)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.camera.near = 0.5
  key.shadow.camera.far  = 30
  key.shadow.camera.left = key.shadow.camera.bottom = -14
  key.shadow.camera.right = key.shadow.camera.top   =  14
  key.shadow.bias = -0.001
  scene.add(key)

  // ── Neon point lights between consoles ──
  const neons = [
    { color: 0x00ffff, x: -5.5, y: 2.5, z: -1, intensity: 12, dist: 9 },
    { color: 0xff00ff, x:  0,   y: 2.5, z: -1, intensity: 12, dist: 9 },
    { color: 0x00ffff, x:  5.5, y: 2.5, z: -1, intensity: 12, dist: 9 },
    { color: 0xff2200, x: -9,   y: 2,   z:  2, intensity: 8,  dist: 7 },
    { color: 0xff2200, x:  9,   y: 2,   z:  2, intensity: 8,  dist: 7 },
  ]

  const pointLights = []
  neons.forEach(({ color, x, y, z, intensity, dist }) => {
    const pl = new THREE.PointLight(color, intensity, dist, 2)
    pl.position.set(x, y, z)
    pl.castShadow = false
    scene.add(pl)

    // Small emissive sphere to visualize the light
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 5 })
    )
    bulb.position.copy(pl.position)
    scene.add(bulb)

    pointLights.push(pl)
  })

  // ── Ceiling wash (faint blue overhead) ──
  const ceil = new THREE.PointLight(0x0022ff, 6, 18, 2)
  ceil.position.set(0, 8.5, -3)
  scene.add(ceil)

  // ── Back wall RectAreaLight (blue glow from behind consoles) ──
  const rect = new THREE.RectAreaLight(0x0044ff, 3, 20, 3)
  rect.position.set(0, 2, -9)
  rect.lookAt(0, 2, 0)
  scene.add(rect)

  // ── Floor bounce (very faint warm) ──
  const bounce = new THREE.PointLight(0x220011, 2, 20, 2)
  bounce.position.set(0, 0.3, 0)
  scene.add(bounce)

  return { pointLights }
}
