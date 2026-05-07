#!/usr/bin/env python3
"""
Extract clean content from a WordPress database into JSON files.

Reads from a (local) MariaDB/MySQL instance — typically a freshly restored
dump from a compromised live site — and writes pages, posts, attachments,
menus, terms, and a small set of options to JSON. HTML strings are
sanitized to remove <script>/<iframe>/javascript: payloads and the dump's
base URL is rewritten to relative paths.

Skips Wordfence/RevSlider/LayerSlider/Yoast tables and known infected
options (e.g. widget_custom_html). Result is suitable as a migration
source for a new Astro/Next.js site.

Usage:
    extract_wp_content.py \\
        --host 127.0.0.1 --port 33307 \\
        --user root --password local_root_pw \\
        --database rokumentarni --prefix rd_ \\
        --site-url http://rokumentarnidani.me \\
        --out ./extracted
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import pymysql
import pymysql.cursors

# ---------------------------------------------------------------------------
# Sanitization
# ---------------------------------------------------------------------------

# Strip dangerous HTML constructs from post_content / excerpts.
# Conservative: remove the elements entirely (and their contents for script).
SCRIPT_RE = re.compile(r"<script\b[^>]*>.*?</script\s*>", re.IGNORECASE | re.DOTALL)
IFRAME_RE = re.compile(r"<iframe\b[^>]*>.*?</iframe\s*>", re.IGNORECASE | re.DOTALL)
ON_ATTR_RE = re.compile(r"\s+on[a-z]+\s*=\s*(?:\"[^\"]*\"|'[^']*'|[^\s>]+)", re.IGNORECASE)
JS_HREF_RE = re.compile(r"(href|src)\s*=\s*([\"'])\s*javascript:[^\"']*\2", re.IGNORECASE)
DATA_B64_RE = re.compile(r"(href|src)\s*=\s*([\"'])\s*data:[^\"']*base64,[^\"']*\2", re.IGNORECASE)


def sanitize_html(s: str | None, base_url: str | None) -> str:
    if not s:
        return ""
    s = SCRIPT_RE.sub("", s)
    s = IFRAME_RE.sub("", s)
    s = ON_ATTR_RE.sub("", s)
    s = JS_HREF_RE.sub(r'\1=""', s)
    s = DATA_B64_RE.sub(r'\1=""', s)
    if base_url:
        # http(s)://example.com/foo -> /foo
        bare = re.sub(r"^https?://", "", base_url).rstrip("/")
        s = re.sub(r"https?://" + re.escape(bare), "", s)
    return s


# ---------------------------------------------------------------------------
# Extraction
# ---------------------------------------------------------------------------

def fetch_all(cur, sql: str, *params) -> list[dict]:
    cur.execute(sql, params)
    return list(cur.fetchall())


def extract_posts(cur, prefix: str, base_url: str | None) -> dict:
    """Return dict keyed by post_type → list of records."""
    rows = fetch_all(cur, f"""
        SELECT ID, post_author, post_date, post_modified,
               post_status, post_type, post_name,
               post_title, post_content, post_excerpt,
               guid, menu_order, comment_count
        FROM {prefix}posts
        WHERE post_status IN ('publish','draft','pending','private')
          AND post_type IN ('page','post','attachment','nav_menu_item')
    """)

    by_type: dict[str, list[dict]] = {}
    for r in rows:
        # Datetimes: stringify
        for k in ("post_date", "post_modified"):
            if r[k] is not None:
                r[k] = r[k].isoformat()
        if r["post_type"] != "attachment":
            r["post_content"] = sanitize_html(r["post_content"], base_url)
            r["post_excerpt"] = sanitize_html(r["post_excerpt"], base_url)
        by_type.setdefault(r["post_type"], []).append(r)

    return by_type


def extract_postmeta(cur, prefix: str, post_ids: list[int]) -> dict[int, dict]:
    if not post_ids:
        return {}
    placeholders = ",".join(["%s"] * len(post_ids))
    # %% escapes the LIKE wildcard so pymysql doesn't try to format it.
    rows = fetch_all(cur, f"""
        SELECT post_id, meta_key, meta_value
        FROM {prefix}postmeta
        WHERE post_id IN ({placeholders})
          AND meta_key NOT LIKE '\\_edit\\_%%' ESCAPE '\\\\'
          AND meta_key NOT LIKE '\\_wp\\_old\\_%%' ESCAPE '\\\\'
    """, *post_ids)
    out: dict[int, dict] = {}
    for r in rows:
        out.setdefault(r["post_id"], {})[r["meta_key"]] = r["meta_value"]
    return out


def extract_terms(cur, prefix: str) -> list[dict]:
    return fetch_all(cur, f"""
        SELECT t.term_id, t.name, t.slug,
               tt.taxonomy, tt.description, tt.parent, tt.count
        FROM {prefix}terms t
        JOIN {prefix}term_taxonomy tt ON tt.term_id = t.term_id
        ORDER BY tt.taxonomy, t.name
    """)


def extract_term_relationships(cur, prefix: str) -> list[dict]:
    return fetch_all(cur, f"""
        SELECT tr.object_id, tr.term_taxonomy_id, tt.taxonomy
        FROM {prefix}term_relationships tr
        JOIN {prefix}term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
    """)


# Options we *do* want from wp_options. Everything else is plugin
# state, transients, or potentially-infected widget HTML.
SAFE_OPTIONS = {
    "blogname",
    "blogdescription",
    "siteurl",
    "home",
    "admin_email",
    "template",
    "stylesheet",
    "WPLANG",
    "timezone_string",
    "date_format",
    "time_format",
    "start_of_week",
    "permalink_structure",
    "default_category",
    "category_base",
    "tag_base",
    "show_on_front",
    "page_on_front",
    "page_for_posts",
}


def extract_options(cur, prefix: str) -> dict:
    placeholders = ",".join(["%s"] * len(SAFE_OPTIONS))
    rows = fetch_all(cur, f"""
        SELECT option_name, option_value
        FROM {prefix}options
        WHERE option_name IN ({placeholders})
    """, *SAFE_OPTIONS)
    return {r["option_name"]: r["option_value"] for r in rows}


def extract_users(cur, prefix: str) -> list[dict]:
    """Editorial credit only — no password hashes, no session tokens."""
    return fetch_all(cur, f"""
        SELECT ID, user_login, user_nicename, display_name,
               user_registered, user_email
        FROM {prefix}users
        ORDER BY ID
    """)


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False, default=str))
    print(f"  wrote {path}  ({path.stat().st_size:,} bytes)")


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=33307)
    ap.add_argument("--user", default="root")
    ap.add_argument("--password", default="local_root_pw")
    ap.add_argument("--database", required=True)
    ap.add_argument("--prefix", default="wp_")
    ap.add_argument("--site-url", default=None,
                    help="If given, rewrite this base URL to relative paths in HTML.")
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args(argv)

    out: Path = args.out
    out.mkdir(parents=True, exist_ok=True)

    conn = pymysql.connect(
        host=args.host, port=args.port,
        user=args.user, password=args.password,
        database=args.database, charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )
    try:
        with conn.cursor() as cur:
            print("Extracting options...")
            opts = extract_options(cur, args.prefix)
            write_json(out / "options.json", opts)

            print("Extracting users...")
            users = extract_users(cur, args.prefix)
            write_json(out / "users.json", users)

            print("Extracting posts...")
            by_type = extract_posts(cur, args.prefix, args.site_url)
            for ptype, items in by_type.items():
                write_json(out / f"{ptype}s.json", items)

            content_ids = [r["ID"] for ptype, items in by_type.items()
                           for r in items if ptype != "attachment"]
            print(f"Extracting postmeta for {len(content_ids)} content posts...")
            meta = extract_postmeta(cur, args.prefix, content_ids)
            write_json(out / "postmeta.json", meta)

            print("Extracting terms...")
            terms = extract_terms(cur, args.prefix)
            write_json(out / "terms.json", terms)

            print("Extracting term relationships...")
            tr = extract_term_relationships(cur, args.prefix)
            write_json(out / "term_relationships.json", tr)
    finally:
        conn.close()

    print(f"\nDone. Output: {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
