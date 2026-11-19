<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const is404 = computed(() => props.error.statusCode === 404)
useSeoMeta({ title: is404 ? 'Page not found | Savelle Group Africa' : 'Error | Savelle Group Africa', robots: 'noindex' })
const back = () => clearError({ redirect: '/' })
</script>

<template>
  <div class="flex min-h-svh flex-col bg-paper">
    <SiteHeader />
    <main id="main" class="shell flex flex-1 flex-col justify-end pb-[var(--pad-x)] pt-28">
      <SectionMeta name="Error" />
      <h1 class="display-xl mt-10">{{ is404 ? 'This page could not be found.' : 'Something went wrong.' }}</h1>
      <button type="button" class="mt-10 self-start" @click="back">
        <span class="label">[ Back to home → ]</span>
      </button>
    </main>
  </div>
</template>
