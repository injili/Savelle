<script setup lang="ts">
import { gsap } from 'gsap'
import { site } from '~~/data/site'

const open = useMenuOpen()
const panel = ref<HTMLElement | null>(null)
const route = useRoute()
const lenis = useLenis()
let lastFocus: HTMLElement | null = null

function close() {
  open.value = false
}

function focusables() {
  return panel.value
    ? Array.from(panel.value.querySelectorAll<HTMLElement>('a[href],button:not([disabled])'))
    : []
}

function onKeydown(e: KeyboardEvent) {
  if (!open.value) return
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
    return
  }
  if (e.key === 'Tab') {
    // Trap focus within menu + header toggle
    const toggle = document.querySelector<HTMLElement>('[aria-controls="site-menu"]')
    const items = [...(toggle ? [toggle] : []), ...focusables()]
    if (!items.length) return
    const first = items[0]!
    const last = items[items.length - 1]!
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    }
    else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
}

watch(open, async (isOpen) => {
  if (import.meta.server) return
  const reduce = prefersReducedMotion()
  if (isOpen) {
    lastFocus = document.activeElement as HTMLElement | null
    lenis.value?.stop()
    document.documentElement.style.overflow = 'hidden'
    await nextTick()
    if (panel.value && !reduce) {
      gsap.fromTo(panel.value, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'expo.inOut' })
    }
    focusables()[0]?.focus({ preventScroll: true })
  }
  else {
    lenis.value?.start()
    document.documentElement.style.overflow = ''
    lastFocus?.focus({ preventScroll: true })
  }
})

watch(() => route.fullPath, close)

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

const year = new Date().getFullYear()
</script>

<template>
  <div
    v-if="open"
    id="site-menu"
    ref="panel"
    role="dialog"
    aria-modal="true"
    aria-label="Menu"
    class="on-ink fixed inset-0 z-[45] flex flex-col overflow-y-auto bg-ink text-paper"
  >
    <div class="shell grid-12 flex-1 content-end gap-y-10 pb-[var(--pad-x)] pt-28">
      <div class="col-span-12 md:col-span-8">
        <p class="label mb-6 text-white" v-scramble>Menu</p>
        <nav aria-label="Main">
          <NavColumns large stagger :on-navigate="close" />
        </nav>
      </div>
      <div class="col-span-12 flex flex-col justify-end gap-6 md:col-span-4">
        <p class="max-w-sm text-sm leading-relaxed text-paper/80">{{ site.footerDescription }}</p>
        <BracketLink to="/contact" :label="site.ctas.startConversation" />
      </div>
    </div>
    <div class="shell rule-t flex justify-between py-3">
      <p class="label">{{ site.wordmark }}</p>
      <p class="label">© {{ year }}</p>
    </div>
  </div>
</template>
