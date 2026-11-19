import { site } from '~~/data/site'

type SeoKey = keyof typeof site.seo

/**
 * Title + meta description from the B11 SEO table (data/site.ts), plus OG/Twitter
 * and canonical. Pass overrides for pages that aren't in the table.
 */
export function usePageSeo(key: SeoKey | null, overrides: { title?: string, description?: string, noindex?: boolean } = {}) {
  const config = useRuntimeConfig()
  const route = useRoute()
  const base = key ? site.seo[key] : { title: site.name, description: site.brand.positioning }
  const title = overrides.title ?? base.title
  const description = overrides.description ?? base.description
  const url = `${config.public.siteUrl}${route.path === '/' ? '' : route.path}`
  const image = `${config.public.siteUrl}/og-image.png`

  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogType: 'website',
    ogUrl: url,
    ogSiteName: site.name,
    ogImage: image,
    ogImageAlt: site.name,
    ogLocale: 'en_GB',
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image,
    robots: overrides.noindex ? 'noindex, nofollow' : undefined,
  })
  useHead({ link: [{ rel: 'canonical', href: url }] })
}
