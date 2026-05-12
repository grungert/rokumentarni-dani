// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    server: {
      // Allow tunnel hosts (cloudflared, ngrok, localtunnel) to reach the
      // dev server. Vite 5+ rejects external hostnames by default.
      allowedHosts: [".trycloudflare.com", ".ngrok-free.app", ".ngrok.io", ".loca.lt"],
    },
  }
});