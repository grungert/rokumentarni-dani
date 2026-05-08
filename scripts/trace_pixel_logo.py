#!/usr/bin/env python3
"""
Trace a pixel-art PNG into a crisp SVG.

The 2018 Rokumentarni dani logo is hand-drawn pixel art at PNG resolution.
We detect the underlying grid by snapping to a square cell size, classify
each cell as "fill" / "outline" / "empty" by sampling its center colour,
and emit one <rect> per cell. Output uses `currentColor` so it can be
recoloured via CSS.

Usage:
    trace_pixel_logo.py <input.png> <output.svg> [--cell-size N]
                                                 [--two-color]
                                                 [--threshold 0.5]

Notes:
  - --cell-size lets you override autodetection if the result looks off.
  - --two-color keeps both fill and outline as separate <g>s so the
    consumer can colour them independently.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image


def detect_cell_size(img: Image.Image, alpha_threshold: int = 32) -> int:
    """Find the pixel-art cell size by scanning the first opaque row.

    The image is integer-multiples of the cell size (with a small inset
    border in some exports). We walk left→right and count run-lengths of
    contiguous opaque pixels, then return the GCD of the runs.
    """
    from math import gcd
    from functools import reduce

    px = img.load()
    w, h = img.size
    runs: list[int] = []

    for y in range(h):
        run = 0
        row_runs: list[int] = []
        for x in range(w):
            a = px[x, y][3]
            if a > alpha_threshold:
                run += 1
            else:
                if run:
                    row_runs.append(run)
                run = 0
        if run:
            row_runs.append(run)
        if len(row_runs) >= 3:
            runs.extend(row_runs)
        if len(runs) > 60:
            break

    if not runs:
        return 20
    g = reduce(gcd, runs)
    return max(g, 4)


def sample_cell(img: Image.Image, x0: int, y0: int, size: int) -> tuple[int, int, int, int]:
    """Average a small patch at the centre of (x0, y0)–(x0+size, y0+size)."""
    px = img.load()
    cx, cy = x0 + size // 2, y0 + size // 2
    samples = []
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            x = max(0, min(img.size[0] - 1, cx + dx * (size // 5 or 1)))
            y = max(0, min(img.size[1] - 1, cy + dy * (size // 5 or 1)))
            samples.append(px[x, y])
    n = len(samples)
    r = sum(s[0] for s in samples) // n
    g = sum(s[1] for s in samples) // n
    b = sum(s[2] for s in samples) // n
    a = sum(s[3] for s in samples) // n
    return r, g, b, a


def classify(rgba: tuple[int, int, int, int]) -> str:
    """Return 'fill' / 'outline' / 'empty' for a sampled cell colour.

    Heuristic: cyan-ish brights → fill, dark colours → outline,
    transparent/whitish → empty.
    """
    r, g, b, a = rgba
    if a < 64:
        return "empty"
    luma = (0.299 * r + 0.587 * g + 0.114 * b)
    # Outline pixels in this logo are deep navy.
    if luma < 60:
        return "outline"
    # Fill pixels are bright (cyan or whatever colour). Ignore near-whites,
    # which can leak in from anti-aliasing on transparent borders.
    if r > 230 and g > 230 and b > 230:
        return "empty"
    return "fill"


def trim_box(cells: list[list[str]]) -> tuple[int, int, int, int]:
    """Return (x0, y0, x1, y1) bounding box of non-empty cells."""
    rows = len(cells)
    cols = len(cells[0]) if rows else 0
    x0, y0, x1, y1 = cols, rows, 0, 0
    for r in range(rows):
        for c in range(cols):
            if cells[r][c] != "empty":
                x0 = min(x0, c)
                y0 = min(y0, r)
                x1 = max(x1, c + 1)
                y1 = max(y1, r + 1)
    if x1 <= x0:
        return 0, 0, cols, rows
    return x0, y0, x1, y1


def emit_svg(
    cells: list[list[str]],
    *,
    two_color: bool,
    title: str,
) -> str:
    x0, y0, x1, y1 = trim_box(cells)
    w = x1 - x0
    h = y1 - y0

    fill_rects = []
    outline_rects = []
    for r in range(y0, y1):
        for c in range(x0, x1):
            kind = cells[r][c]
            if kind == "empty":
                continue
            x = c - x0
            y = r - y0
            rect = f'<rect x="{x}" y="{y}" width="1" height="1" />'
            (outline_rects if kind == "outline" else fill_rects).append(rect)

    parts = []
    parts.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'viewBox="0 0 {w} {h}" '
        f'shape-rendering="crispEdges" '
        f'role="img" aria-label="{title}">'
    )
    if two_color and outline_rects:
        # Caller can target [data-part=outline] / [data-part=fill] in CSS.
        parts.append(
            f'<g data-part="outline" fill="var(--logo-outline, currentColor)">'
            + "".join(outline_rects)
            + "</g>"
        )
        parts.append(
            f'<g data-part="fill" fill="var(--logo-fill, currentColor)">'
            + "".join(fill_rects)
            + "</g>"
        )
    else:
        parts.append(
            f'<g fill="currentColor">'
            + "".join(outline_rects + fill_rects)
            + "</g>"
        )
    parts.append("</svg>")
    return "".join(parts)


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("input", type=Path)
    ap.add_argument("output", type=Path)
    ap.add_argument("--cell-size", type=int, default=None,
                    help="Override autodetected pixel-art cell size.")
    ap.add_argument("--two-color", action="store_true",
                    help="Keep outline + fill as separate <g> groups.")
    ap.add_argument("--title", default="Rokumentarni dani")
    args = ap.parse_args(argv)

    img = Image.open(args.input).convert("RGBA")
    cell = args.cell_size or detect_cell_size(img)
    w, h = img.size

    cells: list[list[str]] = []
    for y in range(0, h, cell):
        row = []
        for x in range(0, w, cell):
            row.append(classify(sample_cell(img, x, y, cell)))
        cells.append(row)

    print(f"Image: {w}x{h}px  Cell: {cell}px  Grid: {len(cells[0])}x{len(cells)}",
          file=sys.stderr)

    svg = emit_svg(cells, two_color=args.two_color, title=args.title)
    args.output.write_text(svg)

    n_fill = sum(c.count("fill") for c in cells)
    n_outline = sum(c.count("outline") for c in cells)
    print(f"Wrote {args.output}  ({n_fill} fill + {n_outline} outline rects, "
          f"{len(svg):,} bytes)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
