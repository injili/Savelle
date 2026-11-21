<script setup lang="ts">
import { gsap } from 'gsap'

const root = ref<HTMLElement | null>(null)
const visible = ref(true)
const { markReady } = useSiteReady()

onMounted(async () => {
  const minTime = new Promise(r => setTimeout(r, prefersReducedMotion() ? 0 : 900))
  const fonts = document.fonts?.ready ?? Promise.resolve()
  const timeout = new Promise(r => setTimeout(r, 2500))
  await Promise.all([minTime, Promise.race([fonts, timeout])])

  if (!root.value || prefersReducedMotion()) {
    visible.value = false
    markReady()
    return
  }
  const tl = gsap.timeline({
    onComplete: () => { visible.value = false },
  })
  tl.to(root.value.querySelector('[data-loader-inner]'), { autoAlpha: 0, y: -16, duration: 0.45, ease: 'power2.in' })
    .to(root.value, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.inOut' }, '-=0.1')
    .add(() => markReady(), '-=0.55')
})
</script>

<template>
  <div
    v-if="visible"
    ref="root"
    class="site-loader fixed inset-0 z-[90] flex items-center justify-center bg-ink text-paper"
    aria-hidden="true"
  >
    <div data-loader-inner class="flex flex-col items-center">
      <LogoMark class="h-8 w-auto text-white" />
    </div>
  </div>
</template>

<style scoped>
/* Failsafe: never block content for long, even if hydration is slow or fails */
.site-loader { animation: loader-failsafe 0.4s ease 6s forwards; }
@keyframes loader-failsafe { to { opacity: 0; visibility: hidden; } }
</style>
