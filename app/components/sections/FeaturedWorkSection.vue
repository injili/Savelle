<script setup lang="ts">
import { site } from '~~/data/site'

const fw = site.home.featuredWork
const { data: work } = await useWorkList()
const showCards = computed(() => site.featuredWork === 'auto' && (work.value?.length ?? 0) > 0)
const offsets = ['md:mt-0', 'md:mt-32', 'md:mt-64']
</script>

<template>
  <section v-if="site.featuredWork !== 'hidden'" class="bg-paper py-6 md:py-8" aria-labelledby="work-title">
    <div class="shell">
      <SectionMeta name="Featured work" />
      <div class="mx-auto max-w-5xl pb-12 pt-14 text-center md:pt-24">
        <h2 id="work-title" v-reveal class="display-xl">{{ fw.title }}</h2>
        <p class="text-lead mx-auto mt-8 max-w-3xl">{{ fw.intro }}</p>
        <div class="mt-8 flex justify-center">
          <BracketLink to="/our-work" :label="site.ctas.exploreWork" />
        </div>
      </div>

      <div v-if="showCards" class="grid-12 gap-y-14 pb-16 md:pb-28">
        <WorkCard
          v-for="(item, i) in work"
          :key="item.path"
          :item="item"
          :index="i"
          class="col-span-12 md:col-span-4"
          :class="offsets[i % 3]"
        />
      </div>
    </div>
  </section>
</template>
