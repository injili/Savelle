<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { site } from '~~/data/site'

usePageSeo('approach')
const ap = site.approach
const active = ref(0)
const timeline = ref<HTMLElement | null>(null)
let ctx: gsap.Context | null = null

onMounted(() => {
  if (!timeline.value) return
  ctx = gsap.context(() => {
    gsap.utils.toArray<HTMLElement>('[data-stage]').forEach((el, i) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => { if (self.isActive) active.value = i },
      })
    })
    if (!prefersReducedMotion()) {
      gsap.fromTo('[data-progress]', { scaleY: 0 }, {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: { trigger: timeline.value, start: 'top 55%', end: 'bottom 55%', scrub: true },
      })
    }
  }, timeline.value)
})
onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <div>
    <PageHeader name="Our approach" :headline="ap.headline" :paragraphs="[ap.intro]" />

    <section class="bg-white py-6 md:py-8" aria-labelledby="stages-title">
      <div class="shell">
        <SectionMeta name="Four stages" />
        <h2 id="stages-title" class="sr-only">Our four stages</h2>
        <div ref="timeline" class="grid-12 pb-16 pt-12 md:pb-28 md:pt-16">
          <!-- Pinned stage index -->
          <div class="col-span-12 hidden md:col-span-4 md:block">
            <div class="sticky top-24 flex gap-6">
              <div class="relative w-px bg-[var(--color-rule-dark)]">
                <span data-progress class="absolute inset-0 origin-top bg-ink" />
              </div>
              <ol class="flex flex-col gap-5 py-1">
                <li v-for="(s, i) in ap.stages" :key="s.n" class="transition-opacity duration-500" :class="active === i ? 'opacity-100' : 'opacity-35'">
                  <p class="label" :class="active === i ? 'text-ink' : ''">{{ s.n }}</p>
                  <p class="text-[clamp(1.25rem,1rem+1vw,2.25rem)] leading-[1.05] tracking-[-0.02em]">{{ s.title }}</p>
                </li>
              </ol>
            </div>
          </div>

          <ol class="col-span-12 md:col-span-7 md:col-start-6">
            <li v-for="s in ap.stages" :key="s.n" data-stage class="rule-t flex min-h-[70vh] flex-col py-10 md:py-14">
              <p class="label text-ink">{{ s.n }} — {{ s.title }}</p>
              <h3 v-reveal class="display-lg mt-8">{{ s.subhead }}</h3>
              <p class="text-lead mt-8 max-w-2xl">{{ s.body }}</p>
              <div class="mt-auto pt-10">
                <h4 class="label">Typical activities</h4>
                <ul class="mt-3 flex flex-wrap gap-2">
                  <li v-for="act in s.activities" :key="act" class="label border border-[var(--color-rule-dark)] px-2.5 py-1 normal-case">{{ act }}</li>
                </ul>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </section>

    <section class="on-ink bg-ink py-6 text-paper md:py-8" aria-labelledby="engage-title">
      <div class="shell">
        <SectionMeta name="Engagement" />
        <div class="grid-12 gap-y-8 pb-16 pt-14 md:pb-28 md:pt-20">
          <h2 id="engage-title" v-reveal class="display-lg col-span-12 md:col-span-5">{{ ap.howWeEngage.title }}</h2>
          <div class="col-span-12 md:col-span-6 md:col-start-7">
            <p class="text-lead text-paper/90">{{ ap.howWeEngage.body }}</p>
            <UiButton to="/contact" variant="paper" class="mt-8">{{ site.ctas.requestConversation }}</UiButton>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
