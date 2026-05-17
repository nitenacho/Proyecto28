import * as THREE from 'three'

export function buildParticles(scene) {
  const COUNT = 3000

  const positions = new Float32Array(COUNT * 3)
  const phases    = new Float32Array(COUNT)

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 24   // X
    positions[i * 3 + 1] =  Math.random() * 9            // Y
    positions[i * 3 + 2] = (Math.random() - 0.5) * 18   // Z
    phases[i] = Math.random() * Math.PI * 2
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const mat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.025,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  })

  const points = new THREE.Points(geo, mat)
  scene.add(points)

  // Return update function to call in the loop
  function update(elapsedTime) {
    const pos = geo.attributes.position.array
    for (let i = 0; i < COUNT; i++) {
      const idx = i * 3
      pos[idx + 1] = (Math.sin(elapsedTime * 0.18 + phases[i]) * 0.12) +
                     (pos[idx + 1] % 9)  // keep original Y range
    }
    geo.attributes.position.needsUpdate = true
  }

  return { update }
}
