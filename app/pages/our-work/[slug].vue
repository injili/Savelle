<script setup lang="ts">
import { site } from '~~/data/site'

const route = useRoute()
const slug = String(route.params.slug)
const showDrafts = useShowDrafts()

const { data: item } = await useAsyncData(`work-${slug}`, () => queryCollection('work').path(`/work/${slug}`).first())
if (!item.value || (!item.value.published && !showDrafts)) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}
const w = item.value
const h = site.work.headings
const isProposed = w.status === 'proposed'

usePageSeo(null, {
  title: `${w.title} | Savelle Group Africa`,
  description: w.description || w.challenge,
  noindex: !w.published,
})

const { data: services } = await useServicesList()
const related = computed(() => services.value?.find(s => s.anchor === w.relatedService))

const sections = computed(() => [
  { title: h.challenge, body: w.challenge },
  isProposed
    ? { title: h.proposedContribution, body: w.proposedContribution ?? '' }
    : { title: h.contribution, body: w.contribution ?? '' },
  { title: h.strategicFocus, body: w.strategicFocus },
  { title: h.whatThisDemonstrates, body: w.whatThisDemonstrates },
].filter(s => s.body))
</script>

<template>
  <article>
    <p v-if="!w.published" class="label fixed bottom-3 left-1/2 z-[60] -translate-x-1/2 bg-white px-3 py-1.5 text-ink">
      Draft: not published (visible in dev/preview only)
    </p>

    <header class="bg-paper pt-24 md:pt-28">
      <div class="shell">
        <SectionMeta :name="`Our work / ${w.sector}`" />
        <div class="grid-12 gap-y-8 pb-12 pt-12 md:pb-20 md:pt-20">
          <div class="col-span-12 flex flex-wrap gap-3">
            <NuxtLink to="/our-work" class="label hover:underline hover:decoration-1 hover:underline-offset-4">← Our work</NuxtLink>
            <p v-if="w.label" class="label border border-current px-2 py-0.5">{{ w.label }}</p>
          </div>
          <h1 v-reveal="{ wait: true }" class="display-xl col-span-12 lg:col-span-11">{{ w.title }}</h1>
        </div>
      </div>
    </header>

    <div class="bg-paper pb-6">
      <div class="shell">
        <HalftoneImage class="aspect-[16/9] w-full md:aspect-[21/9]" :src="w.image || ''" :alt="w.imageAlt || ''" :pattern="w.pattern" :seed="w.order * 7" :dot="9" />
      </div>
    </div>

    <section
      v-for="(s, i) in sections"
      :key="s.title"
      class="bg-paper py-4"
      :aria-labelledby="`cs-${i}`"
    >
      <div class="shell">
        <div class="rule-t grid-12 gap-y-6 py-10 md:py-16">
          <p class="label col-span-12 md:col-span-1">{{ String(i + 1).padStart(2, '0') }}</p>
          <h2 :id="`cs-${i}`" class="display-md col-span-12 md:col-span-4">{{ s.title }}</h2>
          <p class="text-lead col-span-12 md:col-span-6 md:col-start-7">{{ s.body }}</p>
        </div>
      </div>
    </section>

    <section v-if="related" class="bg-paper pb-16" aria-label="Related capability">
      <div class="shell">
        <div class="rule-t flex flex-wrap items-center justify-between gap-4 pt-6">
          <p class="label">Related capability: {{ related.title }}</p>
          <BracketLink :to="`/what-we-do#${related.anchor}`" label="Learn more" />
        </div>
      </div>
    </section>

    <EvidenceStandard />
    <ClosingCtaSection :cta="site.ctas.discussChallenge" />
  </article>
</template>
