<script setup lang="ts">
import type { WorkCollectionItem } from '@nuxt/content'

const props = defineProps<{ item: WorkCollectionItem, index: number, headingLevel?: 'h2' | 'h3' }>()
const slug = computed(() => slugOf(props.item.path))
</script>

<template>
  <article class="work-card rule-l group relative pl-4">
    <div class="flex items-start justify-between gap-3">
      <p class="label">{{ String(index + 1).padStart(2, '0') }}</p>
      <p class="label text-right text-ink">{{ item.sector }}</p>
    </div>
    <p v-if="item.label" class="label mt-3 inline-block border border-current px-2 py-0.5">{{ item.label }}</p>
    <component :is="headingLevel ?? 'h3'" class="mt-4 text-[clamp(1.375rem,1.1rem+0.9vw,2rem)] leading-[1.1] tracking-[-0.02em]">
      <NuxtLink :to="`/our-work/${slug}`" class="after:absolute after:inset-0 group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">{{ item.title }}</NuxtLink>
    </component>
    <HalftoneImage
      class="mt-6 aspect-[4/5] w-full"
      :src="item.image || ''"
      :alt="item.imageAlt || ''"
      :pattern="item.pattern"
      :seed="item.order * 7"
      :dot="7"
    />
    <p class="label mt-4">
      <span aria-hidden="true">[ </span>View<span aria-hidden="true"> → ]</span>
    </p>
  </article>
</template>
