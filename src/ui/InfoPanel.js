import * as THREE from 'three'

export function createInfoPanel(camera, clickTargets) {
  const panel     = document.getElementById('info-panel')
  const titleEl   = document.getElementById('panel-title')
  const descEl    = document.getElementById('panel-desc')
  const techEl    = document.getElementById('panel-tech')
  const linkEl    = document.getElementById('panel-link')
  const closeBtn  = document.getElementById('panel-close')
  const hint      = document.getElementById('hint')

  const raycaster = new THREE.Raycaster()
  const pointer   = new THREE.Vector2()

  let hoveredMesh = null
  let originalEmissive = new THREE.Color()

  closeBtn.addEventListener('click', () => {
    panel.classList.remove('visible')
  })

  window.addEventListener('pointermove', (e) => {
    pointer.x =  (e.clientX / window.innerWidth)  * 2 - 1
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1
  })

  window.addEventListener('click', (e) => {
    // Ignore clicks on UI elements
    if (e.target !== document.body && e.target.tagName !== 'CANVAS') return

    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects(clickTargets, false)

    if (hits.length > 0) {
      const project = hits[0].object.userData.project
      if (project) showProject(project)
    }
  })

  function showProject(project) {
    titleEl.textContent = project.title
    descEl.textContent  = project.description
    linkEl.href         = project.url

    techEl.innerHTML = ''
    project.tech.forEach((t) => {
      const tag = document.createElement('span')
      tag.className = 'tech-tag'
      tag.textContent = t
      techEl.appendChild(tag)
    })

    if (!project.url || project.url === '#') {
      linkEl.style.display = 'none'
    } else {
      linkEl.style.display = 'inline-block'
    }

    panel.classList.add('visible')
  }

  function update() {
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects(clickTargets, false)

    if (hits.length > 0) {
      const mesh = hits[0].object
      if (mesh !== hoveredMesh) {
        // Restore previous hover
        if (hoveredMesh && hoveredMesh.material.emissive) {
          hoveredMesh.material.emissive.copy(originalEmissive)
        }
        hoveredMesh = mesh
        if (mesh.material.emissive) {
          originalEmissive.copy(mesh.material.emissive)
          mesh.material.emissive.set(0xffffff)
        }
        document.body.style.cursor = 'pointer'
      }
    } else {
      if (hoveredMesh && hoveredMesh.material.emissive) {
        hoveredMesh.material.emissive.copy(originalEmissive)
      }
      hoveredMesh = null
      document.body.style.cursor = 'default'
    }
  }

  // Show hint after a delay
  setTimeout(() => hint.classList.add('visible'), 2000)

  return { update }
}
