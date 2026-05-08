#!/usr/bin/env python3
"""
Normalize a multi-shaded pixel-art SVG to two CSS-variable fill groups.

The 2018 Rokumentarni dani logo, exported from Illustrator, uses dozens of
slightly different cyan and off-white hex codes (anti-aliasing relics).
This script clusters them into two groups and rewrites every fill to a
CSS custom property:

    cyan-ish  → fill="var(--logo-fill, #39c7e2)"
    white-ish → fill="var(--logo-bg,   #f5f1e8)"

Anything outside both groups (e.g. a stray dark accent) is left untouched.
The result is recolourable with two CSS variables — set both, neither,
or just one.

Usage:
    normalize_logo_svg.py <input.svg> <output.svg>
                          [--cyan #39c7e2] [--bg #f5f1e8]
                          [--no-bg]   # drop the off-white cells entirely
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


HEX_RE = re.compile(r'fill="(#[0-9A-Fa-f]{6})"')
SVG_OPEN_RE = re.compile(r"<svg\b([^>]*)>", re.IGNORECASE)
WIDTH_RE = re.compile(r'\bwidth\s*=\s*"([^"]+)"')
HEIGHT_RE = re.compile(r'\bheight\s*=\s*"([^"]+)"')
VIEWBOX_RE = re.compile(r'\bviewBox\s*=\s*"[^"]+"', re.IGNORECASE)


def ensure_viewbox(svg: str) -> str:
    """Some Illustrator exports omit viewBox and only set width/height,
    which makes the SVG render at fixed pixel size and clip when scaled
    via CSS. Inject a viewBox derived from width/height if missing."""

    def fix(m: re.Match) -> str:
        attrs = m.group(1)
        if VIEWBOX_RE.search(attrs):
            return m.group(0)
        w = WIDTH_RE.search(attrs)
        h = HEIGHT_RE.search(attrs)
        if not (w and h):
            return m.group(0)
        try:
            wv = float(w.group(1).rstrip("px"))
            hv = float(h.group(1).rstrip("px"))
        except ValueError:
            return m.group(0)
        # Drop fixed pixel width/height so CSS sizing wins, then inject viewBox.
        attrs = WIDTH_RE.sub("", attrs)
        attrs = HEIGHT_RE.sub("", attrs)
        return f'<svg{attrs} viewBox="0 0 {int(wv)} {int(hv)}">'

    return SVG_OPEN_RE.sub(fix, svg, count=1)


def hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def classify(rgb: tuple[int, int, int]) -> str:
    r, g, b = rgb
    # Cyan signature: blue and green dominant, red low.
    if b >= 180 and g >= 150 and r < 120:
        return "cyan"
    # White-ish: all three channels high (>= 220) — captures the off-whites
    # like #FAF4F5, #F9F2F3, #FBF6F7, etc.
    if r >= 220 and g >= 220 and b >= 220:
        return "white"
    return "other"


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("input", type=Path)
    ap.add_argument("output", type=Path)
    ap.add_argument("--cyan", default="#4ac5e4",
                    help="Default value of --logo-fill if no CSS var is set.")
    ap.add_argument("--bg", default="#f5f1e8",
                    help="Default value of --logo-bg if no CSS var is set.")
    ap.add_argument("--no-bg", action="store_true",
                    help="Drop the off-white grid cells entirely (useful for "
                    "dark-background placements where the grid should be "
                    "transparent).")
    args = ap.parse_args(argv)

    src = args.input.read_text()
    src = ensure_viewbox(src)
    cyan_repl = f'fill="var(--logo-fill, {args.cyan})"'
    bg_repl = f'fill="var(--logo-bg, {args.bg})"'

    counts = {"cyan": 0, "white": 0, "other": 0}
    seen_other: set[str] = set()

    def repl(m: re.Match) -> str:
        h = m.group(1)
        kind = classify(hex_to_rgb(h))
        counts[kind] += 1
        if kind == "cyan":
            return cyan_repl
        if kind == "white":
            return 'fill="transparent"' if args.no_bg else bg_repl
        seen_other.add(h.upper())
        return m.group(0)

    out = HEX_RE.sub(repl, src)

    # If --no-bg, also drop any opacity attribute on transparent paths so
    # they stay invisible regardless of the user's CSS.
    if args.no_bg:
        out = re.sub(
            r'fill="transparent"[^/]*?opacity="[\d.]+"',
            'fill="transparent" opacity="0"',
            out,
        )

    args.output.write_text(out)
    print(
        f"Wrote {args.output}\n"
        f"  cyan paths : {counts['cyan']}\n"
        f"  bg paths   : {counts['white']}\n"
        f"  other      : {counts['other']}"
        + (f"  ({sorted(seen_other)})" if seen_other else ""),
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
