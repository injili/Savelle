<script setup lang="ts">
import { site } from '~~/data/site'

usePageSeo('insights')
const route = useRoute()
const router = useRouter()
const { data: insights } = await useInsightsList()

const cats = site.insights.categories
const active = computed(() => {
  const c = String(route.query.category ?? '')
  return cats.some(x => x.id === c) ? c : 'all'
})
const activeCat = computed(() => cats.find(c => c.id === active.value))
const filtered = computed(() => (insights.value ?? []).filter(i => active.value === 'all' || i.category === active.value))

function select(id: string) {
  router.replace({ query: id === 'all' ? {} : { category: id } })
}
</script>

<template>
  <div>
    <PageHeader name="Insights" :headline="site.insights.headline" :paragraphs="[site.insights.intro]" />

    <section class="bg-paper py-6 md:py-8" aria-labelledby="articles-title">
      <div class="shell">
        <SectionMeta name="Articles" />
        <h2 id="articles-title" class="sr-only">Articles</h2>

        <div class="flex flex-wrap gap-2 pt-10" role="group" aria-label="Filter by category">
          <button
            v-for="c in [{ id: 'all', title: site.insights.allLabel }, ...cats]"
            :key="c.id"
            type="button"
            class="label border px-3 py-2 transition-colors"
            :class="active === c.id ? 'border-ink bg-ink text-paper' : 'border-[var(--color-rule-dark)] hover:border-ink'"
            :aria-pressed="active === c.id"
            @click="select(c.id)"
          >
            {{ c.title }}
          </button>
        </div>

        <p class="mt-6 min-h-[3rem] max-w-2xl leading-relaxed" aria-live="polite">
          {{ activeCat?.body ?? '' }}
        </p>

        <div class="grid gap-3 pb-16 pt-6 sm:grid-cols-2 lg:grid-cols-3 md:pb-28">
          <InsightCard v-for="(item, i) in filtered" :key="item.slug" :item="item" :filled="i === 0" />
        </div>
      </div>
    </section>

    <ClosingCtaSection :cta="site.ctas.discussChallenge" />
  </div>
</template>
