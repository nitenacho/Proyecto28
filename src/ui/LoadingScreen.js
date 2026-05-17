import * as THREE from 'three'

export function createLoadingManager(onReady) {
  const overlay  = document.getElementById('loading')
  const barFill  = document.getElementById('bar-fill')
  const pctText  = document.getElementById('load-pct')
  const startBtn = document.getElementById('start-btn')

  const manager = new THREE.LoadingManager(
    // onLoad
    () => {
      pctText.textContent = 'LISTO'
      barFill.style.width = '100%'
      setTimeout(() => {
        startBtn.style.display = 'inline-block'
      }, 400)
    },
    // onProgress
    (_url, loaded, total) => {
      const pct = Math.round((loaded / total) * 100)
      barFill.style.width = `${pct}%`
      pctText.textContent = `${pct}%`
    },
    // onError
    (url) => console.error('Error cargando:', url)
  )

  startBtn.addEventListener('click', () => {
    overlay.classList.add('fade-out')
    setTimeout(() => {
      overlay.style.display = 'none'
      onReady()
    }, 850)
  })

  // Simulate a quick fake progress so UI feels alive even with no assets
  let fakeProgress = 0
  const fakeInterval = setInterval(() => {
    fakeProgress += Math.random() * 18
    if (fakeProgress >= 100) {
      fakeProgress = 100
      clearInterval(fakeInterval)
      barFill.style.width = '100%'
      pctText.textContent = 'LISTO'
      setTimeout(() => {
        startBtn.style.display = 'inline-block'
      }, 300)
    } else {
      barFill.style.width = `${fakeProgress.toFixed(0)}%`
      pctText.textContent = `${fakeProgress.toFixed(0)}%`
    }
  }, 110)

  return manager
}
