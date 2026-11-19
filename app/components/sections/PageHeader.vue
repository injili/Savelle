<script setup lang="ts">
withDefaults(defineProps<{
  name: string
  headline: string
  paragraphs?: string[]
  lead?: boolean
}>(), { paragraphs: () => [], lead: true })
</script>

<template>
  <header class="bg-paper pt-24 md:pt-28">
    <div class="shell">
      <SectionMeta :name="name" />
      <div class="grid-12 gap-y-10 pb-14 pt-12 md:pb-24 md:pt-20">
        <h1 v-reveal="{ wait: true }" class="display-xl col-span-12 lg:col-span-11">{{ headline }}</h1>
        <div v-if="paragraphs.length" class="col-span-12 grid gap-6 md:col-span-7 md:col-start-6 md:mt-6">
          <p v-for="(p, i) in paragraphs" :key="i" :class="lead && i === 0 ? 'text-lead' : 'leading-relaxed'">{{ p }}</p>
        </div>
        <slot />
      </div>
    </div>
  </header>
</template>
