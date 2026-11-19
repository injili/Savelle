export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const base = config.public.siteUrl.replace(/\/$/, '')
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  // Preview/draft deployments must not be indexed.
  if (config.public.showDrafts) return 'User-agent: *\nDisallow: /\n'
  return `User-agent: *\nAllow: /\nDisallow: /dev/\nDisallow: /api/\n\nSitemap: ${base}/sitemap.xml\n`
})
