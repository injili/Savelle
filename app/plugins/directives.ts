import type { Directive } from 'vue'
import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'

/**
 * v-scramble            → decode once when the element enters the viewport
 * v-scramble.hover      → decode on hover/focus of the element (or its closest link/button)
 * v-scramble.hover.view → both
 * v-scramble="{ delay }" → optional delay in ms
 *
 * Apply to leaf elements whose content is plain text.
 */
type El = HTMLElement & { __scr?: { io?: IntersectionObserver, off?: () => void } }

const scrambleDirective: Directive<El, { delay?: number } | undefined> = {
  getSSRProps: () => ({}),
  mounted(el, binding) {
    const mods = binding.modifiers
    const opts = { delay: binding.value?.delay ?? 0 }
    const onView = !mods.hover || mods.view
    el.__scr = {}

    if (onView && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            scramble(el, opts)
            io.disconnect()
          }
        }
      }, { rootMargin: '0px 0px -8% 0px' })
      io.observe(el)
      el.__scr.io = io
    }

    if (mods.hover) {
      const target = (el.closest('a,button') as HTMLElement | null) ?? el
      const run = () => scramble(el, { duration: 450 })
      target.addEventListener('mouseenter', run)
      target.addEventListener('focus', run)
      el.__scr.off = () => {
        target.removeEventListener('mouseenter', run)
        target.removeEventListener('focus', run)
      }
    }
  },
  beforeUpdate(el) {
    stopScramble(el)
  },
  unmounted(el) {
    el.__scr?.io?.disconnect()
    el.__scr?.off?.()
    stopScramble(el)
  },
}

/**
 * v-reveal → line-by-line masked reveal (GSAP SplitText) when entering the viewport.
 * v-reveal="{ delay, wait }": `wait` defers until the intro loader has finished (hero).
 */
type RevealEl = HTMLElement & { __rev?: { split?: SplitText, killed?: boolean } }

const revealDirective: Directive<RevealEl, { delay?: number, wait?: boolean } | undefined> = {
  getSSRProps: () => ({ 'data-reveal': '' }),
  async mounted(el, binding) {
    el.__rev = {}
    if (prefersReducedMotion()) {
      el.style.visibility = 'visible'
      return
    }
    if (binding.value?.wait) await useSiteReady().whenReady()
    await document.fonts?.ready
    if (el.__rev.killed) return
    el.__rev.split = SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'reveal-line',
      autoSplit: true,
      onSplit(self) {
        el.style.visibility = 'visible'
        return gsap.from(self.lines, {
          yPercent: 115,
          duration: 1.15,
          ease: 'expo.out',
          stagger: 0.085,
          delay: binding.value?.delay ?? 0,
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          // The masks only need to clip while lines slide in. Afterwards, stop
          // clipping so descenders (g, y, p) can never be cropped.
          onComplete() {
            self.masks?.forEach(m => { (m as HTMLElement).style.overflow = 'visible' })
          },
        })
      },
    })
  },
  unmounted(el) {
    if (el.__rev) el.__rev.killed = true
    el.__rev?.split?.revert()
  },
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('scramble', scrambleDirective)
  nuxtApp.vueApp.directive('reveal', revealDirective)
})
