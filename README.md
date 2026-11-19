# Savelle Group Africa: website

Nuxt 4 · Nuxt Content v3 · Tailwind CSS v4 · GSAP + ScrollTrigger · Lenis · OGL (WebGL halftone) · deployed on Vercel.

```bash
npm install
cp .env.example .env   # fill in values (see LAUNCH_CHECKLIST.md §5)
npm run dev            # http://localhost:3000 (drafts visible, /dev/halftone test bench)
npm run build          # production build (drafts excluded)
npm run typecheck
```

## Where things live

| What | Where |
|---|---|
| Site copy (nav, footer, CTAs, page copy, values, audiences, contact, SEO table) | `data/site.ts` |
| Services / case studies / insights | `content/services`, `content/work`, `content/insights` (schemas in `content.config.ts`) |
| Draft visibility rules | `drafts.config.ts` (+ `runtimeConfig.public.showDrafts`) |
| Design tokens (colours, fonts, type scale) | `app/assets/css/main.css` → `@theme` |
| Logo (placeholder; single swap point) | `app/components/ui/LogoMark.vue` |
| Halftone system | `app/components/ui/HalftoneImage.vue`, `app/composables/useHalftone.ts`, `app/lib/halftoneShader.ts` |
| Smooth scroll / scramble / reveal | `app/composables/useLenis.ts`, `useScramble.ts`, `app/plugins/directives.ts` (`v-scramble`, `v-reveal`) |
| Page transition (stairs) | `app/utils/stairs.ts`, `app/components/site/StairsOverlay.vue`, `app/app.vue` |
| Enquiry API | `server/api/enquiry.post.ts`, `server/utils/mailer.ts`, `server/utils/rateLimit.ts` |
| Sitemap / robots | `server/routes/sitemap.xml.ts`, `server/routes/robots.txt.ts` |

## Drafts

`published: false` content is visible in `nuxt dev` and on Vercel **Preview** deployments only. In Production, unpublished case studies are removed from the build entirely, and the founder attribution and `[TBC]` contact placeholders are hidden. See `LAUNCH_CHECKLIST.md` for everything that must be resolved before launch.
