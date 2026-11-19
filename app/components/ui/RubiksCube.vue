<script setup lang="ts">
import { Camera, Geometry, Mesh, Program, Quat, Renderer, Transform, Vec3 } from 'ogl'

/**
 * A 3×3×3 twisting cube: every outward face is flat white and every inward face is the
 * site blue, so the blue showing through the gaps (and inside a turning layer) draws it.
 * Outer layers turn one at a time like a real puzzle, at random intervals; every few
 * seconds the whole cube also tumbles a quarter turn. It floats and leans toward the
 * cursor with a lag. Decorative only.
 * Reduced motion: renders a still cube. No WebGL: renders nothing.
 */
const props = withDefaults(defineProps<{
  /** seconds per quarter turn (varies ±25%) */
  turnDuration?: number
  /** longest pause between layer turns, seconds (the actual pause is random) */
  maxPause?: number
}>(), { turnDuration: 0.6, maxPause: 2.6 })

const el = ref<HTMLCanvasElement | null>(null)

const vertex = /* glsl */ `
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
attribute float style;
attribute vec4 edge; // which of this face's sides lie on the cube's outer edge (u-, u+, v-, v+)
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
varying vec3 vN;
varying vec2 vUv;
varying float vStyle;
varying vec4 vEdge;
void main() {
  vEdge = edge;
  vN = normalize(normalMatrix * normal);
  vUv = uv;
  vStyle = style;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

// style: 0 = outward face (flat white), -1 = inward face (flat blue: shows in the gaps
// and inside a turning layer, which is what outlines the pieces on the white page)
const fragment = /* glsl */ `
precision highp float;
uniform vec3 uWhite;
uniform vec3 uBlue;
varying float vStyle;
varying vec2 vUv;
varying vec4 vEdge;

