import * as THREE from 'three'
import { createScreenTexture } from '../utils/ScreenTexture.js'

// Project data — each console = one project
export const PROJECTS = [
  {
    title: 'Red de Agentes IA',
    description: 'Red de agentes Claude + GPT que se comunican via Discord y publican contenido en GitHub Pages de forma autónoma.',
    tech: ['Claude API', 'GPT-4', 'Node.js', 'Discord.js', 'GitHub Actions'],
    url: 'https://github.com/nitenacho/Red-de-agentes-de-Ignacio',
    screenColor: '#00ff88',
  },
  {
    title: 'Proyecto28',
    description: 'Este mismo sitio — laboratorio 3D interactivo construido con Three.js, Vite y desplegado en GitHub Pages.',
    tech: ['Three.js', 'Vite', 'WebGL', 'GitHub Pages'],
    url: 'https://github.com/nitenacho/Proyecto28',
    screenColor: '#00ffff',
  },
  {
    title: 'MCP Builder',
    description: 'Servidor MCP personalizado que conecta Claude Code con servicios externos, incluyendo integración de calendario y Google Drive.',
    tech: ['Python', 'FastMCP', 'Claude API', 'OAuth2'],
    url: 'https://github.com/nitenacho',
    screenColor: '#ff00ff',
  },
  {
    title: 'Diseño 3D Lab',
    description: 'Exploración de técnicas de modelado 3D procedural con geometrías generativas, shaders GLSL custom y post-processing avanzado.',
    tech: ['Three.js', 'GLSL', 'WebGPU', 'Blender'],
    url: 'https://github.com/nitenacho',
    screenColor: '#ff8800',
  },
  {
    title: 'CLI Agents',
    description: 'Sistema de agentes autónomos controlados por CLI que ejecutan tareas de desarrollo de software con Claude Code como motor.',
    tech: ['Claude Code', 'Bash', 'Python', 'SDK Anthropic'],
    url: 'https://github.com/nitenacho',
    screenColor: '#88ff00',
  },
]

const SCREEN_COLORS = ['#00ff88', '#00ffff', '#ff00ff', '#ff8800', '#88ff00']

export function buildComputers(scene) {
  const clickTargets = []
  const screenAnimations = []

  const count = PROJECTS.length

  // Place consoles in a gentle arc
  for (let i = 0; i < count; i++) {
    const t = (i / (count - 1)) - 0.5         // -0.5 → 0.5
    const x = t * 14                            // spread across X
    const z = -2 + Math.abs(t) * 3              // slight arc depth
    const project = PROJECTS[i]
    const color = SCREEN_COLORS[i % SCREEN_COLORS.length]

    const group = buildStation(project, color, screenAnimations)
    group.position.set(x, 0, z)
    // Rotate outer consoles slightly inward
    group.rotation.y = -t * 0.35

    scene.add(group)

    // Register all meshes in the group as click targets
    group.traverse((child) => {
      if (child.isMesh && child.userData.clickable) {
        child.userData.project = project
        clickTargets.push(child)
      }
    })
  }

  return { clickTargets, screenAnimations }
}

