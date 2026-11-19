<script setup lang="ts">
import { site } from '~~/data/site'

usePageSeo('about')
const about = site.about
const aud = site.audiences
const showDrafts = useShowDrafts()
const founderName = about.founder.founderName || (showDrafts ? '[Founder name]' : '')
</script>

<template>
  <div>
    <PageHeader name="About Savelle" :headline="about.headline" :paragraphs="about.paragraphs" />

    <section class="bg-paper pb-6" aria-label="Savelle Group Africa">
      <div class="shell">
        <HalftoneImage class="aspect-[16/9] w-full md:aspect-[21/9]" :src="site.images.about.src" :alt="site.images.about.alt" :pattern="site.images.about.pattern" :seed="site.images.about.seed" :dot="9" />
      </div>
    </section>

    <!-- Mission / Vision -->
    <section class="bg-paper py-6 md:py-8" aria-labelledby="mv-title">
      <div class="shell">
        <SectionMeta name="Mission & vision" />
        <h2 id="mv-title" class="sr-only">Mission and vision</h2>
        <div class="grid md:grid-cols-2">
          <div class="py-12 md:py-20 md:pr-10">
            <h3 class="label text-ink" v-scramble>Our mission</h3>
            <p v-reveal class="display-md mt-6">{{ about.mission }}</p>
          </div>
          <div class="rule-t py-12 md:rule-l md:border-t-0 md:py-20 md:pl-10">
            <h3 class="label text-ink" v-scramble>Our vision</h3>
            <p v-reveal class="display-md mt-6">{{ about.vision }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Philosophy -->
    <section class="on-ink bg-ink py-6 text-paper md:py-8" aria-labelledby="philosophy-title">
      <div class="shell">
        <SectionMeta name="Our philosophy" />
        <div class="grid-12 gap-y-10 pb-16 pt-14 md:pb-28 md:pt-24">
          <h2 id="philosophy-title" v-reveal class="display-lg col-span-12 md:col-span-9">{{ about.philosophy.title }}</h2>
          <p class="text-lead col-span-12 text-paper/90 md:col-span-6 md:col-start-7">{{ about.philosophy.body }}</p>
        </div>
      </div>
    </section>

    <!-- Values -->
    <section class="bg-paper py-6 md:py-8" aria-labelledby="values-title">
      <div class="shell">
        <SectionMeta name="Values" />
        <h2 id="values-title" v-reveal class="display-lg pb-10 pt-14 md:pb-16 md:pt-20">{{ about.valuesTitle }}</h2>
        <ul class="rule-t grid sm:grid-cols-2 lg:grid-cols-3">
          <li
            v-for="(v, i) in about.values"
            :key="v.title"
            class="rule-b flex min-h-[14rem] flex-col p-5 md:p-6"
            :class="[i % 3 !== 0 ? 'lg:rule-l' : '', i % 2 !== 0 ? 'max-lg:sm:rule-l' : '']"
          >
            <p class="label text-ink">{{ String(i + 1).padStart(2, '0') }}</p>
            <h3 class="display-md mt-8">{{ v.title }}</h3>
            <p class="mt-3 leading-relaxed">{{ v.body }}</p>
          </li>
        </ul>
      </div>
    </section>

    <!-- Founder message (DRAFT: gate 6) -->
    <section class="bg-white py-6 md:py-8" aria-labelledby="founder-title">
      <div class="shell">
        <SectionMeta name="Founder's message" />
        <h2 id="founder-title" class="sr-only">A message from our founder</h2>
        <figure class="grid-12 gap-y-8 pb-16 pt-14 md:pb-28 md:pt-20">
          <span aria-hidden="true" class="col-span-12 text-[clamp(5rem,12vw,12rem)] leading-[0.6] text-ink md:col-span-2">“</span>
          <blockquote class="col-span-12 md:col-span-9">
            <p v-reveal class="text-statement">{{ about.founder.paragraphs[0] }}</p>
            <div class="mt-10 grid gap-6 md:grid-cols-2">
              <p v-for="(p, i) in about.founder.paragraphs.slice(1)" :key="i" class="text-lead">{{ p }}</p>
            </div>
          </blockquote>
          <figcaption v-if="founderName" class="label col-span-12 md:col-span-9 md:col-start-3">
            — <span :class="!about.founder.founderName ? 'bg-white px-1' : ''">{{ founderName }}</span>, {{ about.founder.role }}
          </figcaption>
        </figure>
      </div>
    </section>

    <!-- Who we work with (B6) -->
    <section id="who-we-work-with" class="scroll-mt-20 bg-paper py-6 md:py-8" aria-labelledby="who-title">
      <div class="shell">
        <SectionMeta name="Who we work with" />
        <div class="grid-12 gap-y-8 pb-12 pt-14 md:pt-20">
          <h2 id="who-title" v-reveal class="display-lg col-span-12 md:col-span-8">{{ aud.title }}</h2>
          <p class="text-lead col-span-12 md:col-span-5 md:col-start-8 md:mt-4">{{ aud.intro }}</p>
        </div>
        <ul class="rule-b">
          <li v-for="(a, i) in aud.items" :key="a.title" class="rule-t grid-12 gap-y-3 py-6 md:py-8">
            <p class="label col-span-2 md:col-span-1">{{ String(i + 1).padStart(2, '0') }}</p>
            <h3 class="col-span-10 text-[clamp(1.375rem,1rem+1vw,2.25rem)] leading-[1.1] tracking-[-0.02em] md:col-span-5">{{ a.title }}</h3>
            <p class="col-span-10 col-start-3 leading-relaxed md:col-span-5 md:col-start-8">{{ a.body }}</p>
          </li>
        </ul>
        <div class="grid-12 gap-y-8 pb-16 pt-16 md:pb-28">
          <div class="col-span-12 md:col-span-5">
            <HalftoneImage class="aspect-[4/3] w-full" :src="site.images.whereWeWork.src" :alt="site.images.whereWeWork.alt" :pattern="site.images.whereWeWork.pattern" :seed="site.images.whereWeWork.seed" :dot="7" />
          </div>
          <div class="col-span-12 md:col-span-6 md:col-start-7">
            <h3 class="label text-ink" v-scramble>{{ aud.whereWeWork.title }}</h3>
            <p class="text-lead mt-6">{{ aud.whereWeWork.body }}</p>
            <BracketLink to="/contact?enquiry=Partnership" :label="site.ctas.partner" class="mt-8" />
          </div>
        </div>
      </div>
    </section>

    <ClosingCtaSection :cta="site.ctas.requestConversation" />
  </div>
</template>
