import { Mesh, Program, Renderer, Texture, Triangle } from 'ogl'
import { gsap } from 'gsap'
import { fragment, vertex } from '~/lib/halftoneShader'
import type { PatternKind } from '~~/data/site'

/**
 * Halftone rendering engine.
 * ONE full-viewport fixed canvas; every <HalftoneImage> registers a "plane"
 * (a DOM box). Each frame we read the box's bounding rect and draw the shader
 * into that rect with gl.viewport + gl.scissor. The loop pauses when no plane
 * is on screen or the tab is hidden.
 */

export type RGB = [number, number, number]

export interface PlaneOptions {
  el: HTMLElement
  src?: string
  pattern?: PatternKind
  seed?: number
  ink?: RGB
  paper?: RGB
  dot?: number // CSS px
  contrast?: number
  angle?: number // radians
  animate?: boolean // animate procedural patterns over time
  fade?: number // 0..1 fade to paper toward the bottom
  lighten?: number // -1..1 global lift toward paper (negative darkens)
  drift?: number // 0..0.15 slow pan of the image under the dot grid (needs animate)
  shadow?: number // 0..1 strength of a soft ink shadow that trails the cursor (desktop only)
  onError?: () => void
}

export interface HalftonePlane {
  set: (opts: Partial<Omit<PlaneOptions, 'el'>>) => void
  destroy: () => void
}

const PATTERNS: Record<PatternKind, number> = { flow: 0, contour: 1, network: 2, orbits: 3, ribbon: 4 }

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '')
  const n = Number.parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

interface PlaneState {
  el: HTMLElement
  visible: boolean
  revealed: boolean
  texture: Texture | null
  hasTex: boolean
  u: {
    dot: number
    ink: RGB
    paper: RGB
    contrast: number
    reveal: number
    hover: number
    mouse: [number, number]
    mode: number
    pattern: number
    seed: number
    angle: number
    animate: boolean
    fade: number
    lighten: number
    drift: number
    shadow: number // strength
    shadowAmt: number // 0..1, eased in/out as the cursor enters/leaves
    shadowMouse: [number, number] // lagged position, 0..1 plane coords
    texSize: [number, number]
  }
  src?: string
  onError?: () => void
  shadowTarget: [number, number]
  cleanup: () => void
}

class HalftoneEngine {
  canvas: HTMLCanvasElement
  renderer: Renderer
  gl: Renderer['gl']
  program: Program
  mesh: Mesh
  blank: Texture
  planes = new Set<PlaneState>()
  io: IntersectionObserver
  running = false
  dpr = 1
  start = performance.now()
  lastTime = 0
  isMobile = false

