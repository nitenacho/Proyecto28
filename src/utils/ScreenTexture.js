// Generates an animated canvas texture for CRT screens
const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF><_|/\\'.split('')

function randomChar() {
  return CHARS[Math.floor(Math.random() * CHARS.length)]
}

export function createScreenTexture(projectTitle = '', color = '#00ff88') {
  const W = 256, H = 256
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  const cols = 16, rows = 16
  const cw = W / cols, ch = H / rows
  const grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => randomChar())
  )

  function draw() {
    // Dark background
    ctx.fillStyle = '#020a04'
    ctx.fillRect(0, 0, W, H)

    // Random character rain
    ctx.font = `${Math.floor(ch * 0.85)}px monospace`
    ctx.textBaseline = 'top'

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const alpha = 0.15 + Math.random() * 0.5
        ctx.fillStyle = color.replace(')', `, ${alpha})`).replace('rgb', 'rgba').replace('#', '')
        // crude hex → rgba fallback
        ctx.globalAlpha = alpha
        ctx.fillStyle = color
        ctx.fillText(grid[r][c], c * cw, r * ch)
      }
    }
    ctx.globalAlpha = 1

    // Title overlay at center
    if (projectTitle) {
      ctx.fillStyle = '#00000088'
      ctx.fillRect(0, H * 0.38, W, H * 0.24)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 13px "Courier New"'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(projectTitle.toUpperCase(), W / 2, H / 2)
      ctx.textAlign = 'start'
      ctx.textBaseline = 'top'
    }

    // Scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    for (let y = 0; y < H; y += 3) {
      ctx.fillRect(0, y, W, 1)
    }
  }

  draw()

  // Randomly refresh characters
  let tex
  const interval = setInterval(() => {
    const r = Math.floor(Math.random() * rows)
    const c = Math.floor(Math.random() * cols)
    grid[r][c] = randomChar()
    draw()
    if (tex) tex.needsUpdate = true
  }, 80)

  return { canvas, stopAnimation: () => clearInterval(interval) }
}
