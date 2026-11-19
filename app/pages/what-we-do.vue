<script setup lang="ts">
import { site } from '~~/data/site'

usePageSeo('whatWeDo')
const { data: services } = await useServicesList()
</script>

<template>
  <div>
    <PageHeader name="What we do" :headline="site.whatWeDo.headline" :paragraphs="[site.whatWeDo.intro]">
      <nav aria-label="Capabilities" class="col-span-12 mt-6 md:col-span-7 md:col-start-6">
        <ol class="rule-b">
          <li v-for="(s, i) in services" :key="s.anchor" class="rule-t">
            <NuxtLink :to="`#${s.anchor}`" class="group flex items-baseline gap-4 py-3 hover:underline hover:decoration-1 hover:underline-offset-4">
              <span class="label w-8">{{ String(i + 1).padStart(2, '0') }}</span>
              <span class="flex-1">{{ s.title }}</span>
              <span aria-hidden="true" class="label transition-transform group-hover:translate-y-0.5">↓</span>
            </NuxtLink>
          </li>
        </ol>
      </nav>
    </PageHeader>

    <section
      v-for="(s, i) in services"
      :id="s.anchor"
      :key="s.anchor"
      class="scroll-mt-16 py-6 md:py-8"
      :class="i % 2 === 0 ? 'bg-white' : 'bg-paper'"
      :aria-labelledby="`${s.anchor}-title`"
    >
      <div class="shell">
        <SectionMeta :name="s.shortTitle" />
        <div class="grid-12 gap-y-10 pb-16 pt-12 md:pb-24 md:pt-20">
          <div class="col-span-12 md:col-span-5">
            <div class="md:sticky md:top-24">
              <p class="label text-ink">{{ String(i + 1).padStart(2, '0') }} / {{ String(services?.length ?? 6).padStart(2, '0') }}</p>
              <h2 :id="`${s.anchor}-title`" v-reveal class="display-md mt-4">{{ s.title }}</h2>
              <p class="text-lead mt-6 font-medium text-ink">{{ s.tagline }}</p>
            </div>
          </div>
          <div class="col-span-12 md:col-span-6 md:col-start-7">
            <p class="text-lead">{{ s.description }}</p>
            <h3 class="label mt-12 text-ink">Typical areas of work</h3>
            <ul class="rule-b mt-4">
              <li v-for="area in s.typicalAreas" :key="area" class="label rule-t py-3">{{ area }}</li>
            </ul>
            <div class="on-ink mt-10 bg-ink p-6 text-paper md:p-8">
              <h3 class="label text-white">What you can expect</h3>
              <p class="text-lead mt-4">{{ s.whatYouCanExpect }}</p>
            </div>
            <BracketLink :to="`/contact?enquiry=${encodeURIComponent(site.serviceEnquiryType[s.anchor as keyof typeof site.serviceEnquiryType] ?? '')}`" :label="site.ctas.discussChallenge" class="mt-8" />
          </div>
        </div>
      </div>
    </section>

    <section class="bg-paper py-6 md:py-8" aria-label="Next">
      <div class="shell rule-t flex flex-wrap items-center justify-between gap-6 py-10">
        <p class="display-md">{{ site.approach.headline }}</p>
        <BracketLink to="/our-approach" :label="site.ctas.seeHowWeWork" />
      </div>
    </section>

    <ClosingCtaSection />
  </div>
</template>
