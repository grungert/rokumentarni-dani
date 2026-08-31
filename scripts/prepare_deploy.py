#!/usr/bin/env python3
"""Priprema site/dist/ za upload na Apache hosting (Bluehost).

Radi četvoro:
  1. pokrene `npm run build`
  2. izbaci iz dist/media sve što sajt ne koristi (~860 MB od 994)
  3. ukloni razvojne ostatke koji nemaju šta na produkciji
  4. upiše .htaccess (301 preusmjerenja, keširanje, kompresija) i robots.txt

Rezultat je folder koji se prekopira u web root i to je sve — server ne
treba ni Node, ni PHP, ni bazu.

VAŽNO: skripta dira ISKLJUČIVO site/dist/. Izvorna biblioteka slika u
extracted/media ostaje netaknuta — dist se ionako pravi iznova pri svakom
build-u, pa je prosijecanje bezopasno.

Upotreba:
    python3 scripts/prepare_deploy.py
    python3 scripts/prepare_deploy.py --skip-build   # nad postojećim dist/
"""

from __future__ import annotations

import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
DIST = SITE / "dist"
REDIRECTS_TS = SITE / "src" / "data" / "legacy-redirects.ts"

SITE_URL = "https://rokumentarnidani.me"

# Ostaci razvoja koji se ne tiču posjetilaca.
DEV_LEFTOVERS = ["design-explorations"]

# Gdje se sve može pojaviti putanja do slike.
SCANNED_SUFFIXES = (".html", ".css", ".js", ".xml", ".json")


def human(num_bytes: float) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if abs(num_bytes) < 1024:
            return f"{num_bytes:.1f} {unit}"
        num_bytes /= 1024
    return f"{num_bytes:.1f} TB"


def dir_size(path: Path) -> int:
    return sum(f.stat().st_size for f in path.rglob("*") if f.is_file())


def build() -> None:
    print("→ npm run build")
    result = subprocess.run(["npm", "run", "build"], cwd=SITE)
    if result.returncode != 0:
        sys.exit("build je pao — ništa nije mijenjano")


def referenced_media() -> set[str]:
    """Sve /media/... putanje koje se stvarno pojavljuju u izlazu.

    Skenira se GOTOV izlaz, ne izvor: tako se hvataju i srcset varijante i
    putanje koje su komponente same sastavile. Ako slika nije spomenuta ni u
    jednom HTML-u, CSS-u ni JS-u, na server ne mora.
    """
    pattern = re.compile(
        r"/media/[A-Za-z0-9._/\-]+\.(?:jpg|jpeg|png|webp|gif|svg|mp4|webm|ogv|mp3)",
        re.I,
    )
    found: set[str] = set()
    for file in DIST.rglob("*"):
        if not file.is_file() or file.suffix.lower() not in SCANNED_SUFFIXES:
            continue
        try:
            text = file.read_text("utf-8", errors="ignore")
        except OSError:
            continue
        found.update(match.lstrip("/") for match in pattern.findall(text))
    return found


def prune_media() -> None:
    media = DIST / "media"
    if not media.exists():
        print("! nema dist/media — preskačem prosijecanje")
        return

    before = dir_size(media)
    keep = referenced_media()

    missing = sorted(p for p in keep if not (DIST / p).exists())
    removed = 0
    for file in list(media.rglob("*")):
        if file.is_file() and file.relative_to(DIST).as_posix() not in keep:
            file.unlink()
            removed += 1

    # Prazni folderi ostaju iza brisanja — čiste se odozdo naviše.
    for folder in sorted(media.rglob("*"), key=lambda p: -len(p.parts)):
        if folder.is_dir() and not any(folder.iterdir()):
            folder.rmdir()

    after = dir_size(media)
    print(f"→ media: {human(before)} → {human(after)}  "
          f"(izbačeno {removed} fajlova)")

    if missing:
        print(f"! upozorenje: {len(missing)} putanja se pominje u izlazu, a "
              f"fajla nema:")
        for path in missing[:5]:
            print(f"    {path}")


def drop_dev_leftovers() -> None:
    # macOS smeće koje se zalijepi za public/ i otputuje na server.
    junk = [f for f in DIST.rglob("*") if f.name in (".DS_Store", "Thumbs.db")]
    for file in junk:
        file.unlink()
    if junk:
        print(f"→ uklonjeno {len(junk)}x .DS_Store")

    for name in DEV_LEFTOVERS:
        target = DIST / name
        if target.exists():
            size = dir_size(target)
            shutil.rmtree(target)
            print(f"→ uklonjen {name}/ ({human(size)})")


