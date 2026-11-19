<script setup lang="ts">
import type { PatternKind } from '~~/data/site'

/**
 * Renders an image (or a generated pattern) as a two-tone halftone dot screen
 * on the shared WebGL canvas. A real <img> stays in the DOM for SEO/a11y.
 * Fallback (no WebGL / reduced motion): CSS duotone image or static dot pattern.
 */
const props = withDefaults(defineProps<{
  src?: string
  alt?: string
  /** Procedural pattern used when there is no src (or the image fails). */
  pattern?: PatternKind
  seed?: number
  /** light: navy ink on paper · dark: navy ink on light navy · white: navy ink on white */
  tone?: 'light' | 'dark' | 'white' | 'tint'
  dot?: number
  contrast?: number
  animate?: boolean
  /** 0..1 fade dots out toward the bottom edge (for overlaid headlines) */
  fade?: number
  /** 0..1 lift the whole pattern toward paper (quieter backgrounds) */
  lighten?: number
  /** 0..0.15 slow back-and-forth pan of the image (fraction of its size); 0 = still */
  drift?: number
  /** 0..1 soft ink shadow that trails the cursor with a lag (desktop); 0 = off */
  shadow?: number
  eager?: boolean
}>(), {
  src: '',
  alt: '',
  pattern: 'flow',
  seed: 1,
  tone: 'light',
  dot: 8,
  contrast: 1.15,
  animate: true,
  fade: 0,
  lighten: 0.12,
  drift: 0,
  shadow: 0,
  eager: false,
})

const TONES = {
  light: { ink: '#1A26AE', paper: '#E8E6E1' },
  dark: { ink: '#E8E6E1', paper: '#1A26AE' },
  white: { ink: '#1A26AE', paper: '#FFFFFF' },
  // Blue dots on a ~40% tint of the same blue, so white type stays readable on top
  tint: { ink: '#1A26AE', paper: '#9EA3DB' },
} as const

const el = ref<HTMLElement | null>(null)
const mode = ref<'pending' | 'webgl' | 'fallback'>('pending')
const failed = ref(false)
const $img = useImage()

const imgSrc = computed(() => {
  if (!props.src) return ''
  return /^https?:/.test(props.src) || props.src.startsWith('/')
    ? $img(props.src, { width: 1800, quality: 72 })
    : props.src
})

const colors = computed(() => TONES[props.tone])

let plane: HalftonePlane | null = null

onMounted(() => {
  if (!el.value) return
  plane = useHalftone().createPlane({
    el: el.value,
    src: imgSrc.value,
    pattern: props.pattern,
    seed: props.seed,
    ink: hexToRgb(colors.value.ink),
    paper: hexToRgb(colors.value.paper),
    dot: props.dot,
    contrast: props.contrast,
    animate: props.animate,
    fade: props.fade,
    lighten: props.lighten,
    drift: props.drift,
    shadow: props.shadow,
    onError: () => { failed.value = true },
  })
  mode.value = plane ? 'webgl' : 'fallback'
})

watch(() => [imgSrc.value, props.pattern, props.seed, props.dot, props.contrast, props.tone] as const, () => {
  failed.value = false
  plane?.set({
    src: imgSrc.value,
    pattern: props.pattern,
    seed: props.seed,
    dot: props.dot,
    contrast: props.contrast,
    ink: hexToRgb(colors.value.ink),
    paper: hexToRgb(colors.value.paper),
  })
})

onBeforeUnmount(() => {
  plane?.destroy()
  plane = null
})

const decorative = computed(() => !props.alt)
</script>

<template>
  <div
    ref="el"
    class="halftone relative overflow-hidden"
    :class="[`halftone--${mode}`, `halftone--${tone}`]"
    :style="{ backgroundColor: colors.paper, '--ht-ink': colors.ink, '--ht-paper': colors.paper, '--ht-dot': `${dot}px` }"
    :role="!src && !decorative ? 'img' : undefined"
    :aria-label="!src && !decorative ? alt : undefined"
    :aria-hidden="!src && decorative ? 'true' : undefined"
  >
    <img
      v-if="imgSrc && !failed"
      :src="imgSrc"
      :alt="alt"
      :loading="eager ? 'eager' : 'lazy'"
      decoding="async"
      class="halftone__img absolute inset-0 h-full w-full object-cover"
      @error="failed = true"
    >
    <div v-if="mode === 'fallback' && (!imgSrc || failed)" class="halftone__pattern absolute inset-0" :class="`halftone__pattern--${pattern}`" />
    <slot />
  </div>
</template>

<style scoped>
/* WebGL draws on top of this box; keep the real image in the DOM but invisible. */
.halftone--webgl .halftone__img { opacity: 0; }

/* Duotone fallback (also what no-JS / pending users see) */
.halftone__img {
  filter: grayscale(1) contrast(1.1) url('#sga-duotone');
}
.halftone--dark .halftone__img { mix-blend-mode: multiply; }

/* Static dot screen for procedural slots without WebGL */
.halftone__pattern {
  background-image: radial-gradient(circle at center, var(--ht-ink) 0 38%, transparent 40%);
  background-size: var(--ht-dot) var(--ht-dot);
  transform: rotate(45deg) scale(1.5);
}
.halftone__pattern--flow { mask-image: linear-gradient(115deg, #000 0%, transparent 70%); }
.halftone__pattern--contour { mask-image: repeating-radial-gradient(circle at 30% 60%, #000 0 6%, transparent 6% 12%); }
.halftone__pattern--network { mask-image: radial-gradient(circle at 70% 40%, #000 0%, transparent 65%); }
.halftone__pattern--ribbon { mask-image: linear-gradient(160deg, transparent 15%, #000 35%, #000 60%, transparent 80%); }
.halftone__pattern--orbits { mask-image: repeating-radial-gradient(circle at 50% 50%, #000 0 3%, transparent 3% 8%); }
</style>
