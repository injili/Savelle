<script setup lang="ts">
import { site } from '~~/data/site'

const why = site.home.why
const total = why.pillars.length
const index = ref(0)
const dir = ref<1 | -1>(1)
const pad = (n: number) => String(n).padStart(2, '0')

function go(step: 1 | -1) {
  dir.value = step
  index.value = (index.value + step + total) % total
}
const current = computed(() => why.pillars[index.value]!)
</script>

<template>
  <section class="bg-white py-6 md:py-8" aria-labelledby="why-title">
    <div class="shell">
      <SectionMeta name="Why Savelle" />
      <div class="grid-12 gap-y-14 pb-16 pt-14 md:pb-28 md:pt-20">
        <div class="col-span-12 md:col-span-6">
          <h2 id="why-title" v-reveal class="display-lg">{{ why.title }}</h2>
          <p class="text-lead mt-8 max-w-2xl">{{ why.intro }}</p>
        </div>

        <div
          class="col-span-12 flex flex-col md:col-span-5 md:col-start-8"
          role="group"
          aria-roledescription="carousel"
          aria-label="What sets Savelle apart"
        >
          <div class="rule-t flex items-center justify-between pt-3">
            <p class="label" aria-hidden="true">{{ pad(index + 1) }}/{{ pad(total) }}</p>
            <div class="flex gap-2">
              <button type="button" class="slider-btn" aria-label="Previous point" @click="go(-1)">
                <svg viewBox="0 0 16 16" class="size-4" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" /></svg>
              </button>
              <button type="button" class="slider-btn" aria-label="Next point" @click="go(1)">
                <svg viewBox="0 0 16 16" class="size-4" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 3v10M3.5 8.5 8 13l4.5-4.5" /></svg>
              </button>
            </div>
          </div>

          <div class="relative mt-10 min-h-[16rem] overflow-hidden md:min-h-[20rem]" aria-live="polite">
            <Transition :name="dir === 1 ? 'slide-up' : 'slide-down'" mode="out-in">
              <div :key="index" role="group" aria-roledescription="slide" :aria-label="`${index + 1} of ${total}`">
                <h3 class="display-md">{{ current.title }}:</h3>
                <p class="text-lead mt-6">{{ current.body }}</p>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.slider-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 3rem; height: 3rem; border-radius: 9999px;
  border: 1px solid var(--color-ink);
  transition: background-color .3s, color .3s;
}
.slider-btn:hover { background: var(--color-ink); color: var(--color-paper); }
.slide-up-enter-active, .slide-up-leave-active, .slide-down-enter-active, .slide-down-leave-active {
  transition: transform .5s var(--ease-out-expo), opacity .4s;
}
.slide-up-enter-from { transform: translateY(40%); opacity: 0; }
.slide-up-leave-to { transform: translateY(-40%); opacity: 0; }
.slide-down-enter-from { transform: translateY(-40%); opacity: 0; }
.slide-down-leave-to { transform: translateY(40%); opacity: 0; }
</style>
