<script setup lang="ts">
import { site } from '~~/data/site'

const showDrafts = useShowDrafts()
const year = new Date().getFullYear()
const c = site.contact
const tbc = (v: string) => v || (showDrafts ? '[TBC]' : '')
</script>

<template>
  <footer class="on-ink relative z-[31] bg-ink text-paper">
    <div class="shell grid-12 gap-y-12 pb-6 pt-16 md:pt-24">
      <!-- Logo sits on its own row until lg; side by side it fills its column (max 28rem) instead of overflowing it -->
      <div class="col-span-12 lg:col-span-5">
        <LogoMark class="h-auto w-[min(70vw,28rem)] text-white lg:w-full lg:max-w-[28rem]" title="Savelle Group Africa logo" />
      </div>

      <div class="col-span-12 grid grid-cols-2 gap-y-10 md:grid-cols-3 lg:col-span-7">
        <nav aria-label="Footer" class="rule-l pl-4">
          <p class="label mb-4 text-white">Navigate</p>
          <ul class="flex flex-col gap-1.5">
            <li v-for="l in site.footerNav" :key="l.to">
              <NuxtLink :to="l.to" class="label hover:text-white"><span v-scramble.hover>{{ l.label }}</span></NuxtLink>
            </li>
          </ul>
        </nav>

        <div class="rule-l pl-4 max-md:col-span-2 max-md:order-last">
          <p class="label mb-4 text-white">Savelle Group Africa</p>
          <p class="text-sm leading-relaxed text-paper/85">{{ site.footerDescription }}</p>
        </div>

        <div class="rule-l pl-4">
          <p class="label mb-4 text-white">Contact</p>
          <ul class="flex flex-col gap-3 text-sm">
            <li v-if="tbc(c.generalEmail)">
              <span class="label block text-paper/70">{{ site.contactPage.detailsLabels.general }}</span>
              <a v-if="c.generalEmail" :href="`mailto:${c.generalEmail}`" class="hover:text-white">{{ c.generalEmail }}</a>
              <span v-else>[TBC]</span>
            </li>
            <li v-if="tbc(c.partnershipsEmail)">
              <span class="label block text-paper/70">{{ site.contactPage.detailsLabels.partnerships }}</span>
              <a v-if="c.partnershipsEmail" :href="`mailto:${c.partnershipsEmail}`" class="hover:text-white">{{ c.partnershipsEmail }}</a>
              <span v-else>[TBC]</span>
            </li>
            <li v-if="tbc(c.location)">
              <span class="label block text-paper/70">{{ site.contactPage.detailsLabels.location }}</span>
              {{ tbc(c.location) }}
            </li>
            <li v-if="tbc(c.linkedin)">
              <a v-if="c.linkedin" :href="c.linkedin" target="_blank" rel="noopener" class="label hover:text-white">LinkedIn ↗</a>
              <span v-else class="label">LinkedIn [TBC]</span>
            </li>
            <li>
              <BracketLink to="/contact" :label="site.ctas.startConversation" />
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="shell rule-t flex flex-wrap items-center justify-between gap-3 py-4">
      <p class="label">© {{ year }} Savelle Group Africa</p>
      <NuxtLink to="/privacy" class="label hover:text-white">Privacy</NuxtLink>
    </div>
  </footer>
</template>