def read_redirects() -> list[tuple[str, str]]:
    source = REDIRECTS_TS.read_text("utf-8")
    body = source[source.index("legacyRedirects"):]
    return re.findall(r'"(/[^"]*)":\s*"(/[^"]*)"', body)


def write_htaccess() -> None:
    redirects = read_redirects()
    lines = [
        "# Rokumentarni dani — statični sajt (Astro build).",
        "# Generisano skriptom scripts/prepare_deploy.py; ne mijenjati ručno.",
        "",
        "Options -Indexes",
        "DirectoryIndex index.html",
        "ErrorDocument 404 /404.html",
        "",
        "# --- Stare WP adrese -------------------------------------------------",
        "# Pravi 301, umjesto meta-refresh stranica koje Astro pravi za statični",
        "# build. Apache ovo odradi prije nego što uopšte dođe do fajla.",
        "<IfModule mod_alias.c>",
    ]
    for old, new in redirects:
        lines.append(f"  Redirect 301 {old} {new}")
    lines += [
        "</IfModule>",
        "",
        "# --- Kompresija ------------------------------------------------------",
        "<IfModule mod_deflate.c>",
        "  AddOutputFilterByType DEFLATE text/html text/css text/plain",
        "  AddOutputFilterByType DEFLATE application/javascript application/json",
        "  AddOutputFilterByType DEFLATE application/xml image/svg+xml",
        "</IfModule>",
        "",
        "# --- Keširanje -------------------------------------------------------",
        "# Fajlovi u /_astro/ nose heš u imenu i mijenjaju ime kad se promijene,",
        "# pa smiju godinu dana. HTML nikad, da se izmjene odmah vide.",
        "<IfModule mod_expires.c>",
        "  ExpiresActive On",
        "  ExpiresByType text/html \"access plus 0 seconds\"",
        "  ExpiresByType text/css \"access plus 1 year\"",
        "  ExpiresByType application/javascript \"access plus 1 year\"",
        "  ExpiresByType image/jpeg \"access plus 6 months\"",
        "  ExpiresByType image/png \"access plus 6 months\"",
        "  ExpiresByType image/webp \"access plus 6 months\"",
        "  ExpiresByType image/svg+xml \"access plus 6 months\"",
        "  ExpiresByType video/mp4 \"access plus 6 months\"",
        "</IfModule>",
        "",
        "<IfModule mod_headers.c>",
        "  <FilesMatch \"\\.(css|js)$\">",
        "    Header set Cache-Control \"public, max-age=31536000, immutable\"",
        "  </FilesMatch>",
        "  Header set X-Content-Type-Options \"nosniff\"",
        "  Header set Referrer-Policy \"strict-origin-when-cross-origin\"",
        "</IfModule>",
        "",
    ]

    (DIST / ".htaccess").write_text("\n".join(lines), encoding="utf-8")
    print(f"→ .htaccess ({len(redirects)} preusmjerenja)")


def write_robots() -> None:
    (DIST / "robots.txt").write_text(
        "User-agent: *\n"
        "Allow: /\n"
        "\n"
        f"Sitemap: {SITE_URL}/sitemap-index.xml\n",
        encoding="utf-8",
    )
    print("→ robots.txt")


def main() -> None:
    if "--skip-build" not in sys.argv:
        build()

    if not DIST.exists():
        sys.exit("nema site/dist/ — pusti build prvo")

    before = dir_size(DIST)

    # Razvojni ostaci prvo: inače ih prosijecanje skenira kao izvor
    # referenci i zadrži slike koje samo oni koriste.
    drop_dev_leftovers()
    prune_media()
    write_htaccess()
    write_robots()

    after = dir_size(DIST)
    files = sum(1 for f in DIST.rglob("*") if f.is_file())

    print()
    print(f"dist/: {human(before)} → {human(after)}   ({files} fajlova)")
    print()
    print("Za upload: prekopiraj SADRŽAJ site/dist/ u web root")
    print("(public_html na Bluehost-u), uključujući i .htaccess —")
    print("FTP klijenti često sakriju fajlove koji počinju tačkom.")


if __name__ == "__main__":
    main()
