<script setup lang="ts">
import { site } from '~~/data/site'

const props = withDefaults(defineProps<{ title?: string, body?: string, cta?: string }>(), {
  title: undefined,
  body: undefined,
  cta: undefined,
})
const title = computed(() => props.title ?? site.home.closing.title)
const body = computed(() => props.body ?? site.home.closing.body)
const cta = computed(() => props.cta ?? site.ctas.tellUs)
</script>

<template>
  <section class="on-ink bg-ink py-6 text-paper md:py-8" aria-labelledby="closing-title">
    <div class="shell">
      <SectionMeta name="Start a conversation" />
      <div class="grid-12 gap-y-10 pb-20 pt-16 md:pb-32 md:pt-28">
        <h2 id="closing-title" v-reveal class="display-xl col-span-12 md:col-span-10">{{ title }}</h2>
        <div class="col-span-12 md:col-span-5 md:col-start-8">
          <p class="text-lead text-paper/90">{{ body }}</p>
          <UiButton to="/contact" variant="paper" class="mt-8 w-full sm:w-auto">{{ cta }}</UiButton>
        </div>
      </div>
    </div>
  </section>
</template>
