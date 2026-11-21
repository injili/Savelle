<script setup lang="ts">
import { Camera, Geometry, Mesh, Program, Raycast, Renderer, Texture, Transform, Vec2 } from 'ogl'

/**
 * A two-drawer filing cabinet drawn in the same language as the hero cube: every face
 * flat white, every edge a blue line of one fixed screen width (1 CSS px), hidden edges
 * occluded by the faces in front; tab numbers and sheet titles in the site mono. The lower drawer
 * slides open when the cabinet first comes into view, showing numbered folders. The
 * folder at `active` lifts out, drifts forward and falls a little ajar (front flap tips
 * forward, the sheet inside rises). The cabinet leans toward the cursor with a lag.
 * Clicking a folder emits `select`. Decorative: the accordion beside it is the real control.
 * Reduced motion: state changes snap, no drift. No WebGL: renders nothing.
 */
const props = withDefaults(defineProps<{
  /** index of the raised folder; -1 = none */
  active?: number
  /** number of folders in the box */
  count?: number
  /** folders that can be clicked (the rest stay put) */
  selectable?: number
  /** what's written on each folder's sheet (folders past the end get a blank page) */
  sheets?: ReadonlyArray<{ title: string, body: string, tab?: string, kicker?: string }>
}>(), { active: 0, count: 6, selectable: 6, sheets: () => [] })

const emit = defineEmits<{ select: [index: number] }>()

const el = ref<HTMLCanvasElement | null>(null)

// Faces: flat white (labels and sheet titles are cut from text atlases in blue)
const vertex = /* glsl */ `
attribute vec3 position;
attribute vec2 uv;
attribute float kind;  // 0 solid, 1 paper sheet, 2 label
attribute float cell;  // atlas row
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying vec2 vUv;
varying float vKind;
varying float vCell;
void main() {
  vUv = uv; vKind = kind; vCell = cell;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragment = /* glsl */ `
precision highp float;
uniform vec3 uWhite;
uniform vec3 uBlue;
uniform sampler2D uLabels;
uniform float uCells;
uniform sampler2D uSheets;
uniform float uSheetH;    // sheet atlas height, px
uniform float uSheetCell; // used height of each 512px-wide cell, px
varying vec2 vUv;
varying float vKind;
varying float vCell;

