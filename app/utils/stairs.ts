import { gsap } from 'gsap'

function cols() {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-stair]')).filter(el => el.offsetParent !== null || getComputedStyle(el).display !== 'none')
}

/** Columns slide in from the bottom with a stagger, covering the page. */
export function stairsCover(): Promise<void> {
  if (prefersReducedMotion()) return Promise.resolve()
  return new Promise((resolve) => {
    gsap.set(cols(), { transformOrigin: 'bottom', scaleY: 0 })
    gsap.to(cols(), {
      scaleY: 1,
      duration: 0.55,
      ease: 'power3.inOut',
      stagger: 0.06,
      onComplete: () => resolve(),
    })
  })
}

/** Columns slide out of the top with a stagger, revealing the new page. */
export function stairsReveal(): Promise<void> {
  if (prefersReducedMotion()) return Promise.resolve()
  return new Promise((resolve) => {
    gsap.set(cols(), { transformOrigin: 'top' })
    gsap.to(cols(), {
      scaleY: 0,
      duration: 0.6,
      ease: 'power3.inOut',
      stagger: 0.06,
      delay: 0.05,
      onComplete: () => resolve(),
    })
  })
}
