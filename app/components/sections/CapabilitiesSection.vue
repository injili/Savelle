<script setup lang="ts">
import { site } from '~~/data/site'

const cap = site.home.capabilities
const images = site.images.capabilities
const open = ref(0)
const uid = useId()

function toggle(i: number) {
  open.value = open.value === i ? -1 : i
}

function onKey(e: KeyboardEvent, i: number) {
  const n = cap.items.length
  const go = (j: number) => {
    e.preventDefault()
    document.getElementById(`${uid}-btn-${(j + n) % n}`)?.focus()
  }
  if (e.key === 'ArrowDown') go(i + 1)
  else if (e.key === 'ArrowUp') go(i - 1)
  else if (e.key === 'Home') go(0)
  else if (e.key === 'End') go(n - 1)
}

const activeImage = computed(() => images[Math.max(open.value, 0)]!)
</script>

<template>
  <section class="bg-paper py-6 md:py-8" aria-labelledby="cap-title">
    <div class="shell">
      <SectionMeta name="Capabilities" />
      <div class="grid-12 gap-y-10 pb-10 pt-14 md:pt-20">
        <div class="col-span-12 md:col-span-5">
          <div class="md:sticky md:top-24">
            <HalftoneImage
              class="aspect-[4/3] w-full md:aspect-[4/5]"
              :src="activeImage.src"
              :alt="activeImage.alt"
              :pattern="activeImage.pattern"
              :seed="activeImage.seed"
              :lighten="0.18"
              :dot="7"
            />
          </div>
        </div>

        <div class="col-span-12 md:col-span-7 md:pl-6">
          <h2 id="cap-title" v-reveal class="display-lg mb-10 md:mb-16">{{ cap.title }}</h2>
          <ul class="rule-b">
            <li v-for="(item, i) in cap.items" :key="item.title" class="rule-t">
              <h3>
                <button
                  :id="`${uid}-btn-${i}`"
                  type="button"
                  class="group grid w-full grid-cols-[3rem_1fr_auto] items-baseline gap-2 py-5 text-left md:grid-cols-[4.5rem_1fr_auto] md:py-7"
                  :aria-expanded="open === i"
                  :aria-controls="`${uid}-panel-${i}`"
                  @click="toggle(i)"
                  @keydown="onKey($event, i)"
                >
                  <span class="label" :class="open === i ? 'text-ink' : ''">{{ String(i + 1).padStart(2, '0') }}</span>
                  <span class="display-md transition-colors group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">{{ item.title }}</span>
                  <span aria-hidden="true" class="relative block size-4 self-center">
                    <span class="absolute left-0 top-1/2 h-px w-full bg-current" />
                    <span class="absolute left-1/2 top-0 h-full w-px bg-current transition-transform duration-300" :class="open === i ? 'scale-y-0' : ''" />
                  </span>
                </button>
              </h3>
              <div
                :id="`${uid}-panel-${i}`"
                role="region"
                :aria-labelledby="`${uid}-btn-${i}`"
                class="acc-panel grid transition-[grid-template-rows] duration-500 ease-[var(--ease-out-expo)]"
                :class="open === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
                :inert="open !== i"
              >
                <div class="overflow-hidden">
                  <div class="grid grid-cols-[3rem_1fr] gap-2 pb-8 md:grid-cols-[4.5rem_1fr]">
                    <div />
                    <div>
                      <p class="text-lead max-w-xl">{{ item.body }}</p>
                      <div class="mt-5 flex flex-wrap gap-x-6">
                        <BracketLink
                          v-for="l in item.links"
                          :key="l.anchor"
                          :to="`/what-we-do#${l.anchor}`"
                          :label="'label' in l ? `Learn more: ${l.label}` : 'Learn more'"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <UiButton to="/what-we-do" block class="mt-6 !py-6">{{ site.ctas.exploreCapabilities }}</UiButton>
    </div>
  </section>
</template>
