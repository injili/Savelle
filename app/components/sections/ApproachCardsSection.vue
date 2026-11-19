<script setup lang="ts">
import { gsap } from 'gsap'
import { site } from '~~/data/site'

const a = site.home.approach
const root = ref<HTMLElement | null>(null)
const rotations = [-5, 4, -3.5, 5]
let ctx: gsap.Context | null = null

onMounted(() => {
  if (prefersReducedMotion() || !root.value) return
  ctx = gsap.context(() => {
    gsap.utils.toArray<HTMLElement>('[data-card]').forEach((card, i) => {
      gsap.fromTo(card,
        { rotation: rotations[i % rotations.length], yPercent: 25 },
        {
          rotation: 0,
          yPercent: 0,
          ease: 'none',
          scrollTrigger: { trigger: card, start: 'top bottom', end: 'top 35%', scrub: 0.6 },
        })
    })
  }, root.value)
})
onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <section ref="root" class="bg-paper py-6 md:py-8" aria-labelledby="approach-title">
    <div class="shell">
      <SectionMeta name="Our approach" />
      <div class="grid-12 gap-y-12 pb-16 pt-14 md:pb-32 md:pt-20">
        <div class="col-span-12 md:col-span-5">
          <div class="md:sticky md:top-24">
            <h2 id="approach-title" v-reveal class="text-[clamp(2.75rem,5.4vw,7rem)] leading-[0.92] tracking-[-0.04em]">{{ a.title }}</h2>
            <p class="label mt-8 max-w-sm normal-case">{{ a.intro }}</p>
            <BracketLink to="/our-approach" :label="site.ctas.seeHowWeWork" class="mt-8" />
          </div>
        </div>

        <ol class="relative col-span-12 md:col-span-6 md:col-start-7">
          <!-- vertical hairline joining the cards -->
          <span aria-hidden="true" class="rule-l absolute bottom-0 left-1/2 top-0" />
          <li
            v-for="(step, i) in a.steps"
            :key="step.n"
            class="sticky mb-[30vh] last:mb-0"
            :style="{ top: `calc(6rem + ${i * 1.75}rem)` }"
          >
            <article data-card class="relative bg-white p-6 shadow-[0_1px_0_rgb(26_38_174/0.08),0_20px_40px_-24px_rgb(26_38_174/0.35)] md:p-8">
              <div class="flex items-start justify-between">
                <p class="label text-ink">{{ step.n }}</p>
                <p class="label" aria-hidden="true">[{{ step.n }}/04]</p>
              </div>
              <h3 class="display-md mt-10 md:mt-16">{{ step.title }}</h3>
              <p class="mt-4 max-w-md leading-relaxed">{{ step.body }}</p>
            </article>
          </li>
        </ol>
      </div>
    </div>
  </section>
</template>
