// Resolves once the intro loader has wiped away (first load only).
// Hero animations wait on it so they play after the loader, not behind it.
let resolveFn: (() => void) | null = null
let readyPromise: Promise<void> | null = null
const isReady = ref(false)

function ensure() {
  if (!readyPromise) readyPromise = new Promise<void>((res) => { resolveFn = res })
  return readyPromise
}

export function useSiteReady() {
  return {
    isReady: readonly(isReady),
    whenReady: () => (isReady.value ? Promise.resolve() : ensure()),
    markReady: () => {
      ensure()
      isReady.value = true
      resolveFn?.()
    },
  }
}

/** Shared menu open state */
export const useMenuOpen = () => useState('menu-open', () => false)

/** Whether drafts (unpublished content, placeholders) may be shown. */
export const useShowDrafts = () => useRuntimeConfig().public.showDrafts as boolean

/**
 * True while the homepage hero's inline nav is on screen. The header hides its
 * MENU button on desktop (md+) during that time, since the same links are visible.
 */
// Starts true on the homepage so server and client render the header the same way.
export const useHeroNavInView = () => useState('hero-nav-in-view', () => useRoute().path === '/')
