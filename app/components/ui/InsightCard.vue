<script setup lang="ts">
import { site } from '~~/data/site'

const props = defineProps<{
  item: { title: string, summary: string, category: string, slug: string, linkable: boolean, published?: boolean, date?: string, author?: string }
  filled?: boolean
  headingLevel?: 'h2' | 'h3'
}>()

const to = computed(() => (props.item.linkable ? `/insights/${props.item.slug}` : undefined))
const dateLabel = computed(() => {
  if (!props.item.published || !props.item.date) return site.insights.forthcoming
  return new Date(props.item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
})
</script>

<template>
  <article
    :id="`insight-${item.slug}`"
    class="insight-card group relative flex min-h-[18rem] flex-col p-5 transition-colors duration-300 md:p-6"
    :class="filled ? 'on-ink bg-ink text-paper' : 'border border-[var(--color-rule-dark)] hover:bg-ink hover:text-paper'"
  >
    <div class="flex items-start justify-between gap-3">
      <p class="label" :class="filled ? 'text-white' : 'text-ink group-hover:text-white'">{{ categoryTitle(item.category) }}</p>
      <p class="label shrink-0">{{ dateLabel }}</p>
    </div>
    <component :is="headingLevel ?? 'h3'" class="mt-8 text-[clamp(1.25rem,1rem+0.7vw,1.75rem)] leading-[1.12] tracking-[-0.02em]">
      <NuxtLink v-if="to" :to="to" class="after:absolute after:inset-0">{{ item.title }}</NuxtLink>
      <template v-else>{{ item.title }}</template>
    </component>
    <p class="mt-auto pt-6 text-sm leading-relaxed opacity-85">{{ item.summary }}</p>
  </article>
</template>