void main() {
  if (vKind > 1.5) {
    // Label: numerals cut from the atlas, nothing else
    float a = texture2D(uLabels, vec2(vUv.x, 1.0 - (vCell + 1.0 - vUv.y) / uCells)).a;
    if (a < 0.5) discard;
    gl_FragColor = vec4(uBlue, 1.0);
    return;
  }
  vec3 base = uWhite;
  // Paper sheet: its title, from the sheet atlas (2 columns of 512px cells)
  if (vKind > 0.5 && gl_FrontFacing) {
    float col = mod(vCell, 2.0);
    float row = floor(vCell / 2.0);
    vec2 st = vec2((col + vUv.x) * 0.5, 1.0 - (row * 512.0 + (1.0 - vUv.y) * uSheetCell) / uSheetH);
    base = mix(base, uBlue, texture2D(uSheets, st).a);
  }
  gl_FragColor = vec4(base, 1.0);
}
`

// Edges: each segment is a quad expanded in screen space to a fixed pixel width, so a
// line is the same thickness near or far, on a silhouette or between two faces.
// Nudged a hair toward the camera so it wins against the faces it borders.
const lineVertex = /* glsl */ `
attribute vec3 position;
attribute vec3 other;
attribute float side;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec2 uRes;   // drawing buffer size, device px
uniform float uWidth; // line width, device px
void main() {
  vec4 va = modelViewMatrix * vec4(position, 1.0);
  vec4 vb = modelViewMatrix * vec4(other, 1.0);
  va.z += 0.012;
  vb.z += 0.012;
  vec4 a = projectionMatrix * va;
  vec4 b = projectionMatrix * vb;
  vec2 sa = a.xy / a.w * uRes * 0.5;
  vec2 sb = b.xy / b.w * uRes * 0.5;
  vec2 dir = normalize(sb - sa + vec2(1e-6));
  vec2 n = vec2(-dir.y, dir.x);
  vec2 off = (n * side - dir) * uWidth * 0.5; // half width each side, plus a square cap
  a.xy += off / (uRes * 0.5) * a.w;
  gl_Position = a;
}
`

const lineFragment = /* glsl */ `
precision highp float;
uniform vec3 uBlue;
void main() {
  gl_FragColor = vec4(uBlue, 1.0);
}
`

type V3 = [number, number, number]

/** Accumulates flat quads into one geometry. */
class Builder {
  position: number[] = []
  uv: number[] = []
  kind: number[] = []
  cell: number[] = []
  index: number[] = []
  // edge segments (screen-space line quads)
  lPos: number[] = []
  lOther: number[] = []
  lSide: number[] = []
  lIndex: number[] = []

  segment(a: V3, b: V3) {
    const base = this.lPos.length / 3
    for (const [p, q, sd] of [[a, b, 1], [a, b, -1], [b, a, 1], [b, a, -1]] as const) {
      this.lPos.push(...p)
      this.lOther.push(...q)
      this.lSide.push(sd)
    }
    this.lIndex.push(base, base + 1, base + 2, base, base + 2, base + 3)
  }

  /** Corner `o`, axes `u`/`v` (unit), sizes `w`/`h`. Front face normal = u × v. */
  quad(o: V3, u: V3, v: V3, w: number, h: number, opts: { edges?: number[], kind?: number, cell?: number } = {}) {
    const base = this.position.length / 3
    const edges = opts.edges ?? [1, 1, 1, 1]
    const at = (a: number, b: number): V3 => [0, 1, 2].map(i => o[i]! + u[i]! * w * a + v[i]! * h * b) as V3
    for (const [a, b] of [[0, 0], [1, 0], [1, 1], [0, 1]] as const) {
      this.position.push(...at(a, b))
      this.uv.push(a, b)
      this.kind.push(opts.kind ?? 0)
      this.cell.push(opts.cell ?? 0)
    }
    this.index.push(base, base + 1, base + 2, base, base + 2, base + 3)
    // Outline (labels have none): sides u-, u+, v-, v+
    if ((opts.kind ?? 0) !== 2) {
      if (edges[0]) this.segment(at(0, 0), at(0, 1))
      if (edges[1]) this.segment(at(1, 0), at(1, 1))
      if (edges[2]) this.segment(at(0, 0), at(1, 0))
      if (edges[3]) this.segment(at(0, 1), at(1, 1))
    }
    return this
  }

  /** Axis-aligned block from corner `a` to `b`, faces pointing outward; `skip` drops faces. */
  cuboid(a: V3, b: V3, skip: Array<'front' | 'back' | 'left' | 'right' | 'top' | 'bottom'> = [], kind = 0) {
    const [x0, y0, z0] = a
    const [x1, y1, z1] = b
    const w = x1 - x0
    const h = y1 - y0
    const d = z1 - z0
    if (!skip.includes('front')) this.quad([x0, y0, z1], X, Y, w, h, { kind })
    if (!skip.includes('back')) this.quad([x1, y0, z0], NX, Y, w, h, { kind })
    if (!skip.includes('right')) this.quad([x1, y0, z1], NZ, Y, d, h, { kind })
    if (!skip.includes('left')) this.quad([x0, y0, z0], Z, Y, d, h, { kind })
    if (!skip.includes('top')) this.quad([x0, y1, z1], X, NZ, w, d, { kind })
    if (!skip.includes('bottom')) this.quad([x0, y0, z0], X, Z, w, d, { kind })
    return this
  }

  build(gl: Renderer['gl']) {
    return new Geometry(gl, {
      position: { size: 3, data: new Float32Array(this.position) },
      uv: { size: 2, data: new Float32Array(this.uv) },
      kind: { size: 1, data: new Float32Array(this.kind) },
      cell: { size: 1, data: new Float32Array(this.cell) },
      index: { data: new Uint16Array(this.index) },
    })
  }

  buildLines(gl: Renderer['gl']) {
    if (!this.lIndex.length) return null
    return new Geometry(gl, {
      position: { size: 3, data: new Float32Array(this.lPos) },
      other: { size: 3, data: new Float32Array(this.lOther) },
      side: { size: 1, data: new Float32Array(this.lSide) },
      index: { data: new Uint16Array(this.lIndex) },
    })
  }
}

const X: V3 = [1, 0, 0]
const NX: V3 = [-1, 0, 0]
const Y: V3 = [0, 1, 0]
const Z: V3 = [0, 0, 1]
const NZ: V3 = [0, 0, -1]

const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const easeOut = (t: number) => 1 - (1 - t) ** 3

let cleanup: (() => void) | undefined

onMounted(() => {
  const canvas = el.value
  if (!canvas) return
  let renderer: Renderer
  try {
    renderer = new Renderer({ canvas, alpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio || 1, 2) })
  }
  catch {
    return
  }
  const gl = renderer.gl
  gl.clearColor(0, 0, 0, 0)

  const camera = new Camera(gl, { fov: 28, near: 1, far: 60 })

  // --- Dimensions (world units) -------------------------------------------
  // Cabinet: front face on z = 0, standing on y = 0, two drawers
  const CW = 3.0 // cabinet width
  const CH = 4.0 // cabinet height
  const CD = 3.0 // cabinet depth
  const M = 0.12 // frame around and between the drawer openings
  const GAP = 0.045 // reveal between a drawer front and its opening
  const OH = (CH - 3 * M) / 2 // opening height
  const openY = [M, M * 2 + OH] // opening bottoms: [lower, upper]
  const DFT = 0.09 // drawer front thickness
  const DD = 2.5 // drawer box depth
  const DBH = 1.15 // drawer box wall height (lower than the front, like a real drawer)
  const OUT = 1.95 // how far the lower drawer pulls out
  // Folders
  const FW = CW - 2 * M - 0.5 // folder width (fits the drawer box)
  const BH = 1.8 // back panel height: peeks over the drawer front
  const FH = 1.64 // front panel height (lower, so the paper inside shows)
  const TW = 0.52 // tab
  const TH = 0.22
  const G = 0.026 // half the gap between a folder's two panels
  const LIFT = 1.75 // how far the active folder rises
  const N = Math.max(1, props.count)

  // --- Label atlas: "01".."0N" in the site mono -------------------------------
  const atlas = document.createElement('canvas')
  atlas.width = 256
  atlas.height = 100 * N
  const labels = new Texture(gl, { image: atlas, generateMipmaps: false })
  const drawLabels = () => {
    const ctx = atlas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, atlas.width, atlas.height)
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const mono = getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim() || 'monospace'
    ctx.font = `400 52px ${mono}`
    for (let i = 0; i < N; i++) ctx.fillText(props.sheets[i]?.tab ?? String(i + 1).padStart(2, '0'), 128, 100 * i + 54)
    labels.needsUpdate = true
  }
  drawLabels()

  // --- Sheet atlas: each folder's page, written out -----------------------------
  // Cells are 512px wide, cut to the sheet's proportions; atlas kept power-of-two for mipmaps
  const SW = FW - 0.3
  const SH = FH - 0.04
  const CELL_H = Math.round((512 * SH) / SW)
  const sheetRows = Math.ceil(N / 2)
  const sheetAtlas = document.createElement('canvas')
  sheetAtlas.width = 1024
  sheetAtlas.height = 2 ** Math.ceil(Math.log2(sheetRows * 512))
  const sheets = new Texture(gl, { image: sheetAtlas, generateMipmaps: true, minFilter: gl.LINEAR_MIPMAP_LINEAR })

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxW: number) => {
    const lines: string[] = []
    let line = ''
    for (const word of text.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word
      if (ctx.measureText(next).width > maxW && line) {
        lines.push(line)
        line = word
      }
      else line = next
    }
    if (line) lines.push(line)
    return lines
  }

  const drawSheets = () => {
    const ctx = sheetAtlas.getContext('2d')
    if (!ctx) return
    const css = getComputedStyle(document.documentElement)
    const mono = css.getPropertyValue('--font-mono').trim() || 'monospace'
    ctx.clearRect(0, 0, sheetAtlas.width, sheetAtlas.height)
    ctx.fillStyle = '#000' // only alpha is used: the shader inks it blue
    ctx.textBaseline = 'alphabetic'
    const PAD = 40
    const maxW = 512 - PAD * 2
    for (let i = 0; i < N; i++) {
      ctx.save()
      ctx.translate((i % 2) * 512, Math.floor(i / 2) * 512)
      ctx.beginPath()
      ctx.rect(0, 0, 512, CELL_H)
      ctx.clip()
      const sheet = props.sheets[i]
      let y = PAD + 16
      ctx.font = `400 17px ${mono}`
      ctx.fillText(sheet?.tab ?? String(i + 1).padStart(2, '0'), PAD, y)
      y += 44
      if (sheet) {
        ctx.font = `400 26px ${mono}`
        for (const l of wrapText(ctx, sheet.title.toUpperCase(), maxW)) {
          ctx.fillText(l, PAD, y)
          y += 36
        }
      }
      ctx.restore()
    }
    sheets.needsUpdate = true
  }
  drawSheets()

  document.fonts?.ready.then(() => {
    drawLabels()
    drawSheets()
    requestRender()
  })

  const rgb = (hex: string) => {
    const n = Number.parseInt(hex.slice(1), 16)
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
  }
  const program = new Program(gl, {
    vertex,
    fragment,
    cullFace: false,
    uniforms: {
      uWhite: { value: rgb('#FFFFFF') },
      uBlue: { value: rgb('#1A26AE') },
      uLabels: { value: labels },
      uCells: { value: N },
      uSheets: { value: sheets },
      uSheetH: { value: sheetAtlas.height },
      uSheetCell: { value: CELL_H },
    },
  })

  const lineProgram = new Program(gl, {
    vertex: lineVertex,
    fragment: lineFragment,
    cullFace: false,
    uniforms: {
      uBlue: { value: rgb('#1A26AE') },
      uRes: { value: [1, 1] },
      uWidth: { value: 1 },
    },
  })

  /** Faces + their outline, under `parent`. Returns the face mesh (used for picking). */
  function addMesh(b: Builder, parent: Transform) {
    const mesh = new Mesh(gl, { geometry: b.build(gl), program })
    mesh.setParent(parent)
    const lines = b.buildLines(gl)
    if (lines) new Mesh(gl, { geometry: lines, program: lineProgram, frustumCulled: false }).setParent(parent)
    return mesh
  }

  // --- Scene graph -----------------------------------------------------------
  const scene = new Transform()
  const rig = new Transform() // leans with the cursor
  rig.setParent(scene)
  const model = new Transform() // offset so the composition's middle sits on the pivot
  model.setParent(rig)
  model.position.set(0, -CH / 2, (CD - OUT) / 2 - 0.1) // centre of cabinet + pulled drawer

  // Cabinet body: open-fronted shell, then a front frame with a recess outlined behind
  // each opening (it shows as a thin reveal round each drawer front)
  const OW = CW - 2 * M // opening width
  const body = new Builder()
    .cuboid([-CW / 2, 0, -CD], [CW / 2, CH, 0], ['front'])
    .quad([-CW / 2, 0, 0], X, Y, CW, CH) // frame face (drawers and recesses sit in front)
  for (const y of openY) body.quad([-OW / 2, y, 0.004], X, Y, OW, OH)
  addMesh(body, model)

  // A drawer: front slab with a label holder and a pull handle, plus (if `withBox`) the box
  function drawer(y0: number, withBox: boolean) {
    const g = new Transform()
    g.setParent(model)
    const fw = OW - 2 * GAP
    const fh = OH - 2 * GAP
    const yb = y0 + GAP
    const b = new Builder()
      .cuboid([-fw / 2, yb, -DFT], [fw / 2, yb + fh, 0])
    // One plain pull, a slim block on the drawer front
    const hy = yb + fh * 0.55
    b.cuboid([-0.45, hy - 0.05, 0], [0.45, hy + 0.05, 0.09])
    if (withBox) {
      const bw = fw / 2 - 0.1
      b.cuboid([-bw, yb + 0.06, -DFT - DD], [bw, yb + 0.06 + DBH, -DFT], ['top', 'front'])
    }
    addMesh(b, g)
    return g
  }
  const PROUD = 0.03 // drawer fronts sit just in front of the paper recesses
  drawer(openY[1]!, false).position.z = PROUD // top drawer, closed
  const openDrawer = drawer(openY[0]!, true)
  const floorY = openY[0]! + GAP + 0.06 // folders stand on the drawer box floor
  let drawerK = 0 // 0 = shut, 1 = pulled out

  interface Folder {
    group: Transform
    back: Transform
    front: Transform
    paper: Transform
    z: number
    k: number // 0 = filed, 1 = raised and ajar
    hover: number
    hits: Mesh[]
  }
  const folders: Folder[] = []
  const pickable: Mesh[] = []
  // Folders ride in the lower drawer (its local z: front face 0, box behind), filed in
  // the part that pulls out past the cabinet
  const zFront = -DFT - 0.3
  const zBack = -(OUT - 0.35)
  const zShow = -DFT - (OUT - DFT) * 0.5 // where a raised folder settles
  for (let i = 0; i < N; i++) {
    const z = N === 1 ? zShow : zFront + (zBack - zFront) * (i / (N - 1))
    const group = new Transform()
    group.setParent(openDrawer)
    group.position.set(0, floorY, z)

    // Tabs step left to right from the front folder back, so every number shows
    const tabX = N === 1 ? 0 : -FW / 2 + TW / 2 + 0.12 + (FW - TW - 0.24) * (i / (N - 1))

    // Back panel + tab: outward face points away from us, so the inside (paper) faces us
    const back = new Transform()
    back.setParent(group)
    back.position.z = -G
    const backMesh = addMesh(
      new Builder()
        .quad([FW / 2, 0, 0], NX, Y, FW, BH)
        .quad([tabX + TW / 2, BH - 0.001, 0], NX, Y, TW, TH, { edges: [1, 1, 0, 1] })
        .quad([tabX - TW / 2, BH - 0.001, 0.004], X, Y, TW, TH, { kind: 2, cell: i }),
      back,
    )

    // Sheet inside
    const paper = new Transform()
    paper.setParent(group)
    addMesh(new Builder().quad([-SW / 2, 0.06, 0], X, Y, SW, SH, { kind: 1, cell: i }), paper)

    // Front flap, hinged at the bottom so it can tip open toward us
    const front = new Transform()
    front.setParent(group)
    front.position.z = G
    const frontMesh = addMesh(new Builder().quad([-FW / 2, 0, 0], X, Y, FW, FH), front)

    const f: Folder = { group, back, front, paper, z, k: 0, hover: 0, hits: [backMesh, frontMesh] }
    folders.push(f)
    if (i < props.selectable) for (const m of f.hits) {
      ;(m as Mesh & { folder?: number }).folder = i
      pickable.push(m)
    }
  }

  function poseFolder(f: Folder, t: number) {
    const up = easeInOut(clamp01(f.k / 0.6)) // rise first...
    const slide = easeInOut(clamp01((f.k - 0.35) / 0.45)) // ...then drift to the middle...
    const ajar = easeOut(clamp01((f.k - 0.6) / 0.4)) // ...then fall open
    f.group.position.y = floorY + LIFT * up + f.hover * 0.1 * (1 - up) + Math.sin(t * 1.3) * 0.03 * ajar
    f.group.position.z = f.z + (zShow - f.z) * slide
    f.group.rotation.x = 0.12 * ajar
    f.front.rotation.x = 0.5 * ajar
    f.back.rotation.x = -0.1 * ajar
    f.paper.position.y = 0.22 * ajar
    f.paper.rotation.x = 0.06 * ajar
  }

  // --- Pointer: lean + hover/click picking ------------------------------------
  const lean = { x: 0, y: 0, tx: 0, ty: 0 }
  const mouse = new Vec2(-9, -9)
  const ray = new Raycast()
  let hovered = -1
  const finePointer = window.matchMedia('(pointer: fine)').matches

  const pick = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect()
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    ray.castMouse(camera, mouse)
    const hit = ray.intersectBounds(pickable)[0] as (Mesh & { folder?: number }) | undefined
    return hit?.folder ?? -1
  }
  const onMove = (e: PointerEvent) => {
    lean.tx = (e.clientX / window.innerWidth - 0.5) * 2
    lean.ty = (e.clientY / window.innerHeight - 0.5) * 2
    requestRender()
  }
  const onCanvasMove = (e: PointerEvent) => {
    hovered = pick(e)
    canvas.style.cursor = hovered >= 0 ? 'pointer' : ''
    requestRender()
  }
  const onLeave = () => {
    hovered = -1
    canvas.style.cursor = ''
    requestRender()
  }
  const onClick = (e: PointerEvent) => {
    const i = pick(e)
    if (i >= 0) emit('select', i)
  }
  if (finePointer) {
    window.addEventListener('pointermove', onMove, { passive: true })
    canvas.addEventListener('pointermove', onCanvasMove, { passive: true })
    canvas.addEventListener('pointerleave', onLeave)
  }
  canvas.addEventListener('click', onClick)

  // --- Size --------------------------------------------------------------------
  const RADIUS = 3.2 // fits cabinet + open drawer + raised folder at this view, plus lean
  const wrap = canvas.parentElement ?? canvas
  const resize = () => {
    const w = wrap.clientWidth
    const h = wrap.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h)
    lineProgram.uniforms.uRes.value = [gl.drawingBufferWidth, gl.drawingBufferHeight]
    lineProgram.uniforms.uWidth.value = renderer.dpr // 1 CSS px, like the hero cube and hairlines
    const aspect = w / h
    camera.perspective({ aspect })
    const half = Math.min(14, (Math.atan(Math.tan((14 * Math.PI) / 180) * aspect) * 180) / Math.PI)
    // Phones: frame tighter so the cabinet fills the (square) box; the lean is smaller there
    const radius = w < 640 ? RADIUS * 0.92 : RADIUS
    // ...and nudge the view down (cabinet up): the pulled drawer reaches lower than the top
    camera.position.set(0, w < 640 ? -0.35 : 0, radius / Math.sin((half * Math.PI) / 180))
    requestRender()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(wrap)

  // --- Loop ----------------------------------------------------------------------
  const still = prefersReducedMotion()
  let raf = 0
  let visible = true
  let lastT = performance.now() / 1000
  let clock = 0

  function frame() {
    raf = 0
    const nowS = performance.now() / 1000
    const dt = Math.min(0.1, nowS - lastT)
    lastT = nowS
    clock += dt
    const t = still ? 0 : clock

    const busy = !still
    // The lower drawer slides open shortly after the cabinet first comes into view
    drawerK = still ? 1 : clamp01(drawerK + (clock > 0.35 ? dt / 1.2 : 0))
    openDrawer.position.z = PROUD + OUT * easeInOut(drawerK)
    folders.forEach((f, i) => {
      // A folder only lifts once the drawer is (nearly) out
      const target = i === props.active && drawerK > 0.85 ? 1 : 0
      const hTarget = i === hovered && i !== props.active ? 1 : 0
      if (still) {
        f.k = target
        f.hover = 0
      }
      else {
        // Down moves a touch faster than up so the swap never stacks two folders mid-air
        const rate = target > f.k ? 1 / 1.1 : 1 / 0.8
        f.k = target > f.k ? Math.min(target, f.k + dt * rate) : Math.max(target, f.k - dt * rate)
        f.hover += (hTarget - f.hover) * (1 - Math.exp(-dt * 10))
      }
      poseFolder(f, t)
    })

    const lf = still ? 1 : 1 - Math.exp(-dt * 2.5)
    lean.x += (lean.tx - lean.x) * lf
    lean.y += (lean.ty - lean.y) * lf
    // Three-quarter view from above-left, like the photo, so you can see into the drawer
    rig.rotation.x = 0.34 + lean.y * 0.1 + Math.sin(t * 0.4) * 0.015
    rig.rotation.y = 0.5 + lean.x * 0.28 + Math.sin(t * 0.25) * 0.04

    renderer.render({ scene, camera })
    if (busy && visible) raf = requestAnimationFrame(frame)
  }

  function requestRender() {
    if (!raf && visible) {
      lastT = performance.now() / 1000
      raf = requestAnimationFrame(frame)
    }
  }

  const stopActive = watch(() => props.active, requestRender)

  const io = new IntersectionObserver(([entry]) => {
    visible = !!entry?.isIntersecting && !document.hidden
    if (visible) requestRender()
  })
  io.observe(canvas)
  const onVis = () => {
    visible = !document.hidden
    if (visible) requestRender()
  }
  document.addEventListener('visibilitychange', onVis)

  resize()
  frame()

  cleanup = () => {
    cancelAnimationFrame(raf)
    stopActive()
    io.disconnect()
    ro.disconnect()
    document.removeEventListener('visibilitychange', onVis)
    window.removeEventListener('pointermove', onMove)
    canvas.removeEventListener('pointermove', onCanvasMove)
    canvas.removeEventListener('pointerleave', onLeave)
    canvas.removeEventListener('click', onClick)
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
