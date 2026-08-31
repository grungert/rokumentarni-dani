#!/usr/bin/env python3
"""Drži site/public/media u skladu sa onim što sajt zaista koristi.

Zašto uopšte postoji
--------------------
site/public/media je nekad bio simlink na extracted/media — cijelu staru
WP biblioteku od 976 MB i 13.901 fajla. To radi lokalno, ali svaki build u
oblaku (Vercel, Netlify, GitHub Actions) klonira repo, a tamo simlink
pokazuje u prazno: sajt se izgradi bez ijedne slike.

Sada je to pravi folder sa 1.909 fajlova (138 MB) — tačno onim što se
negdje pominje u izgrađenom sajtu — i taj folder ide u git.

Kad zatreba
-----------
Kad se doda nova slika ili nova veličina u srcset, fajl neće postojati u
repou i slika će biti 404. Onda:

    npm run build --prefix site
    python3 scripts/sync_media.py

Skripta pročita šta build traži, prekopira ono što fali iz extracted/media
i prijavi šta više niko ne koristi. Radi samo na mašini koja ima original
biblioteku — extracted/media nije u gitu.

    --prune     obriši i fajlove koje niko više ne koristi
    --dry-run   samo prikaži šta bi uradila
"""

from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "extracted" / "media"
TARGET = ROOT / "site" / "public" / "media"
DIST = ROOT / "site" / "dist"

ASSET = re.compile(
    r"/media/([A-Za-z0-9._/\-]+\.(?:jpg|jpeg|png|webp|gif|svg|mp4|webm|ogv|mp3))",
    re.I,
)
SCANNED = (".html", ".css", ".js", ".xml", ".json")

# Razvojni ostaci koji ne idu na produkciju — njihove slike ne održavamo.
SKIP_DIRS = ("design-explorations",)


def human(n: float) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if abs(n) < 1024:
            return f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


def referenced() -> set[str]:
    """Putanje koje izgrađeni sajt traži."""
    if not DIST.exists():
        sys.exit("nema site/dist/ — pusti `npm run build` prvo")
    found: set[str] = set()
    for file in DIST.rglob("*"):
        if any(part in SKIP_DIRS for part in file.parts):
            continue
        if file.is_file() and file.suffix.lower() in SCANNED:
            found.update(ASSET.findall(file.read_text("utf-8", errors="ignore")))
    return found


def main() -> None:
    dry = "--dry-run" in sys.argv
    prune = "--prune" in sys.argv

    was_symlink = TARGET.is_symlink()
    if was_symlink:
        # Nasljeđe: simlink na cijelu biblioteku. Briše se sam link, nikad
        # ono na šta pokazuje.
        print(f"→ uklanjam stari simlink {TARGET.name} -> {TARGET.readlink()}")
        if not dry:
            TARGET.unlink()

    want = referenced()
    # Poslije uklanjanja simlinka folder je prazan; u probnom prolazu se
    # pravimo da već jeste, inače bi rglob prošao kroz link i prijavio
    # cijelu biblioteku kao „već imamo".
    have = (
        set()
        if was_symlink
        else {
            p.relative_to(TARGET).as_posix()
            for p in TARGET.rglob("*")
            if p.is_file()
        }
        if TARGET.exists()
        else set()
    )

    missing = sorted(want - have)
    orphan = sorted(have - want)

    copied = 0
    absent = []
    for rel in missing:
        src = SOURCE / rel
        if not src.exists():
            absent.append(rel)
            continue
        if not dry:
            dest = TARGET / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dest)
        copied += 1

    print(f"→ traži se: {len(want)}   ima: {len(have)}")
    print(f"→ {'kopirao bih' if dry else 'kopirano'}: {copied}")

    if absent:
        print(f"! {len(absent)} fajlova nema ni u extracted/media:")
        for rel in absent[:8]:
            print(f"    {rel}")

    if orphan:
        size = sum((TARGET / o).stat().st_size for o in orphan)
        if prune:
            for rel in orphan:
                if not dry:
                    (TARGET / rel).unlink()
            print(f"→ {'obrisao bih' if dry else 'obrisano'}: "
                  f"{len(orphan)} nekorišćenih ({human(size)})")
        else:
            print(f"· {len(orphan)} fajlova više niko ne koristi "
                  f"({human(size)}) — obriši ih sa --prune")

    if TARGET.exists():
        total = sum(p.stat().st_size for p in TARGET.rglob("*") if p.is_file())
        count = sum(1 for p in TARGET.rglob("*") if p.is_file())
        print(f"\nsite/public/media: {count} fajlova, {human(total)}")


if __name__ == "__main__":
    main()
