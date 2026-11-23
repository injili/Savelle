<script setup lang="ts">
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { TransitionProps } from 'vue'
import { site } from '~~/data/site'

const config = useRuntimeConfig()
const route = useRoute()
const showDrafts = useShowDrafts()

useHead({
  script: [
    // Mark JS availability before paint (gates reveal/loader CSS).
    { innerHTML: 'document.documentElement.classList.add(\'js\')', tagPosition: 'head' },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': site.name,
        'url': config.public.siteUrl,
        'logo': `${config.public.siteUrl}/favicon.svg`,
        'description': site.brand.positioning,
        ...(site.contact.linkedin ? { sameAs: [site.contact.linkedin] } : {}),
        ...(site.contact.generalEmail ? { email: site.contact.generalEmail } : {}),
      }),
    },
  ],
  meta: showDrafts ? [{ name: 'robots', content: 'noindex, nofollow' }] : [],
})

const afterEnterScroll = () => {
  const lenis = useLenis().value
  if (route.hash) scrollToTarget(decodeURIComponent(route.hash), { immediate: true, offset: -80 })
  else if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
  else window.scrollTo(0, 0)
}

const pageTransition: TransitionProps = {
  name: 'stairs',
  mode: 'out-in',
  css: false,
  onLeave: (_el, done) => {
    useLenis().value?.stop()
    stairsCover().then(done)
  },
  onEnter: (_el, done) => {
    nextTick(() => {
      useLenis().value?.start()
      afterEnterScroll()
      ScrollTrigger.refresh()
      stairsReveal().then(done)
    })
  },
}

onMounted(() => {
  // Deep link with hash on first load
  if (route.hash) {
    useSiteReady().whenReady().then(() => scrollToTarget(decodeURIComponent(route.hash), { immediate: true, offset: -80 }))
  }
})
</script>

<template>
  <div>
    <SiteLoader />
    <SiteHeader />
    <SiteMenu />
    <main id="main" tabindex="-1" class="outline-none">
      <NuxtPage :transition="pageTransition" />
    </main>
    <SiteFooter />
    <StairsOverlay />

    <!-- Duotone filter for the non-WebGL image fallback (ink #1A26AE → paper #FFFFFF) -->
    <svg width="0" height="0" class="absolute" aria-hidden="true" focusable="false">
      <filter id="sga-duotone" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0" />
        <feComponentTransfer>
          <feFuncR type="table" tableValues="0.1020 1" />
          <feFuncG type="table" tableValues="0.1490 1" />
          <feFuncB type="table" tableValues="0.6824 1" />
        </feComponentTransfer>
      </filter>
    </svg>
  </div>
</template>
