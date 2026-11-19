<script setup lang="ts">
import type { PatternKind } from '~~/data/site'

// Dev-only test bench for the HalftoneImage system.
if (!useShowDrafts()) throw createError({ statusCode: 404, statusMessage: 'Not found', fatal: true })

useSeoMeta({ title: 'Halftone test bench', robots: 'noindex, nofollow' })

const patterns: PatternKind[] = ['flow', 'contour', 'network', 'orbits', 'ribbon']
const dot = ref(8)
const contrast = ref(1.15)
const tone = ref<'light' | 'dark' | 'white'>('light')
const seed = ref(1)
const imageUrl = ref('/dev/halftone-sample.svg')
const supported = ref<boolean | null>(null)
onMounted(() => { supported.value = halftoneSupported() })
</script>

<template>
  <div class="shell pb-24 pt-28">
    <SectionMeta name="Dev / Halftone test bench" />
    <h1 class="display-lg mt-6">HalftoneImage</h1>
    <p class="label mt-4">
      WebGL: {{ supported === null ? '…' : supported ? 'active (shared canvas)' : 'fallback (no WebGL or reduced motion)' }}
    </p>

    <form class="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5" @submit.prevent>
      <label class="label flex flex-col gap-2">Dot size: {{ dot }}px
        <input v-model.number="dot" type="range" min="3" max="24" step="1">
      </label>
      <label class="label flex flex-col gap-2">Contrast: {{ contrast.toFixed(2) }}
        <input v-model.number="contrast" type="range" min="0.5" max="2.5" step="0.05">
      </label>
      <label class="label flex flex-col gap-2">Seed: {{ seed }}
        <input v-model.number="seed" type="range" min="1" max="60" step="1">
      </label>
      <label class="label flex flex-col gap-2">Tone
        <select v-model="tone" class="border border-ink/30 bg-transparent p-2">
          <option value="light">light (ink on paper)</option>
          <option value="dark">dark (ink on light navy)</option>
          <option value="white">white</option>
        </select>
      </label>
      <label class="label col-span-2 flex flex-col gap-2 md:col-span-1">Image URL
        <input v-model.lazy="imageUrl" type="text" class="border border-ink/30 bg-transparent p-2 normal-case">
      </label>
    </form>

    <h2 class="label mt-14">Procedural mode</h2>
    <div class="mt-4 grid gap-4 md:grid-cols-2">
      <figure v-for="p in patterns" :key="p">
        <HalftoneImage :pattern="p" :seed="seed" :dot="dot" :contrast="contrast" :tone="tone" class="aspect-[4/3] w-full" />
        <figcaption class="label mt-2">{{ p }}</figcaption>
      </figure>
    </div>

    <h2 class="label mt-14">Image mode (with real &lt;img&gt; underneath)</h2>
    <div class="mt-4 grid gap-4 md:grid-cols-2">
      <figure>
        <HalftoneImage :src="imageUrl" alt="Sample image: test pattern of overlapping circles" :dot="dot" :contrast="contrast" :tone="tone" class="aspect-[4/3] w-full" />
        <figcaption class="label mt-2">image → halftone</figcaption>
      </figure>
      <figure>
        <HalftoneImage src="/dev/does-not-exist.jpg" alt="Broken image test" pattern="contour" :dot="dot" :tone="tone" class="aspect-[4/3] w-full" />
        <figcaption class="label mt-2">broken src → procedural fallback</figcaption>
      </figure>
    </div>

    <h2 class="label mt-14">Tall (scroll sync check)</h2>
    <HalftoneImage pattern="network" :seed="seed + 5" :dot="dot" :tone="tone" class="mt-4 h-[140vh] w-full" />
  </div>
</template>
