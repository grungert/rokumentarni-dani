# Rokumentarni dani — site redesign

Migration of https://rokumentarnidani.me/ from a heavily compromised
WordPress install on Bluehost to a fresh Astro static site, with a
deferred path to plug in a clean headless WordPress for staff editing.

## Layout

```
docs/HEADLESS_WP.md      ← plan to add WP CMS later
extracted/               ← clean DB content (JSON) + clean media
old_website/             ← infected source files (gitignored)
scripts/                 ← scan, extract, media-copy, importer
site/                    ← Astro 5 + Tailwind frontend
```

## Quick start

```bash
# Frontend dev
cd site
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # static output to site/dist
```

## Re-running the migration end-to-end

Assuming `old_website/` and `extracted/bucanpas_*.sql` are present:

```bash
# 1. Scan for malware (read-only)
python3 scripts/wp_malware_scan.py scan ./old_website/well-known \
    --report scripts/scan-report.txt

# 2. Restore DB into a local Docker MariaDB
docker run -d --name rd-mariadb \
    -e MYSQL_ROOT_PASSWORD=local_root_pw \
    -e MYSQL_DATABASE=rokumentarni \
    -p 33307:3306 \
    -v "$PWD/old_website/bucanpas_rokumentarnidani.sql:/dump.sql:ro" \
    mariadb:11
# wait ~20s, then:
docker exec rd-mariadb sh -c \
    'mariadb -uroot -plocal_root_pw rokumentarni < /dump.sql'

# 3. Extract clean content
python3 -m venv .venv && .venv/bin/pip install pymysql
.venv/bin/python3 scripts/extract_wp_content.py \
    --database rokumentarni --prefix rd_ \
    --site-url http://rokumentarnidani.me \
    --out ./extracted

# 4. Copy clean media (allowlist only)
python3 scripts/copy_clean_media.py \
    ./old_website/well-known/wp-content/uploads \
    ./extracted/media \
    --report scripts/media-copy-report.txt

# 5. Import into Astro content collections
python3 scripts/import_to_astro.py \
    --extracted ./extracted --site ./site \
    --site-url http://rokumentarnidani.me
```

## Security notes

The legacy install was infected on multiple fronts (RCE backdoors,
weaponized core files, DB-side SEO redirect malware). See
`scripts/scan-report.txt` for the full inventory. **Do not re-deploy
any file from `old_website/`** — the new site is designed to be a
ground-up rebuild seeded with sanitized content only.

The Bluehost account hosting the original site is presumed compromised
account-wide (the malware referenced a sibling site) — coordinate with
Bluehost support before reusing the account for the new WP install.
