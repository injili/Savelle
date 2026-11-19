<script setup lang="ts">
import { site } from '~~/data/site'

usePageSeo('contact')
const cp = site.contactPage
const c = site.contact
const showDrafts = useShowDrafts()
const details = [
  { label: cp.detailsLabels.general, value: c.generalEmail, href: c.generalEmail ? `mailto:${c.generalEmail}` : '' },
  { label: cp.detailsLabels.partnerships, value: c.partnershipsEmail, href: c.partnershipsEmail ? `mailto:${c.partnershipsEmail}` : '' },
  { label: cp.detailsLabels.location, value: c.location, href: '' },
  { label: cp.detailsLabels.linkedin, value: c.linkedin ? 'LinkedIn ↗' : '', href: c.linkedin },
].filter(d => d.value || showDrafts)
</script>

<template>
  <div>
    <PageHeader name="Contact" :headline="cp.headline" :paragraphs="[cp.intro]" />

    <section class="bg-white py-6 md:py-8" aria-labelledby="form-title">
      <div class="shell">
        <SectionMeta name="Enquiry" />
        <div class="grid-12 gap-y-12 pb-16 pt-12 md:pb-28 md:pt-20">
          <div class="col-span-12 md:col-span-4">
            <h2 id="form-title" v-reveal class="display-md">{{ cp.formTitle }}</h2>
            <p class="mt-6 leading-relaxed">{{ cp.formIntro }}</p>

            <dl v-if="details.length" class="rule-b mt-12">
              <div v-for="d in details" :key="d.label" class="rule-t grid grid-cols-[9rem_1fr] gap-3 py-3">
                <dt class="label opacity-70">{{ d.label }}</dt>
                <dd class="label normal-case">
                  <a v-if="d.href" :href="d.href" class="hover:underline hover:decoration-1 hover:underline-offset-4" :target="d.href.startsWith('http') ? '_blank' : undefined" :rel="d.href.startsWith('http') ? 'noopener' : undefined">{{ d.value }}</a>
                  <span v-else>{{ d.value || '[TBC]' }}</span>
                </dd>
              </div>
            </dl>

            <HalftoneImage class="mt-12 hidden aspect-[4/5] w-full md:block" :src="site.images.contact.src" :alt="site.images.contact.alt" :pattern="site.images.contact.pattern" :seed="site.images.contact.seed" tone="white" :dot="7" />
          </div>
          <div class="col-span-12 md:col-span-7 md:col-start-6">
            <EnquiryForm />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
