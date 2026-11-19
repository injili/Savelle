import tailwindcss from '@tailwindcss/vite'
import { showDraftsAtBuild } from './drafts.config'

// Drafts (unpublished case studies, forthcoming insight pages, founder placeholder,
// /dev pages) are visible in `nuxt dev` and on Vercel preview deployments only.
const showDraftsDefault = showDraftsAtBuild()

export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  devtools: { enabled: true },

  modules: ['@nuxt/content', '@nuxt/fonts', '@nuxt/image'],

  css: ['~/assets/css/main.css'],

  // components/sections/*, components/ui/*, components/site/* without path prefixes
  components: [{ path: '~/components', pathPrefix: false }],

  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en-GB' },
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      meta: [{ name: 'theme-color', content: '#1A26AE' }],
    },
  },

  runtimeConfig: {
    resendApiKey: '',
    enquiryToEmail: '',
    enquiryFromEmail: '',
    upstashRedisRestUrl: '',
    upstashRedisRestToken: '',
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      showDrafts: showDraftsDefault,
    },
  },

  $development: {
    runtimeConfig: { public: { showDrafts: true } },
  },

  content: {
    experimental: { sqliteConnector: 'native' },
  },

  fonts: {
    families: [
      { name: 'Host Grotesk', provider: 'google', weights: [300, 400, 500] },
      { name: 'JetBrains Mono', provider: 'google', weights: [400, 500] },
    ],
  },

  image: {
    domains: ['images.unsplash.com'],
    quality: 72,
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', '/sitemap.xml', '/robots.txt'],
      ignore: ['/dev'],
    },
  },

  routeRules: {
    '/dev/**': { prerender: false },
    '/api/**': { prerender: false },
  },

  typescript: { strict: true },
})
