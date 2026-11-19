import { queryCollection } from '@nuxt/content/server'

// Static pages + PUBLISHED case studies and insights only (never drafts).
const STATIC = ['/', '/about', '/what-we-do', '/our-approach', '/our-work', '/insights', '/contact', '/privacy']

export default defineEventHandler(async (event) => {
  const base = useRuntimeConfig().public.siteUrl.replace(/\/$/, '')
  const [work, insights] = await Promise.all([
    queryCollection(event, 'work').all(),
    queryCollection(event, 'insights').all(),
  ])
  const dynamic = [
    ...work.filter(w => w.published).map(w => `/our-work/${w.path.split('/').pop()}`),
    ...insights.filter(i => i.published).map(i => `/insights/${i.path.split('/').pop()}`),
  ]
  const urls = [...STATIC, ...dynamic]
    .map(p => `  <url><loc>${base}${p === '/' ? '/' : p}</loc></url>`)
    .join('\n')

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
})
