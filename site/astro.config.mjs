// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

import { legacyRedirects } from './src/data/legacy-redirects.ts';

// https://astro.build/config
export default defineConfig({
  // Apsolutne adrese u JSON-LD-u, kanonskim linkovima i OG oznakama.
  site: 'https://rokumentarnidani.me',

  // Stare WP adrese vode na svoja nova mjesta — spisak je u
  // src/data/legacy-redirects.ts, isti koji [...slug].astro koristi da ih
  // izuzme iz generisanja.
  redirects: legacyRedirects,

  integrations: [
    sitemap({
      // Probne i preusmjerene adrese nemaju šta da traže u sitemap-u.
      filter: (page) =>
        !Object.keys(legacyRedirects).some((path) => page.endsWith(path)),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
    server: {
      // Allow tunnel hosts (cloudflared, ngrok, localtunnel) to reach the
      // dev server. Vite 5+ rejects external hostnames by default.
      allowedHosts: [".trycloudflare.com", ".ngrok-free.app", ".ngrok.io", ".loca.lt"],
    },
  }
});
