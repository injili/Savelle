import type { RouterConfig } from '@nuxt/schema'

// Scrolling between pages is handled by the stairs transition (app.vue).
// Same-page hash links scroll smoothly via Lenis.
export default {
  scrollBehavior(to, from) {
    if (import.meta.client && to.path === from.path && to.hash) {
      scrollToTarget(decodeURIComponent(to.hash), { offset: -80 })
    }
    return false
  },
} satisfies RouterConfig
