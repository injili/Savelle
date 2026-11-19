const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\[]#_+-<>=*'

interface ScrambleState {
  raf: number
  original: string
}

const states = new WeakMap<HTMLElement, ScrambleState>()

function textNodeOf(el: HTMLElement): Text | null {
  // Operate on the element's own text node so Vue keeps its reference to it.
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim()) return node as Text
  }
  return null
}

/**
 * Mono text decode: characters cycle through random glyphs, resolving left to right.
 * Respects prefers-reduced-motion (no-op).
 */
export function scramble(el: HTMLElement, { duration = 650, delay = 0 } = {}) {
  if (import.meta.server || prefersReducedMotion()) return
  const node = textNodeOf(el)
  if (!node) return

  const prev = states.get(el)
  if (prev) cancelAnimationFrame(prev.raf)
  const original = prev?.original ?? node.nodeValue ?? ''
  const state: ScrambleState = { raf: 0, original }
  states.set(el, state)

  const len = original.length
  const start = performance.now() + delay
  const tick = (now: number) => {
    const p = Math.min(1, Math.max(0, (now - start) / duration))
    const resolved = Math.floor(p * len)
    let out = ''
    for (let i = 0; i < len; i++) {
      const ch = original[i]!
      if (i < resolved || ch === ' ' || ch === ' ') out += ch
      else if (p === 0 && i > 0) out += ch // hold until delay elapses
      else out += GLYPHS[(Math.random() * GLYPHS.length) | 0]
    }
    node.nodeValue = p >= 1 ? original : out
    if (p < 1) state.raf = requestAnimationFrame(tick)
    else states.delete(el)
  }
  state.raf = requestAnimationFrame(tick)
}

/** Stop any running scramble and restore the text. */
export function stopScramble(el: HTMLElement) {
  const s = states.get(el)
  if (!s) return
  cancelAnimationFrame(s.raf)
  const node = textNodeOf(el)
  if (node) node.nodeValue = s.original
  states.delete(el)
}

export function useScramble() {
  return { scramble, stopScramble }
}
