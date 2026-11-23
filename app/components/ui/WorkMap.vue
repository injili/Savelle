<script lang="ts">
export interface MapPin {
  /** "01" */
  index: string
  country: string
  title: string
  to: string
  lat: number
  lon: number
}
</script>

<script setup lang="ts">
/**
 * A folded paper world map lying on the page: a row of 3D strips folded like an accordion,
 * carrying a map drawn once to a canvas: all white (land and sea), coast in a blue hairline,
 * borders dashed, a dotted 20° graticule over the sea, labelled round the edge. Small markers
 * sit on the engagement locations; `active` (driven by the section's list, or by hovering a
 * marker) adds a second ring. The sheet floats gently and leans a little toward the cursor.
 * Reduced motion: still, no lay-down.
 */
const props = withDefaults(defineProps<{
  pins: ReadonlyArray<MapPin>
  active?: number
}>(), { active: -1 })

const emit = defineEmits<{ 'update:active': [index: number] }>()

// Map extent (kept in step with data/worldMap.ts; the paths themselves load after mount)
const EXT = { lon0: -180, lon1: 180, lat0: -56, lat1: 76 }
const ASPECT = (EXT.lon1 - EXT.lon0) / (EXT.lat1 - EXT.lat0)
const fx = (lon: number) => (lon - EXT.lon0) / (EXT.lon1 - EXT.lon0)
const fy = (lat: number) => (EXT.lat1 - lat) / (EXT.lat1 - EXT.lat0)

const STRIPS = 4
const FOLD = 13 // degrees each strip turns, alternately
const D2R = Math.PI / 180

const root = ref<HTMLElement | null>(null)
const sheetEl = ref<HTMLElement | null>(null)
const shadeEls: Array<HTMLElement | undefined> = []
const setShade = (i: number) => (el: unknown) => {
  shadeEls[i] = (el as HTMLElement | null) ?? undefined
}

const wide = ref(true)
const mapUrl = ref('')
const stripW = ref(0)
const height = computed(() => (stripW.value * STRIPS) / ASPECT)
const rest = computed(() => (wide.value ? 50 : 38)) // how far it lies back, degrees

// Strip layout: alternately turned ±FOLD, edges joined
const strips = computed(() => {
  let x = 0
  let z = 0
  return Array.from({ length: STRIPS }, (_, i) => {
    const a = (i % 2 ? -1 : 1) * FOLD
    const out = { part: i, x, z, a }
    x += stripW.value * Math.cos(a * D2R)
    z -= stripW.value * Math.sin(a * D2R)
    return out
  })
})
const sheetW = computed(() => STRIPS * stripW.value * Math.cos(FOLD * D2R))

// Which strip each marker sits on, and where within it
const pinSpots = computed(() => props.pins.map((p) => {
  const u = fx(p.lon) * STRIPS
  const part = Math.min(STRIPS - 1, Math.floor(u))
  return { part, left: (u - part) * 100, top: fy(p.lat) * 100 }
}))

