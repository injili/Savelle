import type Lenis from 'lenis'

// One Lenis instance for the whole app (client only). Null on the server and
// when the user prefers reduced motion (native scrolling is used instead).
const lenisRef = shallowRef<Lenis | null>(null)

export function useLenis() {
  return lenisRef
}

/** Scroll to an element/selector/position using Lenis when available. */
export function scrollToTarget(target: string | HTMLElement | number, opts: { immediate?: boolean, offset?: number } = {}) {
  if (import.meta.server) return
  const lenis = lenisRef.value
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
  if (el == null) return
  if (lenis) {
    lenis.scrollTo(el, { immediate: opts.immediate, offset: opts.offset ?? 0, force: true })
  }
  else if (typeof el === 'number') {
    window.scrollTo({ top: el, behavior: 'instant' })
  }
  else {
    const top = el.getBoundingClientRect().top + window.scrollY + (opts.offset ?? 0)
    window.scrollTo({ top, behavior: opts.immediate || prefersReducedMotion() ? 'instant' : 'smooth' })
  }
}

export function prefersReducedMotion() {
  if (import.meta.server) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
