import { createScene }        from './scene/SceneSetup.js'
import { buildLab }            from './scene/Lab.js'
import { buildComputers }      from './scene/Computers.js'
import { buildLighting }       from './scene/Lighting.js'
import { buildParticles }      from './scene/Particles.js'
import { createLoadingManager } from './ui/LoadingScreen.js'
import { createInfoPanel }     from './ui/InfoPanel.js'

// ── Bootstrap ──
const { renderer, scene, camera, controls, composer, clock } = createScene()

// ── Loading screen ──
createLoadingManager(() => {
  controls.enabled = true
  document.getElementById('hint').classList.add('visible')
})

// ── Build scene ──
buildLab(scene)
const { clickTargets, screenAnimations } = buildComputers(scene)
const { pointLights }  = buildLighting(scene)
const particles        = buildParticles(scene)

// ── Info panel + raycaster ──
const panel = createInfoPanel(camera, clickTargets)

// ── Neon flicker state ──
const flickerData = pointLights.map(pl => ({
  light:     pl,
  baseInt:   pl.intensity,
  phase:     Math.random() * Math.PI * 2,
  speed:     0.8 + Math.random() * 2.5,
}))

// ── Render loop ──
function animate() {
  requestAnimationFrame(animate)

  const delta   = clock.getDelta()
  const elapsed = clock.getElapsedTime()

  controls.update()
  particles.update(elapsed)
  panel.update()

  // Screen texture live update
  screenAnimations.forEach(({ tex }) => { tex.needsUpdate = true })

  // Subtle neon flicker
  flickerData.forEach(({ light, baseInt, phase, speed }) => {
    light.intensity = baseInt * (0.88 + Math.sin(elapsed * speed + phase) * 0.08 + Math.random() * 0.04)
  })

  composer.render()
}

animate()
