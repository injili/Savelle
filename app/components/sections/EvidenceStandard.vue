<script setup lang="ts">
import { site } from '~~/data/site'

const ev = site.work.evidenceStandard
</script>

<template>
  <section class="bg-white py-6 md:py-8" aria-labelledby="evidence-title">
    <div class="shell">
      <SectionMeta name="Evidence standard" />
      <div class="grid-12 gap-y-8 pb-16 pt-12 md:pb-24 md:pt-16">
        <h2 id="evidence-title" class="display-md col-span-12 md:col-span-5">{{ ev.title }}</h2>
        <p class="text-lead col-span-12 md:col-span-6 md:col-start-7">{{ ev.body }}</p>
      </div>
    </div>
  </section>
</template>
