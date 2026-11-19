<script setup lang="ts">
import { site } from '~~/data/site'

usePageSeo('work')
const { data: work } = await useWorkList()
</script>

<template>
  <div>
    <PageHeader name="Our work" :headline="site.work.headline" :paragraphs="[site.work.intro]" />

    <section class="bg-paper py-6 md:py-8" aria-labelledby="engagements-title">
      <div class="shell">
        <SectionMeta name="Selected engagements" />
        <h2 id="engagements-title" class="sr-only">{{ site.ctas.viewEngagements }}</h2>
        <div v-if="work?.length" class="grid-12 gap-y-14 pb-16 pt-12 md:pb-28">
          <WorkCard
            v-for="(item, i) in work"
            :key="item.path"
            :item="item"
            :index="i"
            class="col-span-12 md:col-span-4"
            :class="['md:mt-0', 'md:mt-24', 'md:mt-48'][i % 3]"
          />
        </div>
        <p v-else class="text-lead max-w-2xl pb-16 pt-12">{{ site.work.emptyState }}</p>
      </div>
    </section>

    <EvidenceStandard />
    <ClosingCtaSection :cta="site.ctas.discussChallenge" />
  </div>
</template>