function buildStation(project, screenColor, screenAnimations) {
  const group = new THREE.Group()

  const bodyMat   = new THREE.MeshStandardMaterial({ color: 0x0d1520, roughness: 0.7, metalness: 0.6 })
  const trimMat   = new THREE.MeshStandardMaterial({ color: 0x1a2535, roughness: 0.5, metalness: 0.8 })
  const keyMat    = new THREE.MeshStandardMaterial({ color: 0x0a0f18, roughness: 0.9, metalness: 0.2 })

  // ── Main console body ──
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 1.1), bodyMat)
  body.position.set(0, 0.8, 0)
  body.castShadow = true
  body.receiveShadow = true
  group.add(body)

  // ── Raised top deck (where screen sits) ──
  const topDeck = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 1.1), trimMat)
  topDeck.position.set(0, 1.64, 0)
  group.add(topDeck)

  // ── CRT Monitor ──
  const monitorBase = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.8, 0.1), bodyMat)
  monitorBase.position.set(0, 2.06, 0.1)
  group.add(monitorBase)

  const monitorBody = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.4, 0.55), bodyMat)
  monitorBody.position.set(0, 2.86, 0)
  monitorBody.rotation.x = -0.12
  monitorBody.castShadow = true
  group.add(monitorBody)

  // ── Screen face ──
  const { canvas, stopAnimation } = createScreenTexture(project.title, screenColor)
  const screenTex = new THREE.CanvasTexture(canvas)
  screenAnimations.push({ tex: screenTex, stop: stopAnimation })

  const screenMat = new THREE.MeshStandardMaterial({
    map: screenTex,
    emissiveMap: screenTex,
    emissive: new THREE.Color(screenColor),
    emissiveIntensity: 0.9,
    roughness: 0.3,
  })

  const screen = new THREE.Mesh(new THREE.BoxGeometry(1.42, 1.1, 0.04), screenMat)
  screen.position.set(0, 2.86, 0.28)
  screen.rotation.x = -0.12
  screen.userData.clickable = true
  screen.userData.project = project
  group.add(screen)

  // Screen edge bezel glow
  const bezelMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(screenColor),
    emissive: new THREE.Color(screenColor),
    emissiveIntensity: 0.4,
    roughness: 0.8,
  })
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(1.56, 1.24, 0.02), bezelMat)
  bezel.position.set(0, 2.86, 0.265)
  bezel.rotation.x = -0.12
  group.add(bezel)

  // ── Keyboard ──
  buildKeyboard(group, keyMat, trimMat)

  // ── Side panels with vents ──
  addVentPanel(group, trimMat, -1)
  addVentPanel(group, trimMat,  1)

  // ── Indicator LEDs ──
  addIndicatorLEDs(group, screenColor)

  // ── Extra stacked mini-monitors (Akira style) ──
  const miniMat = new THREE.MeshStandardMaterial({ color: 0x0a1018, roughness: 0.7, metalness: 0.5 })
  const miniScreenMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(screenColor),
    emissive: new THREE.Color(screenColor),
    emissiveIntensity: 1.2,
    roughness: 0.4,
  })

  for (let s = 0; s < 2; s++) {
    const xOff = (s === 0 ? -0.72 : 0.72)
    const mini = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.32), miniMat)
    mini.position.set(xOff, 4.6, -0.1)
    mini.rotation.x = -0.08
    group.add(mini)

    const ms = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.02), miniScreenMat)
    ms.position.set(xOff, 4.6, 0.062)
    ms.rotation.x = -0.08
    group.add(ms)
  }

  // ── Mark body as clickable too ──
  body.userData.clickable = true
  body.userData.project = project

  return group
}

function buildKeyboard(group, keyMat, trimMat) {
  const kbBase = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.06, 0.7), trimMat)
  kbBase.position.set(0, 1.68, 0.5)
  kbBase.rotation.x = 0.12
  group.add(kbBase)

  // Key rows
  const keyW = 0.09, keyH = 0.045, keyD = 0.075
  const cols = 16, rows = 4
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = new THREE.Mesh(new THREE.BoxGeometry(keyW, keyH, keyD), keyMat)
      key.position.set(
        -0.77 + c * 0.106,
        1.725 + r * 0.01,
        0.28 + r * 0.13
      )
      key.rotation.x = 0.12
      group.add(key)
    }
  }
}

function addVentPanel(group, mat, side) {
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.3, 0.9), mat)
  panel.position.set(side * 1.08, 0.85, 0)
  group.add(panel)

  // Vent slots
  const slotMat = new THREE.MeshStandardMaterial({ color: 0x050810, roughness: 1 })
  for (let i = 0; i < 6; i++) {
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.65), slotMat)
    slot.position.set(side * 1.085, 0.4 + i * 0.19, 0)
    group.add(slot)
  }
}

function addIndicatorLEDs(group, screenColor) {
  const colors = [0xff0000, 0x00ff00, new THREE.Color(screenColor).getHex()]
  for (let i = 0; i < 3; i++) {
    const mat = new THREE.MeshStandardMaterial({
      color: colors[i],
      emissive: colors[i],
      emissiveIntensity: 3,
    })
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), mat)
    led.position.set(-0.5 + i * 0.25, 1.68, 0.56)
    group.add(led)
  }
}
