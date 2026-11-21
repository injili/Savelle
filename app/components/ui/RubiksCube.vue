<script setup lang="ts">
import { Quat, Transform, Vec3 } from 'ogl'

/**
 * A 3×3×3 twisting cube drawn on a 2D canvas: every visible face is white with a blue
 * stroke of one fixed screen width, so every line matches the site's hairlines.
 * Outer layers turn one at a time like a real puzzle, at random intervals; every few
 * seconds the whole cube also tumbles a quarter turn. It floats and leans toward the
 * cursor with a lag. Decorative only.
 * Reduced motion: renders a still cube.
 */
const props = withDefaults(defineProps<{
  /** seconds per quarter turn (varies ±25%) */
  turnDuration?: number
  /** longest pause between layer turns, seconds (the actual pause is random) */
  maxPause?: number
  /** stroke width in CSS px */
  stroke?: number
  /** space between pieces, as a fraction of a piece */
  gap?: number
}>(), { turnDuration: 0.6, maxPause: 2.6, stroke: 1, gap: 0.14 })

const el = ref<HTMLCanvasElement | null>(null)

const AXES = { x: new Vec3(1, 0, 0), y: new Vec3(0, 1, 0), z: new Vec3(0, 0, 1) } as const
type Axis = keyof typeof AXES
const IDX: Record<Axis, 0 | 1 | 2> = { x: 0, y: 1, z: 2 }

// One cubie: 8 corners of a unit cube and its 6 faces (corner indices, in order round the face)
const H = (1 - props.gap) / 2
const CORNERS = [-1, 1].flatMap(x => [-1, 1].flatMap(y => [-1, 1].map(z => new Vec3(x * H, y * H, z * H))))
const FACES = [
  [0, 1, 3, 2], [4, 6, 7, 5], // x- / x+
  [0, 4, 5, 1], [2, 3, 7, 6], // y- / y+
  [0, 2, 6, 4], [1, 5, 7, 3], // z- / z+
]

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

let cleanup: (() => void) | undefined

onMounted(() => {
  const canvas = el.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const INK = getComputedStyle(document.documentElement).getPropertyValue('--color-ink').trim() || '#1a26ae'

  // Camera on +z looking at the origin, 28° vertical field of view.
  // Closest distance at which the cube's bounding sphere (radius ≈ 2.6, plus the bob)
  // still fits the view, so no tumble angle can ever clip it: 2.64 / sin(14°) ≈ 10.9
  const FOV = 28 * Math.PI / 180
  const CAM_Z = 10.9
  let camZ = CAM_Z
  let W = 0
  let Hh = 0

  const cube = new Transform()

  interface Cubie { mesh: Transform, pos: Vec3, q: Quat }
  const cubies: Cubie[] = []
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (!x && !y && !z) continue // the centre piece is never visible
        const mesh = new Transform()
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
  const box = canvas.parentElement ?? canvas
  const resize = () => {
    W = box.clientWidth
    Hh = box.clientHeight
    if (!W || !Hh) return
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(Hh * dpr)
    canvas.style.width = `${W}px`
    canvas.style.height = `${Hh}px`
    // Fit by width too: in a tall, narrow box pull the camera back so the cube never clips
    camZ = W / Hh < 1 ? CAM_Z / (W / Hh) : CAM_Z
    if (still) draw()
  }
  const ro = new ResizeObserver(resize)

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

    draw()
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

  // --- Draw ----------------------------------------------------------------
  // Pieces are separate cubes with gaps between them, so each is painted whole (its
  // camera-facing sides) from farthest to nearest. During a turn the farther of the two
  // groups (turning layer / the rest) is painted first.
  const tmp = new Vec3()
  const pts: Array<[number, number, number]> = Array.from({ length: 8 }, () => [0, 0, 0])

  function viewZ(c: Cubie) {
    return (c.mesh.worldMatrix[14] ?? 0) - camZ
  }

  function drawCubie(c: Cubie, focal: number) {
    if (!ctx) return
    CORNERS.forEach((p, i) => {
      tmp.copy(p).applyMatrix4(c.mesh.worldMatrix)
      const pt = pts[i]!
      pt[0] = tmp.x
      pt[1] = tmp.y
      pt[2] = tmp.z - camZ
    })
    const m = c.mesh.worldMatrix
    const cx = m[12] ?? 0
    const cy = m[13] ?? 0
    const cz = (m[14] ?? 0) - camZ
    FACES.forEach((f) => {
      // centre of the face; visible when its outward side faces the camera (view origin)
      let fx = 0, fy = 0, fz = 0
      for (const i of f) {
        fx += pts[i]![0] / 4
        fy += pts[i]![1] / 4
        fz += pts[i]![2] / 4
      }
      if ((fx - cx) * -fx + (fy - cy) * -fy + (fz - cz) * -fz <= 0) return
      ctx.beginPath()
      f.forEach((i, k) => {
        const p = pts[i]!
        const sx = W / 2 + (p[0] / -p[2]) * focal
        const sy = Hh / 2 - (p[1] / -p[2]) * focal
        if (k) ctx.lineTo(sx, sy)
        else ctx.moveTo(sx, sy)
      })
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    })
  }

  function draw() {
    if (!ctx || !W || !Hh) return
    const focal = (Hh / 2) / Math.tan(FOV / 2)
    cube.updateMatrixWorld(true)

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, Hh)
    ctx.lineWidth = props.stroke
    ctx.lineJoin = 'round'
    ctx.strokeStyle = INK
    ctx.fillStyle = '#ffffff'

    const members = turn ? turn.members : []
    const rest = turn ? cubies.filter(c => !members.includes(c)) : cubies
    const mean = (list: Cubie[]) => list.reduce((s, c) => s + viewZ(c), 0) / (list.length || 1)
    const groups = members.length && mean(members) < mean(rest) ? [members, rest] : [rest, members]
    for (const g of groups) {
      for (const c of [...g].sort((a, b) => viewZ(a) - viewZ(b))) drawCubie(c, focal)
    }
  }

  ro.observe(box)
  resize()
  frame()

  cleanup = () => {
    cancelAnimationFrame(raf)
    io.disconnect()
    ro.disconnect()
    document.removeEventListener('visibilitychange', onVis)
    window.removeEventListener('pointermove', onMove)
  }
})

onBeforeUnmount(() => cleanup?.())
</script>

<template>
  <div class="h-full w-full">
    <canvas ref="el" class="block" aria-hidden="true" />
  </div>
</template>
