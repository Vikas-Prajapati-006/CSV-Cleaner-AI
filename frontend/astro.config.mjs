import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind({
    applyBaseStyles: true,
  }), react(), sitemap()],
  server: {
    port: 4321,
    host: true,
  }
});