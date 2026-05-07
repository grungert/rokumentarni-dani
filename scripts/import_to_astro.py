#!/usr/bin/env python3
"""
Import extracted WP JSON content into Astro content collections.

Reads extracted/*.json (produced by extract_wp_content.py) and writes one
Markdown file per page/post into site/src/content/{pages,posts}/<slug>.md
with YAML frontmatter matching the schemas in site/src/content.config.ts.

Content cleanup:
  - WPBakery / Visual Composer shortcodes are unwrapped (inner text kept,
    container tags stripped). The legacy site relied on these heavily.
  - `[gallery ids="1,2,3"]` shortcodes are converted to a TODO marker so a
    human can decide layout.
  - URLs pointing at /wp-content/uploads/ are rewritten to /media/ so they
    line up with copy_clean_media.py output.
  - Image URLs inside post content are also rewritten to absolute /media/
    paths.

Usage:
    import_to_astro.py \\
        --extracted ./extracted \\
        --site ./site \\
        --site-url http://rokumentarnidani.me
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


# ---------------------------------------------------------------------------
# Cleanup helpers
# ---------------------------------------------------------------------------

# Match a self-closing or paired shortcode for any wpbakery / visual composer
# tag. We unwrap recursively (innermost first via repeat application).
VC_SHORTCODE_OPEN_CLOSE = re.compile(
    r"\[(vc_[a-z_0-9]+|qode_[a-z_0-9]+)(?:[^\]]*)\](.*?)\[/\1\]",
    re.DOTALL | re.IGNORECASE,
)
VC_SHORTCODE_SELF = re.compile(
    r"\[(vc_[a-z_0-9]+|qode_[a-z_0-9]+)(?:[^\]]*)\s*/?\]",
    re.IGNORECASE,
)
GALLERY_RE = re.compile(r"\[gallery\b([^\]]*)\]", re.IGNORECASE)
CAPTION_RE = re.compile(r"\[caption\b[^\]]*\](.*?)\[/caption\]", re.IGNORECASE | re.DOTALL)
GENERIC_SHORTCODE_RE = re.compile(r"\[/?[a-z][a-z_0-9-]*(?:[^\]]*)\]", re.IGNORECASE)


def _unwrap_vc_once(html: str) -> tuple[str, bool]:
    """One pass: replace [vc_X ...]inner[/vc_X] with inner. Returns (new, changed)."""
    new = VC_SHORTCODE_OPEN_CLOSE.sub(lambda m: m.group(2), html)
    return new, new != html


def strip_vc_shortcodes(html: str) -> str:
    """Repeatedly unwrap nested vc_ / qode_ shortcodes until stable."""
    for _ in range(20):  # bounded loop; nesting is rarely deep
        html, changed = _unwrap_vc_once(html)
        if not changed:
            break
    # Strip any remaining self-closing vc_/qode_ tags.
    return VC_SHORTCODE_SELF.sub("", html)


def convert_gallery(html: str) -> str:
    def repl(m: re.Match) -> str:
        attrs = m.group(1).strip()
        return f"\n\n<!-- TODO gallery: {attrs} -->\n\n"
    return GALLERY_RE.sub(repl, html)


def unwrap_caption(html: str) -> str:
    return CAPTION_RE.sub(lambda m: m.group(1), html)


def strip_remaining_shortcodes(html: str) -> str:
    """Final sweep — drop any [shortcode] still left after the targeted passes."""
    return GENERIC_SHORTCODE_RE.sub("", html)


def rewrite_urls(html: str, base_url: str | None) -> str:
    if not html:
        return html
    if base_url:
        bare = re.sub(r"^https?://", "", base_url).rstrip("/")
        # http(s)://host/wp-content/uploads/X  ->  /media/X
        html = re.sub(
            r"https?://" + re.escape(bare) + r"/wp-content/uploads/",
            "/media/",
            html,
        )
        # Other internal links http(s)://host/foo -> /foo
        html = re.sub(r"https?://" + re.escape(bare), "", html)
    # Catch-all for any /wp-content/uploads/ that slipped through.
    html = html.replace("/wp-content/uploads/", "/media/")
    return html


def collapse_blank_lines(s: str) -> str:
    s = re.sub(r"[ \t]+\n", "\n", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip() + "\n"


def clean_content(html: str, base_url: str | None) -> str:
    if not html:
        return ""
    html = unwrap_caption(html)
    html = convert_gallery(html)
    html = strip_vc_shortcodes(html)
    html = strip_remaining_shortcodes(html)
    html = rewrite_urls(html, base_url)
    return collapse_blank_lines(html)


# ---------------------------------------------------------------------------
# Frontmatter
# ---------------------------------------------------------------------------

def yaml_escape(value) -> str:
    """Tiny YAML scalar emitter for frontmatter values. Quotes when needed."""
    if value is None:
        return '""'
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, list):
        return "[" + ", ".join(yaml_escape(v) for v in value) + "]"
    s = str(value)
    if s == "":
        return '""'
    # Always quote to keep things predictable; double-quote with escaping.
    s = s.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{s}"'


def to_frontmatter(d: dict) -> str:
    lines = ["---"]
    for k, v in d.items():
        if v is None or v == "":
            continue
        lines.append(f"{k}: {yaml_escape(v)}")
    lines.append("---")
    return "\n".join(lines) + "\n"


# ---------------------------------------------------------------------------
# Importer
# ---------------------------------------------------------------------------

def safe_slug(post: dict) -> str:
    """Pick a non-empty slug, falling back to post ID."""
    slug = (post.get("post_name") or "").strip()
    if slug:
        return slug
    return f"post-{post['ID']}"


def find_attachment_url(att: dict) -> str | None:
    """Best-effort attachment URL from a post row."""
    guid = att.get("guid")
    if guid:
        return guid
    return None


def build_attachment_index(attachments: list[dict]) -> dict[int, str]:
    out = {}
    for a in attachments:
        u = find_attachment_url(a)
        if u:
            out[a["ID"]] = u
    return out


def import_post(
    post: dict,
    meta: dict,
    attachments: dict[int, str],
    base_url: str | None,
    target_dir: Path,
    extra_fields: dict | None = None,
) -> Path:
    pid = post["ID"]
    slug = safe_slug(post)
    pmeta = meta.get(str(pid)) or meta.get(pid) or {}

    featured_id_raw = pmeta.get("_thumbnail_id")
    featured_url = None
    if featured_id_raw:
        try:
            fid = int(featured_id_raw)
            url = attachments.get(fid)
            if url:
                featured_url = rewrite_urls(url, base_url)
        except (TypeError, ValueError):
            pass

    fm = {
        "title": post.get("post_title") or "(untitled)",
        "slug": slug,
        "date": post.get("post_date"),
        "modified": post.get("post_modified"),
        "status": post.get("post_status") or "publish",
        "excerpt": (post.get("post_excerpt") or "").strip() or None,
        "legacyId": pid,
        "legacyUrl": f"/{slug}/" if slug else None,
        "featuredImage": featured_url,
    }
    if extra_fields:
        fm.update(extra_fields)

    body = clean_content(post.get("post_content") or "", base_url)
    out = target_dir / f"{slug}.md"
    target_dir.mkdir(parents=True, exist_ok=True)
    out.write_text(to_frontmatter(fm) + "\n" + body)
    return out


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--extracted", type=Path, required=True)
    ap.add_argument("--site", type=Path, required=True)
    ap.add_argument("--site-url", default=None)
    args = ap.parse_args(argv)

    extracted: Path = args.extracted
    pages = json.loads((extracted / "pages.json").read_text())
    posts = json.loads((extracted / "posts.json").read_text())
    attachments = json.loads((extracted / "attachments.json").read_text()) \
        if (extracted / "attachments.json").exists() else []
    meta = json.loads((extracted / "postmeta.json").read_text())
    att_index = build_attachment_index(attachments)

    pages_dir = args.site / "src" / "content" / "pages"
    posts_dir = args.site / "src" / "content" / "posts"

    n_pages = 0
    for p in pages:
        if p["post_status"] not in ("publish", "draft"):
            continue
        if not (p.get("post_title") or "").strip():
            continue
        import_post(
            p, meta, att_index, args.site_url, pages_dir,
            extra_fields={
                "menuOrder": p.get("menu_order") or 0,
                "template": (meta.get(str(p["ID"])) or {}).get("_wp_page_template"),
            },
        )
        n_pages += 1

    n_posts = 0
    for p in posts:
        if p["post_status"] not in ("publish", "draft"):
            continue
        if not (p.get("post_title") or "").strip():
            continue
        import_post(p, meta, att_index, args.site_url, posts_dir)
        n_posts += 1

    print(f"Imported {n_pages} pages → {pages_dir}")
    print(f"Imported {n_posts} posts  → {posts_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