void main() {
  if (vStyle < -0.5) { gl_FragColor = vec4(uBlue, 1.0); return; }
  // Blue line along the cube's outer edges, about as wide as a gap between pieces
  const float w = 0.045;
  float line = max(
    max(vEdge.x * step(vUv.x, w), vEdge.y * step(1.0 - w, vUv.x)),
    max(vEdge.z * step(vUv.y, w), vEdge.w * step(1.0 - w, vUv.y))
  );
  gl_FragColor = vec4(mix(uWhite, uBlue, line), 1.0);
}
`

const AXES = { x: new Vec3(1, 0, 0), y: new Vec3(0, 1, 0), z: new Vec3(0, 0, 1) } as const
type Axis = keyof typeof AXES
const IDX: Record<Axis, 0 | 1 | 2> = { x: 0, y: 1, z: 2 }

function cubieGeometry(gl: Renderer['gl'], cp: [number, number, number]) {
  const h = 0.47 // gaps wide enough for the blue inner faces to draw clean lines
  const position: number[] = []
  const normal: number[] = []
  const uv: number[] = []
  const style: number[] = []
  const edge: number[] = []
  const index: number[] = []
  const faces: Array<{ n: [number, number, number], u: [number, number, number], v: [number, number, number] }> = [
    { n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0] },
    { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
    { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1] },
    { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
    { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
    { n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0] },
  ]
  for (const { n, u, v } of faces) {
    const outer = n[0] * cp[0] + n[1] * cp[1] + n[2] * cp[2] === 1
    const st = outer ? 0 : -1
    // A side of an outer face is on the cube's edge when this piece is at the extreme
    // in that direction. Turns preserve this, so the flags never need updating.
    const du = u[0] * cp[0] + u[1] * cp[1] + u[2] * cp[2]
    const dv = v[0] * cp[0] + v[1] * cp[1] + v[2] * cp[2]
    const flags = outer ? [du === -1 ? 1 : 0, du === 1 ? 1 : 0, dv === -1 ? 1 : 0, dv === 1 ? 1 : 0] : [0, 0, 0, 0]
    const base = position.length / 3
    for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
      for (let i = 0; i < 3; i++) position.push((n[i]! + a * u[i]! + b * v[i]!) * h)
      normal.push(...n)
      uv.push((a + 1) / 2, (b + 1) / 2)
      style.push(st)
      edge.push(...flags)
    }
    index.push(base, base + 1, base + 2, base, base + 2, base + 3)
  }
  return new Geometry(gl, {
    position: { size: 3, data: new Float32Array(position) },
    normal: { size: 3, data: new Float32Array(normal) },
    uv: { size: 2, data: new Float32Array(uv) },
    style: { size: 1, data: new Float32Array(style) },
    edge: { size: 4, data: new Float32Array(edge) },
    index: { data: new Uint16Array(index) },
  })
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

let cleanup: (() => void) | undefined

onMounted(() => {
  const canvas = el.value
  if (!canvas) return
  let renderer: Renderer
  try {
    renderer = new Renderer({ canvas, alpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio || 1, 2) })
  }
  catch {
    return // no WebGL: the hero still works without the cube
  }
  const gl = renderer.gl
  gl.clearColor(0, 0, 0, 0)

  const camera = new Camera(gl, { fov: 28 })
  // Closest distance at which the cube's bounding sphere (radius ≈ 2.57, plus the bob)
  // still fits the 28° view, so no tumble angle can ever clip it: 2.64 / sin(14°) ≈ 10.9
  const CAM_Z = 10.9
  camera.position.set(0, 0, CAM_Z)

  const scene = new Transform()
  const cube = new Transform()
  cube.setParent(scene)

  const rgb = (hex: string) => {
    const n = Number.parseInt(hex.slice(1), 16)
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
  }
  const program = new Program(gl, {
    vertex,
    fragment,
    cullFace: false,
    uniforms: {
      uWhite: { value: rgb('#FFFFFF') }, // same white as the hero type
      uBlue: { value: rgb('#1A26AE') }, // the site blue
    },
  })

  interface Cubie { mesh: Mesh, pos: Vec3, q: Quat }
  const cubies: Cubie[] = []
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (!x && !y && !z) continue
        const mesh = new Mesh(gl, { geometry: cubieGeometry(gl, [x, y, z]), program })
        mesh.setParent(cube)
        mesh.position.set(x, y, z)
        cubies.push({ mesh, pos: new Vec3(x, y, z), q: new Quat() })
      }
    }
  }

  // --- Layer turns -------------------------------------------------------
  interface Turn { axis: Axis, layer: number, dir: number, start: number, dur: number, members: Cubie[] }
  let turn: Turn | null = null
  let nextTurnAt = 0.6
  let last: { axis: Axis, layer: number } | null = null
  const qT = new Quat()

  function startTurn(now: number) {
    let axis: Axis, layer: number
    do {
      axis = (['x', 'y', 'z'] as const)[Math.floor(Math.random() * 3)]!
      layer = Math.random() < 0.5 ? -1 : 1
    } while (last && last.axis === axis && last.layer === layer) // never undo the previous move
    last = { axis, layer }
    const i = IDX[axis]
    turn = {
      axis,
      layer,
      dir: Math.random() < 0.5 ? -1 : 1,
      start: now,
      dur: props.turnDuration * (0.75 + Math.random() * 0.5),
      members: cubies.filter(c => Math.round(c.pos[i] ?? 0) === layer),
    }
  }

  function applyTurn(t: Turn, k: number) {
    qT.fromAxisAngle(AXES[t.axis], t.dir * (Math.PI / 2) * k)
    for (const c of t.members) {
      const p = c.pos.clone().applyQuaternion(qT)
      c.mesh.position.set(p.x, p.y, p.z)
      c.mesh.quaternion.multiply(qT, c.q)
    }
  }

  function finishTurn(t: Turn) {
    applyTurn(t, 1)
    for (const c of t.members) {
      const p = c.mesh.position
      c.pos.set(Math.round(p.x), Math.round(p.y), Math.round(p.z))
      c.mesh.position.set(c.pos.x, c.pos.y, c.pos.z)
      c.q.copy(c.mesh.quaternion).normalize()
    }
  }

  // --- Pointer lean (lagged) ---------------------------------------------
  const lean = { x: 0, y: 0, tx: 0, ty: 0 }
  const onMove = (e: PointerEvent) => {
    lean.tx = (e.clientX / window.innerWidth - 0.5) * 2
    lean.ty = (e.clientY / window.innerHeight - 0.5) * 2
  }
  const finePointer = window.matchMedia('(pointer: fine)').matches
  if (finePointer) window.addEventListener('pointermove', onMove, { passive: true })

  // --- Size / loop ---------------------------------------------------------
  // Measure the wrapper: OGL writes an inline px size onto the canvas itself
  const box = canvas.parentElement ?? canvas
  const resize = () => {
    const w = box.clientWidth
    const h = box.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h)
    camera.perspective({ aspect: w / h })
    // Fit by width too: in a tall, narrow box pull the camera back so the cube never clips
    camera.position.z = w / h < 1 ? CAM_Z / (w / h) : CAM_Z
  }
  const ro = new ResizeObserver(resize)
  ro.observe(box)
  resize()

  // --- Whole-cube tumbles at random intervals --------------------------------
  const spin = { x: 0, y: 0, fromX: 0, fromY: 0, toX: 0, toY: 0, start: 0, dur: 1.6, next: 3 + Math.random() * 3 }
  function updateSpin(now: number) {
    if (now >= spin.next) {
      spin.fromX = spin.toX
      spin.fromY = spin.toY
      const q = Math.PI / 2 * (Math.random() < 0.5 ? -1 : 1)
      if (Math.random() < 0.6) spin.toY += q
      else spin.toX += q
      spin.start = now
      spin.dur = 1.3 + Math.random() * 0.8
      spin.next = now + spin.dur + 3 + Math.random() * 5
    }
    const k = easeInOut(Math.min(1, Math.max(0, (now - spin.start) / spin.dur)))
    spin.x = spin.fromX + (spin.toX - spin.fromX) * k
    spin.y = spin.fromY + (spin.toY - spin.fromY) * k
  }

  const still = prefersReducedMotion()
  let raf = 0
  let visible = true
  let lastT = performance.now() / 1000
  let clock = 0

  // A few quiet turns up front so the cube starts mixed (and so the still version is too)
  for (let n = 0; n < 7; n++) {
    startTurn(0)
    finishTurn(turn!)
    turn = null
  }

  function frame() {
    const nowS = performance.now() / 1000
    const dt = Math.min(0.1, nowS - lastT)
    lastT = nowS
    clock += dt

    if (!still) {
      if (!turn && clock >= nextTurnAt) startTurn(clock)
      if (turn) {
        const k = Math.min(1, (clock - turn.start) / turn.dur)
        if (k >= 1) {
          finishTurn(turn)
          turn = null
          // Random rhythm: sometimes a quick follow-up, otherwise a pause of varying length
          nextTurnAt = clock + (Math.random() < 0.3 ? 0.06 : 0.3 + Math.random() * (props.maxPause - 0.3))
        }
        else applyTurn(turn, easeInOut(k))
      }
    }

    const f = 1 - Math.exp(-dt * 2.5)
    lean.x += (lean.tx - lean.x) * f
    lean.y += (lean.ty - lean.y) * f
    const t = still ? 0 : clock
    if (!still) updateSpin(clock)
    // Tilted onto a corner so it reads diagonally; slow drift, random tumbles, gentle bob
    cube.rotation.x = 0.52 + spin.x + Math.sin(t * 0.35) * 0.06 + lean.y * 0.22
    cube.rotation.y = -0.72 + spin.y + t * 0.05 + lean.x * 0.35
    cube.rotation.z = 0.22
    cube.position.y = Math.sin(t * 0.8) * 0.07

    renderer.render({ scene, camera })
    if (!still && visible) raf = requestAnimationFrame(frame)
  }

  const io = new IntersectionObserver(([entry]) => {
    const was = visible
    visible = !!entry?.isIntersecting && !document.hidden
    if (visible && !was && !still) {
      lastT = performance.now() / 1000
      raf = requestAnimationFrame(frame)
    }
  })
  io.observe(canvas)
  const onVis = () => {
    const was = visible
    visible = !document.hidden
    if (visible && !was && !still) {
      lastT = performance.now() / 1000
      raf = requestAnimationFrame(frame)
    }
  }
  document.addEventListener('visibilitychange', onVis)

  frame()

  cleanup = () => {
    cancelAnimationFrame(raf)
    io.disconnect()
    ro.disconnect()
    document.removeEventListener('visibilitychange', onVis)
    window.removeEventListener('pointermove', onMove)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
})

onBeforeUnmount(() => cleanup?.())
</script>

<template>
  <div class="h-full w-full">
    <canvas ref="el" class="block" aria-hidden="true" />
  </div>
</template>
