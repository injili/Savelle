<script setup lang="ts">
import { site } from '~~/data/site'

const { data: insights } = await useInsightsList()
const first4 = computed(() => (insights.value ?? []).slice(0, 4))
const img = site.images.insights
</script>

<template>
  <section class="bg-paper py-6 md:py-8" aria-labelledby="insights-title">
    <div class="shell">
      <SectionMeta name="Insights" />
      <div class="grid-12 gap-y-10 pb-16 pt-14 md:pb-28 md:pt-20">
        <div class="col-span-12 md:col-span-5">
          <h2 id="insights-title" v-reveal class="display-xl">{{ site.insights.headline }}</h2>
          <p class="mt-6 max-w-md leading-relaxed">{{ site.insights.intro }}</p>
          <BracketLink to="/insights" :label="site.ctas.exploreResearch" class="mt-6" />
          <HalftoneImage
            class="mt-10 aspect-[4/3] w-full md:aspect-[4/5]"
            :src="img.src"
            :alt="img.alt"
            :pattern="img.pattern"
            :seed="img.seed"
            :dot="8"
          />
        </div>
        <div class="col-span-12 grid content-start gap-3 sm:grid-cols-2 md:col-span-7 md:mt-0">
          <InsightCard v-for="(item, i) in first4" :key="item.slug" :item="item" :filled="i === 0" />
        </div>
      </div>
    </div>
  </section>
</template>
