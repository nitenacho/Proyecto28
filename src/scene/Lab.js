import * as THREE from 'three'

export function buildLab(scene) {
  const mats = {
    wall:  new THREE.MeshStandardMaterial({ color: 0x080c10, roughness: 0.9, metalness: 0.1, side: THREE.BackSide }),
    floor: new THREE.MeshStandardMaterial({ color: 0x0a0d12, roughness: 0.8, metalness: 0.2 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x111820, roughness: 0.6, metalness: 0.7 }),
    cable: new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.95, metalness: 0.1 }),
  }

  // ── Room box ──
  const room = new THREE.Mesh(new THREE.BoxGeometry(26, 9, 20), mats.wall)
  room.position.set(0, 4.5, 0)
  room.receiveShadow = true
  scene.add(room)

  // ── Floor ──
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(26, 20), mats.floor)
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  // ── Floor grid ──
  const grid = new THREE.GridHelper(26, 26, 0x00ffff, 0x002222)
  grid.position.y = 0.01
  scene.add(grid)

  // ── Ceiling detail panels ──
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x060a0e, roughness: 0.7, metalness: 0.4 })
  for (let i = -3; i <= 3; i++) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 3.2), panelMat)
    panel.position.set(i * 3.8, 8.96, 0)
    scene.add(panel)
  }

  // ── Back wall neon strip ──
  const stripGeo = new THREE.BoxGeometry(22, 0.06, 0.06)
  const stripMat = new THREE.MeshStandardMaterial({
    color: 0x0033ff,
    emissive: 0x0033ff,
    emissiveIntensity: 3,
  })
  const strip1 = new THREE.Mesh(stripGeo, stripMat)
  strip1.position.set(0, 7.8, -9.9)
  scene.add(strip1)

  const strip2 = new THREE.Mesh(new THREE.BoxGeometry(22, 0.06, 0.06), stripMat.clone())
  strip2.material.color.set(0xff0022)
  strip2.material.emissive.set(0xff0022)
  strip2.position.set(0, 0.5, -9.9)
  scene.add(strip2)

  // ── Floor baseboard strips ──
  const baseGeo = new THREE.BoxGeometry(24, 0.05, 0.05)
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 1.5 })
  const base = new THREE.Mesh(baseGeo, baseMat)
  base.position.set(0, 0.02, -9.85)
  scene.add(base)

  // ── Hanging cables from ceiling ──
  buildCables(scene, mats.cable)

  // ── Server rack columns on sides ──
  buildSideRacks(scene, mats.metal)
}

function buildCables(scene, mat) {
  const cablePositions = [
    [-6, 3], [-3, 1.5], [0, 3.5], [3, 2], [6, 4], [-8, 2.5], [8, 3],
    [-5, 5], [2, 1], [-1, 4], [5, 2.5],
  ]

  cablePositions.forEach(([x, z]) => {
    const yTop = 9 + Math.random() * 0.5
    const yBot = 1.5 + Math.random() * 4
    const sway = (Math.random() - 0.5) * 0.8

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, yTop, z),
      new THREE.Vector3(x + sway * 0.3, (yTop + yBot) / 2 - 0.5, z + sway),
      new THREE.Vector3(x + sway * 0.5, yBot + 0.5, z + sway * 1.2),
      new THREE.Vector3(x + sway * 0.5, yBot, z + sway * 1.2),
    ])

    const radius = 0.018 + Math.random() * 0.022
    const geo = new THREE.TubeGeometry(curve, 20, radius, 5, false)
    const mesh = new THREE.Mesh(geo, mat)
    mesh.castShadow = true
    scene.add(mesh)
  })
}

function buildSideRacks(scene, mat) {
  const emissiveMat = new THREE.MeshStandardMaterial({
    color: 0x00ff88,
    emissive: 0x00ff88,
    emissiveIntensity: 2,
  })

  for (const side of [-1, 1]) {
    const x = side * 11.5

    // Rack body
    const rack = new THREE.Mesh(new THREE.BoxGeometry(0.6, 7, 1.5), mat)
    rack.position.set(x, 3.5, -2)
    rack.castShadow = true
    scene.add(rack)

    // Rack indicator lights
    for (let i = 0; i < 8; i++) {
      const light = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), emissiveMat.clone())
      light.material.emissive.set(i % 2 === 0 ? 0x00ff88 : 0xff0000)
      light.material.color.copy(light.material.emissive)
      light.position.set(x + side * (-0.28), 1.2 + i * 0.8, -1.6)
      scene.add(light)
    }
  }
}
