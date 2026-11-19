import { z } from 'zod'
import { site } from '~~/data/site'

const enquiryTypes = site.contactPage.enquiryTypes as [string, ...string[]]

const schema = z.object({
  fullName: z.string().trim().min(1).max(120),
  organisation: z.string().trim().max(160).optional().default(''),
  email: z.string().trim().email().max(200),
  location: z.string().trim().max(120).optional().default(''),
  enquiryType: z.enum(enquiryTypes),
  challenge: z.string().trim().min(10).max(5000),
  timeframe: z.string().trim().max(120).optional().default(''),
  website: z.string().optional().default(''), // honeypot
  elapsedMs: z.number().optional(),
})

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c]!))

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const { ok } = await rateLimit(`enquiry:${ip}`, 5, 60 * 10)
  if (!ok) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests' })
  }

  const parsed = schema.safeParse(await readBody(event).catch(() => null))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid enquiry', data: parsed.error.flatten().fieldErrors })
  }
  const d = parsed.data

  // Bots: filled honeypot or submitted implausibly fast. Pretend success, send nothing.
  if (d.website || (d.elapsedMs !== undefined && d.elapsedMs < 2500)) {
    return { ok: true }
  }

  const config = useRuntimeConfig()
  const mailer = getMailer()
  if (!mailer || (mailer.name !== 'console' && (!config.enquiryToEmail || !config.enquiryFromEmail))) {
    console.error('[enquiry] Mail is not configured (NUXT_RESEND_API_KEY / NUXT_ENQUIRY_TO_EMAIL / NUXT_ENQUIRY_FROM_EMAIL)')
    throw createError({ statusCode: 503, statusMessage: 'Enquiries are temporarily unavailable' })
  }

  const f = site.contactPage.fields
  const rows: [string, string][] = [
    [f.fullName, d.fullName],
    [f.organisation, d.organisation],
    [f.email, d.email],
    [f.location, d.location],
    [f.enquiryType, d.enquiryType],
    [f.challenge, d.challenge],
    [f.timeframe, d.timeframe],
  ]
  const text = rows.map(([k, v]) => `${k}:\n${v || '—'}`).join('\n\n')
  const html = `<h2 style="font-family:sans-serif">New website enquiry</h2><table cellpadding="6" style="font-family:sans-serif;border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><th align="left" valign="top" style="border-bottom:1px solid #ddd">${esc(k)}</th><td style="border-bottom:1px solid #ddd;white-space:pre-wrap">${esc(v || '—')}</td></tr>`)
    .join('')}</table>`

  try {
    await mailer.send({
      to: config.enquiryToEmail || 'dev@localhost',
      from: config.enquiryFromEmail || 'dev@localhost',
      replyTo: d.email,
      subject: `Website enquiry: ${d.enquiryType}, ${d.fullName}${d.organisation ? ` (${d.organisation})` : ''}`,
      text,
      html,
    })
  }
  catch (err) {
    console.error('[enquiry] send failed', err)
    throw createError({ statusCode: 502, statusMessage: 'Could not send enquiry' })
  }

  return { ok: true }
})
