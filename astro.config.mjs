// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages project site: https://jenin-23.github.io/qal-qeel-al-khalil/
export default defineConfig({
  site: 'https://jenin-23.github.io',
  base: '/qal-qeel-al-khalil',
  trailingSlash: 'ignore',
  build: {
    // src/pages/issues/[issue]/news.astro -> issues/001/news.html
    format: 'preserve',
  },
  devToolbar: { enabled: false },
});
