import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://globalwealthradar.com',
  base: '/',
  output: 'static',
  integrations: [
    tailwind(),
    mdx(),
    sitemap({
      filter: (page) =>
        !page.includes('/premium/') &&
        !page.includes('/auth/') &&
        !page.includes('/dashboard'),
    }),
  ],
  build: { assets: '_assets' },
});
