import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title:       z.string(),
    description: z.string(),
    pubDate:     z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author:      z.string().default('Global Wealth Radar'),
    category:    z.enum([
      'ETF Strategy',
      'Currency Risk',
      'Sovereign Risk',
      'Portfolio Theory',
      'Expat Finance',
      'Wealth Protection',
    ]),
    tags:        z.array(z.string()).default([]),
    image:       z.string().optional(),
    imageAlt:    z.string().optional(),
    isPremium:   z.boolean().default(false),
    readingTime: z.number().optional(),
    featured:    z.boolean().default(false),
  }),
});

export const collections = { blog };