  constructor() {
    this.isMobile = window.matchMedia('(max-width: 767px), (pointer: coarse)').matches
    this.dpr = Math.min(window.devicePixelRatio || 1, this.isMobile ? 1.25 : 1.75)

    this.renderer = new Renderer({
      dpr: this.dpr,
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      depth: false,
      powerPreference: this.isMobile ? 'low-power' : 'default',
    })
    this.gl = this.renderer.gl
    this.canvas = this.gl.canvas as HTMLCanvasElement
    this.canvas.setAttribute('aria-hidden', 'true')
    this.canvas.dataset.halftoneCanvas = ''
    Object.assign(this.canvas.style, {
      position: 'fixed',
      inset: '0',
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: '30',
    })
    document.body.appendChild(this.canvas)
    this.resize()

    const octaves = this.isMobile ? 2 : 4
    this.program = new Program(this.gl, {
      vertex,
      fragment: `#define OCTAVES ${octaves}\n${fragment}`,
      depthTest: false,
      depthWrite: false,
      transparent: false,
      cullFace: false,
      uniforms: {
        uRes: { value: [1, 1] },
        uDot: { value: 8 },
        uInk: { value: [0, 0, 0] },
        uPaper: { value: [1, 1, 1] },
        uContrast: { value: 1 },
        uReveal: { value: 0 },
        uHover: { value: 0 },
        uMouse: { value: [0.5, 0.5] },
        uTime: { value: 0 },
        uTex: { value: null },
        uTexSize: { value: [1, 1] },
        uMode: { value: 1 },
        uPattern: { value: 0 },
        uSeed: { value: 1 },
        uAngle: { value: Math.PI / 4 },
        uFade: { value: 0 },
        uLighten: { value: 0 },
        uDrift: { value: 0 },
        uShadow: { value: 0 },
        uShadowMouse: { value: [0.5, 0.5] },
      },
    })
    this.blank = new Texture(this.gl, { image: new Uint8Array([255, 255, 255, 255]), width: 1, height: 1, generateMipmaps: false })
    this.program.uniforms.uTex!.value = this.blank
    this.mesh = new Mesh(this.gl, { geometry: new Triangle(this.gl), program: this.program })

    this.io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const plane = [...this.planes].find(p => p.el === entry.target)
        if (!plane) continue
        plane.visible = entry.isIntersecting
        if (plane.visible) {
          if (plane.src && !plane.texture) this.loadTexture(plane)
          if (!plane.revealed) this.reveal(plane)
        }
      }
      this.updateLoop()
    }, { rootMargin: '15% 0px 15% 0px' })

    window.addEventListener('resize', this.onResize, { passive: true })
    document.addEventListener('visibilitychange', this.updateLoop)
  }

  onResize = () => {
    this.resize()
    if (!this.running) this.render()
  }

  resize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.canvas.style.width = '100vw'
    this.canvas.style.height = '100vh'
  }

  reveal(plane: PlaneState) {
    plane.revealed = true
    gsap.to(plane.u, { reveal: 1, duration: 1.8, ease: 'power3.out', delay: 0.05 })
  }

  loadTexture(plane: PlaneState) {
    if (!plane.src) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    const texture = new Texture(this.gl, { generateMipmaps: false, minFilter: this.gl.LINEAR, magFilter: this.gl.LINEAR })
    plane.texture = texture
    img.onload = () => {
      if (plane.texture !== texture) return
      texture.image = img
      plane.u.texSize = [img.naturalWidth, img.naturalHeight]
      plane.hasTex = true
      plane.u.mode = 0
    }
    img.onerror = () => {
      // Missing/blocked image: fall back to a procedural pattern
      plane.u.mode = 1
      plane.onError?.()
    }
    img.src = plane.src
  }

  add(opts: PlaneOptions): HalftonePlane {
    const el = opts.el
    const plane: PlaneState = {
      el,
      visible: false,
      revealed: false,
      texture: null,
      hasTex: false,
      src: opts.src || undefined,
      onError: opts.onError,
      u: {
        dot: opts.dot ?? 8,
        ink: opts.ink ?? hexToRgb('#1A26AE'),
        paper: opts.paper ?? hexToRgb('#E8E6E1'),
        contrast: opts.contrast ?? 1.15,
        reveal: 0,
        hover: 0,
        mouse: [0.5, 0.5],
        mode: 1, // procedural until a texture loads
        pattern: PATTERNS[opts.pattern ?? 'flow'],
        seed: opts.seed ?? 1,
        angle: opts.angle ?? Math.PI / 4,
        animate: opts.animate ?? true,
        fade: opts.fade ?? 0,
        lighten: opts.lighten ?? 0,
        drift: opts.drift ?? 0,
        shadow: opts.shadow ?? 0,
        shadowAmt: 0,
        shadowMouse: [0.5, 0.5],
        texSize: [1, 1],
      },
      shadowTarget: [0.5, 0.5],
      cleanup: () => {},
    }

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      plane.u.mouse = [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height]
    }
    const onEnter = () => gsap.to(plane.u, { hover: 1, duration: 0.6, ease: 'power2.out' })
    const onLeave = () => gsap.to(plane.u, { hover: 0, duration: 0.8, ease: 'power2.out' })
    // Cursor shadow: listen on window, because overlaid content (nav, headline) sits
    // above the plane and would swallow its own pointer events.
    let inside = false
    const onWinMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width
      const y = 1 - (e.clientY - r.top) / r.height
      const now = x >= 0 && x <= 1 && y >= 0 && y <= 1
      if (now && !inside) {
        // Start the shadow where the cursor enters instead of sliding in from the centre
        if (plane.u.shadowAmt < 0.05) plane.u.shadowMouse = [x, y]
        gsap.to(plane.u, { shadowAmt: 1, duration: 0.8, ease: 'power2.out' })
      }
      else if (!now && inside) gsap.to(plane.u, { shadowAmt: 0, duration: 1, ease: 'power2.out' })
      inside = now
      plane.shadowTarget = [x, y]
    }
    const onWinLeave = () => {
      inside = false
      gsap.to(plane.u, { shadowAmt: 0, duration: 1, ease: 'power2.out' })
    }
    const useShadow = !this.isMobile && plane.u.shadow > 0
    if (useShadow) {
      window.addEventListener('pointermove', onWinMove, { passive: true })
      document.documentElement.addEventListener('pointerleave', onWinLeave)
    }
    if (!this.isMobile) {
      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerenter', onEnter)
      el.addEventListener('pointerleave', onLeave)
    }
    plane.cleanup = () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointerleave', onLeave)
      if (useShadow) {
        window.removeEventListener('pointermove', onWinMove)
        document.documentElement.removeEventListener('pointerleave', onWinLeave)
      }
      gsap.killTweensOf(plane.u)
    }

    this.planes.add(plane)
    this.io.observe(el)

    return {
      set: (o) => {
        if (o.ink) plane.u.ink = o.ink
        if (o.paper) plane.u.paper = o.paper
        if (o.dot != null) plane.u.dot = o.dot
        if (o.contrast != null) plane.u.contrast = o.contrast
        if (o.angle != null) plane.u.angle = o.angle
        if (o.seed != null) plane.u.seed = o.seed
        if (o.animate != null) plane.u.animate = o.animate
        if (o.fade != null) plane.u.fade = o.fade
        if (o.drift != null) plane.u.drift = o.drift
        if (o.shadow != null) plane.u.shadow = o.shadow
        if (o.pattern) plane.u.pattern = PATTERNS[o.pattern]
        if (o.src !== undefined && (o.src || undefined) !== plane.src) {
          plane.src = o.src || undefined
          plane.texture = null
          plane.hasTex = false
          plane.u.mode = 1
          if (plane.src && plane.visible) this.loadTexture(plane)
        }
        if (!this.running) this.render()
      },
      destroy: () => {
        this.io.unobserve(el)
        plane.cleanup()
        this.planes.delete(plane)
        this.updateLoop()
        if (!this.running) this.render()
      },
    }
  }

  updateLoop = () => {
    const shouldRun = !document.hidden && [...this.planes].some(p => p.visible)
    if (shouldRun && !this.running) {
      gsap.ticker.add(this.tick)
      this.running = true
    }
    else if (!shouldRun && this.running) {
      gsap.ticker.remove(this.tick)
      this.running = false
      this.render() // final clear
    }
  }

  tick = () => this.render()

  render() {
    const gl = this.gl
    const W = gl.canvas.width
    const H = gl.canvas.height
    gl.disable(gl.SCISSOR_TEST)
    gl.viewport(0, 0, W, H)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.enable(gl.SCISSOR_TEST)

    const time = (performance.now() - this.start) / 1000
    const dt = Math.min(0.1, Math.max(0, time - this.lastTime))
    this.lastTime = time
    // Lag: ease the shadow toward the cursor (about 90% of the way in ~0.6s)
    const follow = 1 - Math.exp(-dt * 3.8)
    const vh = window.innerHeight
    const vw = window.innerWidth
    const dpr = this.dpr
    const uni = this.program.uniforms

    for (const p of this.planes) {
      if (!p.visible) continue
      const r = p.el.getBoundingClientRect()
      if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw || r.width < 1 || r.height < 1) continue
      if (p.el.offsetParent === null && getComputedStyle(p.el).position !== 'fixed') continue

      const x = Math.round(r.left * dpr)
      const y = Math.round((vh - r.bottom) * dpr)
      const w = Math.round(r.width * dpr)
      const h = Math.round(r.height * dpr)
      gl.viewport(x, y, w, h)
      gl.scissor(Math.max(0, x), Math.max(0, y), Math.min(w, W - Math.max(0, x)), Math.min(h, H - Math.max(0, y)))

      uni.uRes!.value = [w, h]
      uni.uDot!.value = p.u.dot * dpr
      uni.uInk!.value = p.u.ink
      uni.uPaper!.value = p.u.paper
      uni.uContrast!.value = p.u.contrast
      uni.uReveal!.value = p.u.reveal
      uni.uHover!.value = p.u.hover
      uni.uMouse!.value = p.u.mouse
      uni.uTime!.value = p.u.animate ? time + p.u.seed * 10 : p.u.seed * 10
      uni.uMode!.value = p.hasTex ? p.u.mode : 1
      uni.uPattern!.value = p.u.pattern
      uni.uSeed!.value = p.u.seed
      uni.uAngle!.value = p.u.angle
      uni.uFade!.value = p.u.fade
      uni.uLighten!.value = p.u.lighten
      uni.uDrift!.value = p.u.drift
      if (p.u.shadow > 0) {
        const m = p.u.shadowMouse
        m[0] += (p.shadowTarget[0] - m[0]) * follow
        m[1] += (p.shadowTarget[1] - m[1]) * follow
      }
      uni.uShadow!.value = p.u.shadow * p.u.shadowAmt
      uni.uShadowMouse!.value = p.u.shadowMouse
      uni.uTexSize!.value = p.u.texSize
      uni.uTex!.value = p.hasTex && p.texture ? p.texture : this.blank
      this.mesh.draw()
    }
  }
}

let engine: HalftoneEngine | null = null
let supported: boolean | null = null

/** WebGL available AND the user has not asked for reduced motion. */
export function halftoneSupported(): boolean {
  if (import.meta.server) return false
  if (supported !== null) return supported
  if (prefersReducedMotion()) return (supported = false)
  try {
    const c = document.createElement('canvas')
    supported = !!(c.getContext('webgl') || c.getContext('experimental-webgl'))
  }
  catch {
    supported = false
  }
  return supported
}

export function useHalftone() {
  return {
    supported: halftoneSupported,
    createPlane(opts: PlaneOptions): HalftonePlane | null {
      if (!halftoneSupported()) return null
      try {
        engine ??= new HalftoneEngine()
      }
      catch (err) {
        console.warn('[halftone] WebGL init failed, using fallback', err)
        supported = false
        return null
      }
      return engine.add(opts)
    },
  }
}
