import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';



export default defineConfig({
  site: 'https://globalwealthradar.com',
  base: '/global-wealth-radar/',
  output: 'static',
  integrations: [
    tailwind(),
    mdx(),
    
  ],
  build: { assets: '_assets' },
});
