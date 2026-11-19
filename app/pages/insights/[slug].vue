<script setup lang="ts">
import { site } from '~~/data/site'

// Article template: ready for when real (published) insights exist.
const route = useRoute()
const slug = String(route.params.slug)
const showDrafts = useShowDrafts()

const { data: post } = await useAsyncData(`insight-${slug}`, () => queryCollection('insights').path(`/insights/${slug}`).first())
if (!post.value || (!post.value.published && !showDrafts)) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}
const p = post.value

usePageSeo(null, {
  title: `${p.title} | Savelle Group Africa`,
  description: p.summary,
  noindex: !p.published,
})

const { data: services } = await useServicesList()
const related = computed(() => services.value?.find(s => s.anchor === p.relatedService))
const dateLabel = p.date
  ? new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  : (showDrafts ? '[Date TBC]' : '')
const author = p.author || (showDrafts ? '[Author TBC]' : '')
const hasBody = computed(() => (p.body?.value?.length ?? 0) > 0)
</script>

<template>
  <article>
    <p v-if="!p.published" class="label fixed bottom-3 left-1/2 z-[60] -translate-x-1/2 bg-white px-3 py-1.5 text-ink">
      Forthcoming: not published (visible in dev/preview only)
    </p>

    <header class="bg-paper pt-24 md:pt-28">
      <div class="shell">
        <SectionMeta :name="`Insights / ${categoryTitle(p.category)}`" />
        <div class="grid-12 gap-y-8 pb-12 pt-12 md:pb-20 md:pt-20">
          <NuxtLink to="/insights" class="label col-span-12 hover:underline hover:decoration-1 hover:underline-offset-4">← Insights</NuxtLink>
          <h1 v-reveal="{ wait: true }" class="display-lg col-span-12 lg:col-span-10">{{ p.title }}</h1>
          <dl class="col-span-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:col-span-6">
            <div class="rule-l pl-3">
              <dt class="label opacity-70">Category</dt>
              <dd class="label">{{ categoryTitle(p.category) }}</dd>
            </div>
            <div v-if="author" class="rule-l pl-3">
              <dt class="label opacity-70">Author</dt>
              <dd class="label">{{ author }}</dd>
            </div>
            <div v-if="dateLabel" class="rule-l pl-3">
              <dt class="label opacity-70">Published</dt>
              <dd class="label"><time :datetime="p.date">{{ dateLabel }}</time></dd>
            </div>
          </dl>
          <p class="text-lead col-span-12 md:col-span-6 md:col-start-7">{{ p.summary }}</p>
        </div>
      </div>
    </header>

    <section class="bg-white py-12 md:py-20" aria-label="Article">
      <div class="shell grid-12">
        <div class="prose-savelle col-span-12 md:col-span-7 md:col-start-4">
          <ContentRenderer v-if="hasBody" :value="p" />
          <p v-else class="label">{{ site.insights.forthcoming }}</p>
        </div>
      </div>
    </section>

    <section class="bg-paper py-6" aria-label="Related">
      <div class="shell">
        <div class="rule-t flex flex-wrap items-center justify-between gap-4 py-6">
          <p v-if="related" class="label">Related capability: {{ related.title }}</p>
          <div class="flex flex-wrap gap-6">
            <BracketLink v-if="related" :to="`/what-we-do#${related.anchor}`" label="Learn more" />
            <BracketLink :to="`/contact?enquiry=${encodeURIComponent(site.serviceEnquiryType[p.relatedService] ?? '')}`" :label="site.ctas.submitEnquiry" />
          </div>
        </div>
      </div>
    </section>

    <ClosingCtaSection />
  </article>
</template>

<style scoped>
.prose-savelle :deep(p) { font-size: 1.125rem; line-height: 1.65; margin-block: 1.1em; }
.prose-savelle :deep(h2) { font-size: clamp(1.5rem, 1.2rem + 1vw, 2.25rem); line-height: 1.1; letter-spacing: -0.02em; margin-top: 2em; }
.prose-savelle :deep(h3) { font-size: 1.375rem; margin-top: 1.6em; }
.prose-savelle :deep(ul) { list-style: disc; padding-left: 1.25em; }
.prose-savelle :deep(ol) { list-style: decimal; padding-left: 1.25em; }
.prose-savelle :deep(a) { text-decoration: underline; text-underline-offset: 3px; }
.prose-savelle :deep(a:hover) { text-decoration-thickness: 2px; }
.prose-savelle :deep(blockquote) { border-left: 2px solid var(--color-ink); padding-left: 1em; font-size: 1.375rem; }
</style>
