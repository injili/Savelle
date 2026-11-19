<script setup lang="ts">
import { site } from '~~/data/site'

const menuOpen = useMenuOpen()
// Desktop only: hide MENU while the hero's own nav is visible (never while the menu is open)
const hideMenuButton = computed(() => useHeroNavInView().value && !menuOpen.value)
</script>

<template>
  <header class="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-start justify-between p-[var(--pad-x)]">
    <a href="#main" class="label pointer-events-auto sr-only bg-ink px-3 py-2 text-paper focus:not-sr-only focus:absolute focus:left-[var(--pad-x)] focus:top-16">
      Skip to content
    </a>

    <NuxtLink
      to="/"
      class="pointer-events-auto flex h-[var(--control-h)] min-w-[var(--control-h)] items-center justify-center gap-3 bg-ink px-[calc((var(--control-h)-1.75rem)/2)] text-paper sm:pr-4 ring-1 ring-paper/20 transition-colors hover:bg-white hover:text-ink hover:ring-ink"
      :aria-label="`${site.name}: home`"
    >
      <LogoMark class="size-7" />
      <span class="label hidden sm:inline" aria-hidden="true">{{ site.wordmark }}</span>
    </NuxtLink>

    <div class="pointer-events-auto flex items-stretch gap-1">
      <button
        type="button"
        class="label flex h-[var(--control-h)] items-center gap-3 bg-ink px-5 text-paper ring-1 ring-paper/20 transition-[color,background-color,opacity,transform,visibility] duration-300 hover:bg-white hover:text-ink hover:ring-ink"
        :class="hideMenuButton ? 'md:invisible md:-translate-y-2 md:opacity-0' : ''"
        :aria-expanded="menuOpen"
        aria-controls="site-menu"
        @click="menuOpen = !menuOpen"
      >
        <span>{{ menuOpen ? 'Close' : 'Menu' }}</span>
        <span aria-hidden="true" class="relative block h-2.5 w-4">
          <span class="absolute left-0 top-0 h-px w-full bg-current transition-transform duration-300" :class="menuOpen ? 'translate-y-[5px] rotate-45' : ''" />
          <span class="absolute bottom-0 left-0 h-px w-full bg-current transition-transform duration-300" :class="menuOpen ? '-translate-y-[4px] -rotate-45' : ''" />
        </span>
      </button>
      <NuxtLink
        to="/contact"
        class="flex size-[var(--control-h)] items-center justify-center bg-ink text-paper ring-1 ring-paper/20 transition-colors hover:bg-white hover:text-ink hover:ring-ink"
        aria-label="Contact"
      >
        <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M3 5.5h18v13H3z" />
          <path d="m3 6 9 7 9-7" />
        </svg>
      </NuxtLink>
    </div>
  </header>
</template>
