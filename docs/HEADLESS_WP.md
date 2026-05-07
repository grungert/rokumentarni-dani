# Headless WordPress wiring — plan

The Astro site currently reads content from local Markdown files in
`site/src/content/{pages,posts}/`, seeded by `scripts/import_to_astro.py`
from the (sanitized) DB extract. This is the **fastest path to a live site**
and works without any backend.

When the festival staff need to start editing themselves, swap the markdown
loader for a live WordPress source. Astro 5's content layer makes this a
loader change, not a rewrite.

## Prerequisites (do before wiring WP)

1. **Clean WordPress install on a trusted host.**
   - Bluehost is fine **only after** the entire account has been audited and
     cleaned by Bluehost support — the existing infection touched at least
     two sibling sites (`/nvokuca/` was referenced from `wp-config.php`).
   - Alternative: spin up a fresh WP on a new $5/mo VPS or a managed host
     (Kinsta, WP Engine starter, SiteGround). Cleaner blast radius.
2. **Lock down the new WP install.**
   - 2FA on all admin users.
   - Disable file editor: `define('DISALLOW_FILE_EDIT', true);` in wp-config.
   - Disable XML-RPC.
   - Restrict `/wp-admin/` to a small set of IPs if practical.
   - Wordfence or similar; latest WP + plugins; auto-updates on.
3. **Install one of these on WP, pick one:**
   - **WPGraphQL** (recommended) — single GraphQL endpoint, easy to query.
   - Native **REST API** — already built-in, no extra plugin.
4. **Re-create content types in WP** to match what we have today:
   - Pages (built-in)
   - Posts (built-in, used for "Novosti")
   - Custom post type `edition` (one entry per festival year), or use a
     "year" taxonomy on pages — decide based on how staff want to navigate.

## Astro side: switch the loader

In `site/src/content.config.ts`, replace the `glob()` loader with a custom
loader that fetches WP at build time. Sketch using REST:

```ts
import { defineCollection, z } from "astro:content";
import type { Loader } from "astro/loaders";

const WP = "https://cms.rokumentarnidani.me/wp-json/wp/v2";

function wpLoader(endpoint: string): Loader {
  return {
    name: `wp:${endpoint}`,
    async load({ store, parseData }) {
      let page = 1;
      while (true) {
        const res = await fetch(`${WP}/${endpoint}?per_page=100&page=${page}`);
        if (res.status === 400) break; // out of pages
        const items = await res.json();
        for (const it of items) {
          const data = await parseData({
            id: String(it.id),
            data: {
              title: it.title.rendered,
              slug: it.slug,
              date: new Date(it.date),
              modified: new Date(it.modified),
              status: it.status,
              excerpt: it.excerpt.rendered,
              legacyId: it.id,
              legacyUrl: `/${it.slug}/`,
              // featuredImage: needs a second fetch to /media/{id}
            },
          });
          store.set({ id: String(it.id), data, body: it.content.rendered });
        }
        if (items.length < 100) break;
        page++;
      }
    },
  };
}

const pages = defineCollection({ loader: wpLoader("pages"), schema: /* same */ });
const posts = defineCollection({ loader: wpLoader("posts"), schema: /* same */ });
```

The page templates (`[...slug].astro`, `blog/[slug].astro`) need no changes —
they consume the collection regardless of source.

## Build/deploy flow

- **Frontend**: deploy `site/` to Vercel or Netlify. Both run `pnpm build`
  on every push and on incoming webhooks.
- **WP webhook → rebuild**: install a tiny plugin or use existing
  "Deploy hook" plugins so that publishing in WP pings Vercel/Netlify's
  build hook URL → site rebuilds in ~30s and deploys.
- Result: staff press Publish in familiar WP admin → static site updates
  automatically. No PHP serves visitors. WP is locked down behind admin auth.

## Migration of existing content into the new WP

When the new clean WP is up:

1. Use the same `extracted/*.json` we already have to seed the new WP via
   `wp-cli`:
   ```bash
   wp post create --post_type=page --post_title="O festivalu" \
     --post_content="$(cat extracted/pages/o-festivalu.html)" \
     --post_status=publish
   ```
   (Wrap in a small shell loop driven by `pages.json`.)
2. Upload media via `wp media import extracted/media/**/*.{jpg,png,...}`.
3. Re-link featured images using postmeta from `postmeta.json`.

This is straightforward; happy to write the seed script when WP is up.

## What stays the same

- All page templates and components.
- The content schema in `content.config.ts` (only the loader changes).
- The `/media/` URL convention — point it at WP's uploads bucket later
  (or keep it on the static host's CDN and let WP only serve metadata).
