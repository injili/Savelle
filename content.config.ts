import { defineCollection, defineContentConfig, z } from '@nuxt/content'
import { showDraftsAtBuild, unpublishedFiles } from './drafts.config'

// Production builds drop unpublished case studies from the collection entirely
// (otherwise their text ships in the public client-side content dump).
const workExclude = showDraftsAtBuild() ? [] : unpublishedFiles('work')

export default defineContentConfig({
  collections: {
    services: defineCollection({
      type: 'data',
      source: 'services/*.md',
      schema: z.object({
        order: z.number(),
        anchor: z.string(),
        title: z.string(),
        shortTitle: z.string(),
        tagline: z.string(),
        description: z.string(),
        typicalAreas: z.array(z.string()),
        whatYouCanExpect: z.string(),
      }),
    }),

    work: defineCollection({
      type: 'page',
      source: { include: 'work/*.md', exclude: workExclude },
      schema: z.object({
        order: z.number(),
        sector: z.string(),
        // 'completed-to-confirm' until the publication gate is cleared
        status: z.enum(['completed', 'completed-to-confirm', 'proposed']),
        label: z.string().optional(),
        published: z.boolean().default(false),
        challenge: z.string(),
        contribution: z.string().optional(),
        proposedContribution: z.string().optional(),
        strategicFocus: z.string(),
        whatThisDemonstrates: z.string(),
        relatedService: z.string().optional(),
        // Empty until photography is supplied; the card falls back to a procedural halftone.
        image: z.string().optional(),
        imageAlt: z.string().optional(),
        pattern: z.enum(['flow', 'contour', 'network', 'orbits', 'ribbon']).default('network'),
        // Where the engagement took place: the home page draws this country as a 3D map.
        country: z.enum(['nigeria', 'kenya', 'benin']).optional(),
      }),
    }),

    insights: defineCollection({
      type: 'page',
      source: 'insights/*.md',
      schema: z.object({
        order: z.number(),
        summary: z.string(),
        category: z.enum(['research-analysis', 'strategy-systems', 'foresight-futures', 'data-intelligence']),
        author: z.string().optional(),
        date: z.string().optional(),
        relatedService: z.string(),
        published: z.boolean().default(false),
        image: z.string().optional(),
        imageAlt: z.string().optional(),
      }),
    }),
  },
})
