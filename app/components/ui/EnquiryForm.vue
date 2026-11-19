<script setup lang="ts">
import { site } from '~~/data/site'

const cp = site.contactPage
const f = cp.fields
const m = cp.messages
const route = useRoute()

const initialType = String(route.query.enquiry ?? '')
const form = reactive({
  fullName: '',
  organisation: '',
  email: '',
  location: '',
  enquiryType: cp.enquiryTypes.includes(initialType) ? initialType : '',
  challenge: '',
  timeframe: '',
  website: '', // honeypot
})

type Field = 'fullName' | 'email' | 'enquiryType' | 'challenge'
const required: Field[] = ['fullName', 'email', 'enquiryType', 'challenge']
const errors = reactive<Partial<Record<Field, string>>>({})
const status = ref<'idle' | 'sending' | 'success' | 'error'>('idle')
const statusMessage = ref('')
const statusEl = ref<HTMLElement | null>(null)
const startedAt = Date.now()

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

function validate() {
  for (const k of required) delete errors[k]
  if (!form.fullName.trim()) errors.fullName = m.fieldErrors.fullName
  if (!emailOk(form.email.trim())) errors.email = m.fieldErrors.email
  if (!form.enquiryType) errors.enquiryType = m.fieldErrors.enquiryType
  if (form.challenge.trim().length < 10) errors.challenge = m.fieldErrors.challenge
  return Object.keys(errors).length === 0
}

async function submit() {
  if (status.value === 'sending') return
  if (!validate()) {
    status.value = 'error'
    statusMessage.value = m.invalid
    await nextTick()
    const first = required.find(k => errors[k])
    if (first) document.getElementById(`enq-${first}`)?.focus()
    return
  }
  status.value = 'sending'
  statusMessage.value = m.sending
  try {
    await $fetch('/api/enquiry', { method: 'POST', body: { ...form, elapsedMs: Date.now() - startedAt } })
    status.value = 'success'
    statusMessage.value = m.success
  }
  catch (err: unknown) {
    const code = (err as { statusCode?: number })?.statusCode
    status.value = 'error'
    statusMessage.value = code === 429 ? m.rateLimited : code === 400 ? m.invalid : m.error
  }
  await nextTick()
  statusEl.value?.focus()
}

const inputClass = 'w-full border-0 border-b border-ink/40 bg-transparent px-0 py-3 text-lg outline-none transition-colors focus:border-ink focus-visible:outline-none focus:shadow-[0_2px_0_0_var(--color-ink)] aria-[invalid=true]:border-b-2 aria-[invalid=true]:border-ink'
</script>

<template>
  <div>
    <div
      v-if="status === 'success'"
      ref="statusEl"
      tabindex="-1"
      role="status"
      class="on-ink bg-ink p-6 text-paper md:p-8"
    >
      <p class="label text-white">{{ cp.submit }}</p>
      <p class="text-lead mt-4">{{ statusMessage }}</p>
    </div>

    <form v-else novalidate class="grid gap-x-6 gap-y-8 sm:grid-cols-2" @submit.prevent="submit">
      <div>
        <label for="enq-fullName" class="label flex justify-between">{{ f.fullName }} <span class="opacity-60">{{ m.required }}</span></label>
        <input id="enq-fullName" v-model="form.fullName" type="text" name="fullName" autocomplete="name" required maxlength="120" :class="inputClass" :aria-invalid="!!errors.fullName" :aria-describedby="errors.fullName ? 'err-fullName' : undefined">
        <p v-if="errors.fullName" id="err-fullName" class="label mt-2 normal-case">{{ errors.fullName }}</p>
      </div>

      <div>
        <label for="enq-organisation" class="label flex justify-between">{{ f.organisation }} <span class="opacity-60">{{ m.optional }}</span></label>
        <input id="enq-organisation" v-model="form.organisation" type="text" name="organisation" autocomplete="organization" maxlength="160" :class="inputClass">
      </div>

      <div>
        <label for="enq-email" class="label flex justify-between">{{ f.email }} <span class="opacity-60">{{ m.required }}</span></label>
        <input id="enq-email" v-model="form.email" type="email" name="email" autocomplete="email" required maxlength="200" :class="inputClass" :aria-invalid="!!errors.email" :aria-describedby="errors.email ? 'err-email' : undefined">
        <p v-if="errors.email" id="err-email" class="label mt-2 normal-case">{{ errors.email }}</p>
      </div>

      <div>
        <label for="enq-location" class="label flex justify-between">{{ f.location }} <span class="opacity-60">{{ m.optional }}</span></label>
        <input id="enq-location" v-model="form.location" type="text" name="location" autocomplete="country-name" maxlength="120" :class="inputClass">
      </div>

      <div class="sm:col-span-2">
        <label for="enq-enquiryType" class="label flex justify-between">{{ f.enquiryType }} <span class="opacity-60">{{ m.required }}</span></label>
        <div class="relative">
          <select id="enq-enquiryType" v-model="form.enquiryType" name="enquiryType" required :class="[inputClass, 'appearance-none pr-8']" :aria-invalid="!!errors.enquiryType" :aria-describedby="errors.enquiryType ? 'err-enquiryType' : undefined">
          <option value="" disabled>{{ m.selectPlaceholder }}</option>
          <option v-for="t in cp.enquiryTypes" :key="t" :value="t">{{ t }}</option>
        </select>
          <svg viewBox="0 0 16 16" class="pointer-events-none absolute right-0 top-1/2 size-4 -translate-y-1/2" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 6l5 5 5-5" /></svg>
        </div>
        <p v-if="errors.enquiryType" id="err-enquiryType" class="label mt-2 normal-case">{{ errors.enquiryType }}</p>
      </div>

      <div class="sm:col-span-2">
        <label for="enq-challenge" class="label flex justify-between">{{ f.challenge }} <span class="opacity-60">{{ m.required }}</span></label>
        <textarea id="enq-challenge" v-model="form.challenge" name="challenge" rows="5" required maxlength="5000" :class="[inputClass, 'resize-y']" :aria-invalid="!!errors.challenge" :aria-describedby="errors.challenge ? 'err-challenge' : undefined" />
        <p v-if="errors.challenge" id="err-challenge" class="label mt-2 normal-case">{{ errors.challenge }}</p>
      </div>

      <div class="sm:col-span-2">
        <label for="enq-timeframe" class="label flex justify-between">{{ f.timeframe }} <span class="opacity-60">{{ m.optional }}</span></label>
        <input id="enq-timeframe" v-model="form.timeframe" type="text" name="timeframe" maxlength="120" :class="inputClass">
      </div>

      <!-- Honeypot: hidden from people and assistive tech -->
      <div class="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label for="enq-website">Website</label>
        <input id="enq-website" v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off">
      </div>

      <div class="sm:col-span-2">
        <p
          v-if="status === 'error' || status === 'sending'"
          ref="statusEl"
          tabindex="-1"
          :role="status === 'error' ? 'alert' : 'status'"
          class="label mb-4 normal-case"
          :class="status === 'error' ? 'font-medium' : ''"
        >
          {{ statusMessage }}
        </p>
        <UiButton type="submit" block :disabled="status === 'sending'">{{ cp.submit }}</UiButton>
        <p class="mt-4 text-sm leading-relaxed">
          {{ cp.privacyNote }}
          <NuxtLink to="/privacy" class="underline underline-offset-2 hover:decoration-2">{{ cp.privacyLinkText }}</NuxtLink>
        </p>
      </div>
    </form>
  </div>
</template>