// --- Map image --------------------------------------------------------------------------
async function drawMap() {
  const m = await import('~~/data/worldMap')
  const S = 2 // canvas px per map unit
  const c = document.createElement('canvas')
  c.width = m.MAP.width * S
  c.height = m.MAP.height * S
  const ctx = c.getContext('2d')
  if (!ctx) return
  const css = getComputedStyle(document.documentElement)
  const INK = css.getPropertyValue('--color-ink').trim() || '#1a26ae'
  const mono = css.getPropertyValue('--font-mono').trim() || 'monospace'
  const X = (lon: number) => m.mapX(lon) * S
  const Y = (lat: number) => m.mapY(lat) * S
  const Wc = c.width
  const Hc = c.height
  const label = (t: string, x: number, y: number, align: CanvasTextAlign = 'left', px = 22) => {
    ctx.font = `400 ${px}px ${mono}`
    ctx.textAlign = align
    // letter-spacing like the site's .label, where supported
    ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${px * 0.09}px`
    ctx.fillText(t.toUpperCase(), x, y)
  }

  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, Wc, Hc)
  ctx.strokeStyle = INK
  ctx.fillStyle = INK

  // Graticule: dotted every 20°, equator long-dashed, tropics dashed
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.setLineDash([0, 7])
  ctx.beginPath()
  for (let l = -160; l <= 160; l += 20) {
    ctx.moveTo(X(l), 0)
    ctx.lineTo(X(l), Hc)
  }
  for (let l = -40; l <= 60; l += 20) {
    if (!l) continue
    ctx.moveTo(0, Y(l))
    ctx.lineTo(Wc, Y(l))
  }
  ctx.stroke()
  ctx.lineCap = 'butt'
  ctx.setLineDash([14, 7])
  ctx.beginPath()
  ctx.moveTo(0, Y(0))
  ctx.lineTo(Wc, Y(0))
  ctx.stroke()
  ctx.setLineDash([4, 8])
  ctx.beginPath()
  for (const t of [23.44, -23.44]) {
    ctx.moveTo(0, Y(t))
    ctx.lineTo(Wc, Y(t))
  }
  ctx.stroke()
  ctx.setLineDash([])

  // Land: white (it covers the graticule, so the sea is where the grid shows), borders
  // dashed, coast solid
  ctx.save()
  ctx.scale(S, S)
  const land = new Path2D(m.landPath)
  ctx.fillStyle = '#fff'
  ctx.fill(land)
  ctx.lineWidth = 0.5
  ctx.setLineDash([2.5, 1.6])
  ctx.stroke(new Path2D(m.bordersPath))
  ctx.setLineDash([])
  ctx.lineJoin = 'round'
  ctx.lineWidth = 1.1
  ctx.stroke(land)
  ctx.restore()

  // Sea names, line names
  ctx.fillStyle = INK
  label('Pacific Ocean', X(-140), Y(2), 'center')
  label('Atlantic Ocean', X(-38), Y(14), 'center')
  label('Indian Ocean', X(78), Y(-22), 'center')
  label('Equator', 80, Y(0) - 10)
  label('Tropic of Cancer', 80, Y(23.44) - 10)
  label('Tropic of Capricorn', 80, Y(-23.44) - 10)

  // North arrow (Pacific) + scale bar (south of Australia); 1° ≈ 111.32 km at the equator
  const nx = X(-160)
  const ny = Y(-40)
  ctx.beginPath()
  ctx.moveTo(nx, ny - 34)
  ctx.lineTo(nx + 12, ny + 14)
  ctx.lineTo(nx, ny + 5)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(nx, ny - 34)
  ctx.lineTo(nx - 12, ny + 14)
  ctx.lineTo(nx, ny + 5)
  ctx.closePath()
  ctx.fillStyle = '#fff'
  ctx.fill()
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = INK
  label('N', nx, ny - 44, 'center')
  const sx = X(112)
  const sy = Y(-47)
  const sw = (2000 / 111.32) * m.MAP.unit * S
  ctx.fillRect(sx, sy, sw / 2, 8)
  ctx.strokeRect(sx + sw / 2, sy, sw / 2, 8)
  label('0–2000 km', sx + sw + 14, sy + 9)

  // Neatline strips with the graticule labels (top + left)
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, Wc, 40)
  ctx.fillRect(0, 0, 66, Hc)
  ctx.beginPath()
  ctx.moveTo(0, 40)
  ctx.lineTo(Wc, 40)
  ctx.moveTo(66, 0)
  ctx.lineTo(66, Hc)
  ctx.stroke()
  ctx.fillStyle = INK
  for (let l = -160; l <= 160; l += 20) label(l ? `${Math.abs(l)}°${l < 0 ? 'W' : 'E'}` : '0°', X(l), 28, 'center')
  for (let l = -40; l <= 60; l += 20) label(l ? `${Math.abs(l)}°${l < 0 ? 'S' : 'N'}` : '0°', 33, Y(l) + 8, 'center')

  const blob = await new Promise<Blob | null>(r => c.toBlob(r))
  if (!blob) return
  if (mapUrl.value) URL.revokeObjectURL(mapUrl.value)
  mapUrl.value = URL.createObjectURL(blob)
}

// --- Motion: lay-down on entry, a slow float, a small lean toward the cursor --------------
let cleanup: (() => void) | undefined

onMounted(() => {
  const el = root.value
  if (!el) return
  const still = prefersReducedMotion()
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches

  const lean = { x: 0, y: 0, tx: 0, ty: 0 }
  let lay = still ? 0 : 1 // 1 = standing up (before it's seen), 0 = laid down
  let layTarget = lay
  let t = 0

  function apply() {
    const bob = still ? 0 : Math.sin(t * 0.7)
    const rx = rest.value - lay * 34 + lean.y * 1.5 + (still ? 0 : Math.sin(t * 0.45) * 0.8)
    const ry = lean.x * 2.5 + (still ? 0 : Math.sin(t * 0.3) * 0.6)
    const sheet = sheetEl.value
    if (sheet) {
      sheet.style.transform = `translate3d(${lean.x * 6}px, ${lean.y * 4 + bob * 6 + lay * 40}px, 0) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${-1.5 + lean.x * 0.5}deg)`
    }
    // Light from the upper left: strips turned away from it shade a little more
    strips.value.forEach((s, i) => {
      const sh = shadeEls[i]
      if (sh) sh.style.opacity = String(Math.min(1, Math.max(0.1, 0.45 + (s.a + ry) / 26)))
    })
  }

  const fit = () => {
    const w = el.clientWidth
    if (!w) return
    wide.value = window.matchMedia('(min-width: 1024px)').matches
    // narrower than the box: perspective widens the near edge of the lying sheet
    stripW.value = Math.min(w * (wide.value ? 0.82 : 0.92), 1240) / Math.cos(FOLD * D2R) / STRIPS
    nextTick(apply)
  }
  const ro = new ResizeObserver(fit)
  ro.observe(el)

  drawMap()
  document.fonts?.ready.then(drawMap)

  const onMove = (e: PointerEvent) => {
    lean.tx = (e.clientX / window.innerWidth - 0.5) * 2
    lean.ty = (e.clientY / window.innerHeight - 0.5) * 2
  }
  if (fine && !still) window.addEventListener('pointermove', onMove, { passive: true })

  let raf = 0
  let visible = false
  let lastT = performance.now()
  function frame() {
    raf = 0
    const now = performance.now()
    const dt = Math.min(0.1, (now - lastT) / 1000)
    lastT = now
    t += dt
    const f = 1 - Math.exp(-dt * 2.5)
    lean.x += (lean.tx - lean.x) * f
    lean.y += (lean.ty - lean.y) * f
    lay += (layTarget - lay) * (1 - Math.exp(-dt * 2.2))
    apply()
    if (visible) raf = requestAnimationFrame(frame)
  }

  const io = new IntersectionObserver(([e]) => {
    visible = !!e?.isIntersecting && !still
    if (visible) {
      layTarget = 0
      if (!raf) {
        lastT = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
  }, { threshold: 0.1 })
  io.observe(el)

  fit()

  cleanup = () => {
    cancelAnimationFrame(raf)
    ro.disconnect()
    io.disconnect()
    window.removeEventListener('pointermove', onMove)
    if (mapUrl.value) URL.revokeObjectURL(mapUrl.value)
  }
})
onBeforeUnmount(() => cleanup?.())
</script>

<template>
  <div ref="root" class="wm relative">
    <div class="wm-stage" :style="{ height: `${height}px` }">
      <div
        ref="sheetEl"
        class="wm-sheet"
        :style="{ width: `${sheetW}px`, height: `${height}px` }"
      >
        <div
          v-for="(s, i) in strips"
          :key="s.part"
          class="wm-strip"
          :style="{
            width: `${stripW}px`,
            transform: `translate3d(${s.x}px, 0, ${s.z}px) rotateY(${s.a}deg)`,
            ...(mapUrl ? {
              backgroundImage: `url(${mapUrl})`,
              backgroundSize: `${stripW * STRIPS}px 100%`,
              backgroundPosition: `${-s.part * stripW}px 0`,
            } : {}),
          }"
        >
          <!-- Markers on the paper (the list below is the accessible version) -->
          <template v-for="(p, pi) in pins" :key="p.to">
            <span
              v-if="pinSpots[pi]?.part === s.part"
              class="wm-marker"
              :class="{ 'is-active': pi === active }"
              :style="{ left: `${pinSpots[pi]?.left}%`, top: `${pinSpots[pi]?.top}%` }"
              aria-hidden="true"
              @pointerenter="emit('update:active', pi)"
              @pointerleave="emit('update:active', -1)"
              @click="navigateTo(p.to)"
            />
          </template>

          <!-- Crease shading -->
          <span :ref="setShade(i)" class="wm-shade" aria-hidden="true" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wm-stage {
  position: relative;
  perspective: 1800px;
  perspective-origin: 50% 10%;
}
.wm-sheet {
  position: relative;
  margin-inline: auto;
  transform-style: preserve-3d;
  transform-origin: 50% 60%;
  transform: rotateX(50deg) rotateZ(-1.5deg);
}
.wm-strip {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  transform-origin: 0 50%;
  background-color: var(--color-white);
  background-repeat: no-repeat;
  overflow: hidden;
  /* a hairline round each strip so the white sheet reads on the white page */
  box-shadow: inset 0 0 0 1px rgb(26 38 174 / 0.18);
}

/* Shade: a faint ink tint, deeper toward the fold the strip turns into, plus the one
   crease across the middle */
.wm-shade {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, transparent calc(50% - 1px), rgb(26 38 174 / 0.14) 50%, transparent calc(50% + 1px)),
    linear-gradient(180deg, transparent 38%, rgb(26 38 174 / 0.04) 50%, transparent 62%),
    linear-gradient(90deg, rgb(26 38 174 / 0.01) 0%, rgb(26 38 174 / 0.06) 100%);
}

/* Marker: a small dot in a ring; a second ring while active. A larger invisible hit area. */
.wm-marker {
  position: absolute;
  z-index: 1;
  width: 5px;
  height: 5px;
  margin: -2.5px 0 0 -2.5px;
  border-radius: 50%;
  background: var(--color-ink);
  box-shadow:
    0 0 0 1.5px var(--color-white),
    0 0 0 2.5px var(--color-ink);
  cursor: pointer;
  transition: box-shadow 0.4s var(--ease-out-expo);
}
.wm-marker::after {
  content: "";
  position: absolute;
  inset: -8px;
  border-radius: 50%;
}
.wm-marker.is-active {
  box-shadow:
    0 0 0 1.5px var(--color-white),
    0 0 0 2.5px var(--color-ink),
    0 0 0 5px var(--color-white),
    0 0 0 6px var(--color-ink);
}
</style>
