import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@tailwindcss/vite';
import { remarkCallouts, remarkWikilinksAndTags, remarkRemoveMetadataBlock } from './src/utils/remark-plugins.js';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwind()],
  },
  markdown: {
    remarkPlugins: [
      remarkRemoveMetadataBlock,
      remarkWikilinksAndTags,
      remarkCallouts
    ]
  }
});
