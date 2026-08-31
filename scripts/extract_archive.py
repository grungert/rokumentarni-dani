#!/usr/bin/env python3
"""Izvlači arhivu Rokumentarnih dana (2017–2023) iz WP izvoza u strukturu.

Ulaz:
    extracted/pages.json                      — sadržaj stranica (Visual Composer HTML)
    old_website/bucanpas_rokumentarnidani.sql — rd_postmeta._wp_attached_file
    site/public/media/**                      — same slike (simlink na extracted/media)

Izlaz:
    site/src/data/archive/films.ts    — filmovi po izdanjima
    site/src/data/archive/program.ts  — satnice po izdanjima
    site/src/data/archive/photos.ts   — fotografije po izdanju i danu
    scripts/archive-report.txt        — sve što nije razriješeno

VAŽNO: skripta se pušta JEDNOM. Izlaz se commituje i dalje se ispravlja
rukom — HTML iz kojeg čitamo je pisan sedam godina, u tri različita
obrasca, i nijedan parser ga neće pogoditi do kraja. Ako se ikad pusti
ponovo, piše u *.generated.ts pored postojećeg da se može uporediti.
"""

from __future__ import annotations

import html
import json
import os
import re
import struct
import sys
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = ROOT / "extracted" / "pages.json"
SQL = ROOT / "old_website" / "bucanpas_rokumentarnidani.sql"
MEDIA = ROOT / "extracted" / "media"
OUT = ROOT / "site" / "src" / "data" / "archive"
REPORT = ROOT / "scripts" / "archive-report.txt"

notes: list[str] = []


def note(kind: str, msg: str) -> None:
    notes.append(f"[{kind}] {msg}")


# ---------------------------------------------------------------- izdanja

@dataclass
class EditionSpec:
    n: int
    year: int
    films_slug: str | None
    program_slug: str | None
    gallery_slugs: list[str] = field(default_factory=list)
    # Kako su filmovi bili napisani te godine:
    #   h3     — <h3>Naslov</h3> pa <strong> blok sa labelama (2017, 2018, 2020)
    #   strong — <strong>Naslov</strong> pa labele u redovima (2022, 2023)
    #   image  — naslova NEMA u tekstu, nosi ga plakat (2021)
    films_style: str | None = None


EDITIONS = [
    EditionSpec(1, 2017, "dokumentarni-filmovi-2017", "program-2017",
                ["foto-galerija-2017-dan-i", "foto-galerija-dan-ii",
                 "foto-galerija-dan-3"], "h3"),
    EditionSpec(2, 2018, "dokumentarni-filmovi-2018", "program-2018",
                ["2018-foto-galerija-dan-i", "2018-foto-galerija-dan-ii",
                 "2018-foto-galerija-dan-iii", "2018-foto-galerija-dan-vi"], "h3"),
    # Pažnja: stranica se zove „program-2019-2", ali NIJE satnica — to je
    # selekcija filmova za maj 2019, a termini projekcija stoje unutar svakog
    # filma (polje screening). RD3 je jedino izdanje bez zasebne satnice.
    EditionSpec(3, 2019, "program-2019-2", None, [], "h3"),
    # Pažnja: slug kaže 2019, sadržaj je selekcija za oktobar 2020.
    EditionSpec(4, 2020, "dokumentarni-filmovi-2019", "program-2020", [], "h3"),
    EditionSpec(5, 2021, "dokumentarni-filmovi-2021", "program-2021", [], "image"),
    EditionSpec(6, 2022, "dokumentarni-filmovi-2022", "program-2022", [], "strong"),
    EditionSpec(7, 2023, "dokumentarni-filmovi-2022-2", "program-2022-2", [], "strong"),
]


# ---------------------------------------------------------------- pomoćno

DIACRITICS = str.maketrans({
    "č": "c", "ć": "c", "ž": "z", "š": "s", "đ": "dj",
    "Č": "C", "Ć": "C", "Ž": "Z", "Š": "S", "Đ": "Dj",
})


def slugify(text: str) -> str:
    text = text.translate(DIACRITICS)
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return text


def strip_tags(fragment: str) -> str:
    fragment = re.sub(r"<br\s*/?>", "\n", fragment)
    fragment = re.sub(r"</p>|</div>|</h\d>", "\n", fragment)
    fragment = re.sub(r"<[^>]+>", "", fragment)
    return html.unescape(fragment)


def tidy(text: str) -> str:
    text = strip_tags(text)
    # Stara baza je puna CRLF-a. Ako \r ne postane prelom reda, cijeli blok
    # labela izgleda kao jedan red i „Režija" pojede sve ispod sebe.
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = text.replace("\xa0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n+", "\n", text)
    return text.strip()


def parse_duration(raw: str) -> int | None:
    """„45'", „30’", „87 min", „1h 30" → minuti."""
    raw = raw.strip()
    h = re.search(r"(\d+)\s*(?:h|sat)", raw, re.I)
    m = re.search(r"(\d+)\s*(?:['’′]|min|\bm\b)", raw, re.I)
    if h and m:
        return int(h.group(1)) * 60 + int(m.group(1))
    if h:
        return int(h.group(1)) * 60
    if m:
        return int(m.group(1))
    bare = re.fullmatch(r"(\d{1,3})\.?", raw)
    return int(bare.group(1)) if bare else None


def parse_year(raw: str) -> int | None:
    hit = re.search(r"(19|20)\d{2}", raw)
    return int(hit.group(0)) if hit else None


def youtube_id(url: str) -> str | None:
    hit = re.search(r"(?:v=|youtu\.be/|embed/)([A-Za-z0-9_-]{11})", url)
    return hit.group(1) if hit else None


def ts(value) -> str:
    """Vrijednost u TS literal."""
    if value is None:
        return "undefined"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, list):
        return "[" + ", ".join(ts(v) for v in value) + "]"
    escaped = (
        str(value)
        .replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\r", "\\n")
        .replace("\n", "\\n")
        .replace("\t", " ")
    )
    return f'"{escaped}"'


def obj(fields: dict, indent: str = "    ") -> str:
    inner = "".join(
        f"{indent}  {k}: {ts(v)},\n" for k, v in fields.items() if v is not None
    )
    return "{\n" + inner + indent + "}"


# ------------------------------------------------------------- prilozi

def attachment_map() -> dict[int, str]:
    """ID priloga → relativna putanja, iz SQL dumpa."""
    if not SQL.exists():
        sys.exit(f"nema SQL dumpa: {SQL}")
    sql = SQL.read_text(encoding="utf-8", errors="replace")
    rows = re.findall(
        r"\(\s*\d+,\s*(\d+),\s*'_wp_attached_file',\s*'([^']+)'\s*\)", sql
    )
    return {int(pid): path for pid, path in rows}


def image_size(path: Path) -> tuple[int, int] | None:
    """Dimenzije iz zaglavlja, bez učitavanja piksela."""
    try:
        with path.open("rb") as f:
            head = f.read(26)
            if head[:8] == b"\x89PNG\r\n\x1a\n":
                w, h = struct.unpack(">II", head[16:24])
                return int(w), int(h)
            if head[:2] != b"\xff\xd8":
                return None
            f.seek(2)
            while True:
                b = f.read(1)
                if not b:
                    return None
                if b != b"\xff":
                    continue
                while b == b"\xff":
                    b = f.read(1)
                marker = b[0]
                if 0xC0 <= marker <= 0xCF and marker not in (0xC4, 0xC8, 0xCC):
                    f.read(3)
                    h, w = struct.unpack(">HH", f.read(4))
                    return int(w), int(h)
                length = struct.unpack(">H", f.read(2))[0]
                f.seek(length - 2, 1)
    except OSError:
        return None


def size_variants(rel: str) -> list[str]:
    """Koje je veličine WP već ispekao za ovaj fajl."""
    path = MEDIA / rel
    stem, ext = os.path.splitext(path.name)
    found = []
    for sibling in path.parent.glob(f"{stem}-*x*{ext}"):
        hit = re.fullmatch(rf"{re.escape(stem)}-(\d+x\d+){re.escape(ext)}",
                           sibling.name)
        if hit:
            found.append(hit.group(1))
    return sorted(found, key=lambda s: int(s.split("x")[0]))


# --------------------------------------------------------------- FILMOVI

LABELS = {
    "režija": "director", "rezija": "director", "reditelj": "director",
    "rediteljka": "director", "režiseri": "director", "autor": "director",
    "autori": "director", "autorke": "director",
    "zemlja": "country",
    "godina": "year",
    "trajanje": "duration",
    "produkcija": "production",
    "projekcija": "screening",
}


def parse_labels(block: str) -> dict[str, str]:
    """Redovi oblika „Režija: Ime" iz bloka teksta."""
    out: dict[str, str] = {}
    lines = tidy(block).split("\n")
    for n, line in enumerate(lines):
        hit = re.match(r"\s*([A-Za-zČĆŽŠĐčćžšđ]+)\s*:\s*(.*)", line)
        if not hit:
            continue
        key = LABELS.get(hit.group(1).strip().lower())
        if not key or key in out:
            continue
        value = hit.group(2).strip(" .")
        # 2019. piše „Projekcija:" pa termine u redovima ispod — pokupi ih
        # dok ne naiđe sljedeća labela ili sinopsis.
        if not value:
            tail = []
            for follow in lines[n + 1:]:
                follow = follow.strip()
                if not follow or len(follow) > 120:
                    break
                if re.match(r"\s*([A-Za-zČĆŽŠĐčćžšđ]+)\s*:", follow):
                    break
                tail.append(follow)
            value = " / ".join(tail)
        if value:
            out[key] = value
    return out


def film_records(spec: EditionSpec, content: str, att: dict[int, str]) -> list[dict]:
    """Jedan blok = jedan film. Granica zavisi od godine."""
    # Plakati i trejleri se vezuju za blok u kojem se pojave.
    content = re.sub(r"\[vc_single_image[^\]]*image=\"(\d+)\"[^\]]*\]",
                     r"\n@@IMG:\1@@\n", content)
    # Cijeli shortcode → marker. Ako bi se vadio samo video_link iznutra,
    # marker bi ostao unutar uglastih zagrada i brisanje shortcode-ova
    # ispod bi ga odnijelo zajedno sa njima.
    content = re.sub(r"\[qode_video_box[^\]]*?video_link=\"([^\"]+)\"[^\]]*\]",
                     r"\n@@YT:\1@@\n", content)
    content = re.sub(r"\[/?[a-z_]+[^\]]*\]", "\n", content)

    if spec.films_style == "h3":
        parts = re.split(r"<h3[^>]*>(.*?)</h3>", content, flags=re.S)
        head = parts[0] if parts else ""
        blocks = [(tidy(parts[i]), parts[i + 1]) for i in range(1, len(parts) - 1, 2)]
    elif spec.films_style == "strong":
        # <strong> se u ovim godinama koristi i za naslov filma i za
        # podebljano ime reditelja u „režija: <strong>Ime</strong>", i za
        # naglašene riječi usred sinopsisa. Naslov je samo onaj koji
        # (a) NE stoji odmah iza labele i (b) ima labele ispod sebe.
        # Ne dijelimo sadržaj na svakom <strong> — odbačeni <strong> (ime
        # reditelja, naglašena riječ) mora ostati u tijelu filma iznad sebe,
        # inače mu odsiječemo labele. Zato: prvo nađi sve, pa filtriraj, pa
        # tijelo sijeci od naslova do SLJEDEĆEG PRIHVAĆENOG naslova.
        candidates = list(re.finditer(r"<strong>([^<:]{3,80}?)</strong>",
                                      content, re.S))
        accepted = []
        for m in candidates:
            before = tidy(content[max(0, m.start() - 60):m.start()])[-40:]
            after = tidy(content[m.end():m.end() + 1200])[:400]
            if re.search(r"(režija|rezija|zemlja|godina|trajanje|produkcija)"
                         r"\s*:?\s*$", before, re.I):
                continue
            if not re.search(r"(režija|rezija|zemlja|godina|trajanje)\s*:",
                             after, re.I):
                continue
            accepted.append(m)

        head = content[:accepted[0].start()] if accepted else ""
        blocks = [
            (tidy(m.group(1)),
             content[m.end():(accepted[i + 1].start()
                              if i + 1 < len(accepted) else len(content))])
            for i, m in enumerate(accepted)
        ]
    elif spec.films_style == "image":
        head = ""
        # 2021: naslov nosi plakat, pa je granica sam plakat.
        chunks = re.split(r"@@IMG:(\d+)@@", content)
        blocks = []
        for i in range(1, len(chunks) - 1, 2):
            img_id = int(chunks[i])
            rel = att.get(img_id, "")
            stem = Path(rel).stem if rel else f"film-{img_id}"
            # Plakati su imenovani „NK-", „PG-", „NKPG-" po gradu projekcije.
            title = re.sub(r"^(NKPG|NK|PG)[-_]", "", stem, flags=re.I)
            title = re.sub(r"[-_]\d+$", "", title).replace("-", " ").replace("_", " ")
            if title.islower():
                title = title.title()
            blocks.append((title.strip(), f"@@IMG:{img_id}@@" + chunks[i + 1]))
        note("NASLOV", f"RD{spec.n} {spec.year}: naslovi izvedeni iz imena "
                       f"plakata ({len(blocks)} kom) — provjeriti sve")
    else:
        return []

    # Plakat i trejler u ovom HTML-u stoje ISPRED svog naslova, ne ispod
    # njega: [vc_single_image] i [qode_video_box] dolaze pa tek onda <h3>
    # ili <strong>. Ako se traže u tijelu ispod naslova, svaki film pokupi
    # prilog onog sljedećeg — provjereno na svim godinama.
    # Izuzetak je 2021, gdje je plakat sam granica bloka i nosi naslov.
    if spec.films_style == "image":
        assets = [body for _, body in blocks]
    else:
        assets = [head] + [body for _, body in blocks[:-1]]

    films: list[dict] = []
    seen_trailers: dict[str, str] = {}

    for index, (title, body) in enumerate(blocks):
        asset_segment = assets[index] if index < len(assets) else ""
        # 2019. je podnaslov (ime ciklusa) pisala u drugom redu istog <h3>.
        subtitle = None
        if "\n" in title:
            title, _, rest = title.partition("\n")
            subtitle = rest.strip().strip("()") or None

        title = re.sub(r"\s*/\s*(19|20)\d{2}\s*$", "", title).strip(" -–—")
        if not title or len(title) < 2:
            continue

        labels = parse_labels(body)

        # Sinopsis: najduži pasus koji nije lista labela.
        candidates = []
        for chunk in re.split(r"\n{1,}", tidy(re.sub(r"@@\w+:[^@]*@@", "", body))):
            chunk = chunk.strip()
            if len(chunk) < 80:
                continue
            if re.match(r"^\s*[A-Za-zČĆŽŠĐčćžšđ]+\s*:", chunk) and len(chunk) < 160:
                continue
            candidates.append(chunk)
        synopsis = max(candidates, key=len) if candidates else None

        img_ids = [int(x) for x in
                   reversed(re.findall(r"@@IMG:(\d+)@@", asset_segment))]
        poster = None
        for img_id in img_ids:
            rel = att.get(img_id)
            if rel and (MEDIA / rel).exists():
                poster = "/media/" + rel
                break
            if rel:
                note("PLAKAT", f'RD{spec.n} "{title}": prilog {img_id} -> {rel} '
                               f"ne postoji na disku")

        trailer = None
        for url in reversed(re.findall(r"@@YT:([^@]+)@@", asset_segment)):
            trailer = youtube_id(url)
            if trailer:
                break
        if trailer:
            # Isti snimak na dva filma znači da je video kutija pala preko
            # granice bloka — ne mogu pogoditi kome pripada, ali mogu reći.
            if trailer in seen_trailers:
                note("TREJLER", f"RD{spec.n} {spec.year}: isti snimak "
                                f"{trailer} i na {seen_trailers[trailer]!r} i "
                                f"na {title!r} — provjeriti kome pripada")
            else:
                seen_trailers[trailer] = title

        duration = parse_duration(labels.get("duration", "")) if labels.get("duration") else None
        year = parse_year(labels.get("year", "")) if labels.get("year") else None

        record = {
            "id": f"rd{spec.n}-{slugify(title)}"[:64],
            "slug": slugify(title),
            "title": title,
            "subtitle": subtitle,
            "edition": spec.n,
            "editionYear": spec.year,
            "director": labels.get("director"),
            "production": labels.get("production"),
            "country": labels.get("country"),
            "year": year,
            "duration": duration,
            "synopsis": synopsis,
            "poster": poster,
            "trailer": trailer,
            "screening": labels.get("screening"),
        }

        missing = [k for k in ("director", "country", "year", "duration",
                               "synopsis", "poster") if not record[k]]
        if missing:
            note("FILM", f'RD{spec.n} {spec.year} "{title}" — fali: '
                         f"{', '.join(missing)}")
        films.append(record)

    return films


# --------------------------------------------------------------- SATNICE

MONTHS = {
    "januar": 1, "februar": 2, "mart": 3, "april": 4, "maj": 5, "jun": 6,
    "jul": 7, "avgust": 8, "septembar": 9, "oktobar": 10, "novembar": 11,
    "decembar": 12,
}
# Stari sajt miješa ijekavicu i ekavicu („PONEDELJAK", „SRIJEDA") — obje
# varijante moraju da prolaze, inače dan ostane bez datuma i tiho se slije
# u prethodni.
WEEKDAYS = {
    "ponedjeljak": "ponedjeljak", "ponedeljak": "ponedjeljak",
    "utorak": "utorak",
    "srijeda": "srijeda", "sreda": "srijeda",
    "četvrtak": "četvrtak", "cetvrtak": "četvrtak",
    "petak": "petak",
    "subota": "subota",
    "nedjelja": "nedjelja", "nedelja": "nedjelja",
}


def program_records(spec: EditionSpec, content: str) -> list[dict]:
    """Blokovi su qode „elements holder" stavke; svaka je jedan dan u jednom gradu."""
    raw_blocks = re.split(r"\[qode_elements_holder_item[^\]]*\]", content)[1:]
    days: list[dict] = []

    for raw in raw_blocks:
        text = tidy(re.sub(r"\[/?[a-z_]+[^\]]*\]", "\n", raw))
        if not text:
            continue

        venue = None
        hit = re.search(r"Lokacija\s*:\s*(.+)", text, re.I)
        if hit:
            venue = hit.group(1).strip()

        # „26. MAJ - PETAK" ili „10.11. - PETAK"
        date_label = None
        weekday = None
        for line in text.split("\n"):
            probe = line.strip()
            low = probe.lower()
            if len(probe) < 60:
                hit = next((w for w in WEEKDAYS if w in low), None)
                if hit:
                    date_label = re.sub(r"\s+", " ", probe)
                    weekday = WEEKDAYS[hit]
                    break

        items = []
        for line in text.split("\n"):
            line = line.strip()
            # Red sa datumom NIJE termin. Bez ove ograde „16.12 - PETAK"
            # prođe kao termin u 16:12 pod nazivom „PETAK".
            if date_label and line == date_label:
                continue
            # „17:00 - 18:00 - naslov", „18:00 - naslov", „17:00 - 17:15 | naslov"
            # — razdvajač se mijenjao kroz godine, pa primamo i crticu i uspravnu.
            hit = re.match(
                r"^(\d{1,2}[:.]\d{2}|TBA|TBC)\s*(?:[-–—]\s*(\d{1,2}[:.]\d{2}))?"
                r"\s*[-–—|]\s*(.+)$",
                line,
                re.I,
            )
            if not hit:
                continue
            title = hit.group(3).strip(" .-–")
            kind = "film"
            low = title.lower()
            if low.startswith("film:"):
                title = title[5:].strip()
            elif "koncert" in low:
                kind = "koncert"
            elif "dj" in low.split():
                kind = "dj"
            elif any(w in low for w in ("tribina", "razgovor", "promocija",
                                        "otvaranje", "izložba", "radionica")):
                kind = "tribina"
            elif "videodrom" in low:
                kind = "videodrom"

            # RD6 je za tri grada objavio program bez satnice („TBA"). Te
            # stavke se čuvaju bez vremena — program je postojao, sat nikad
            # nije objavljen, i to je tačniji zapis nego da ih uopšte nema.
            raw_start = hit.group(1)
            start = (
                None
                if raw_start.upper() in ("TBA", "TBC")
                else raw_start.replace(".", ":")
            )

            items.append({
                "start": start,
                "end": hit.group(2).replace(".", ":") if hit.group(2) else None,
                "title": title,
                "kind": kind,
            })

        if not items:
            continue

        # Izvor miješa dvije kolone — hronologija se vraća sortiranjem.
        # Stavke bez vremena (TBA) idu na kraj, redom kojim su zapisane.
        items.sort(key=lambda i: i["start"] or "99:99")

        # Stari raspored je bio u dvije kolone: druga kolona istog dana je
        # zaseban blok BEZ datuma I BEZ lokacije. Blok koji ima svoju
        # lokaciju je zaseban dan čak i kad datum nije prepoznat — spajanje
        # bi ga tiho izgubilo (npr. najavljeni Kotor 2022).
        if not date_label and not venue and days:
            prev_label = days[-1]["label"]
            note("SPOJENO", f"RD{spec.n} {spec.year}: blok bez datuma "
                            f"({len(items)} stavki, lokacija: {venue}) pripojen "
                            f"danu {prev_label!r} — provjeriti da nije zaseban dan")
            days[-1]["items"].extend(items)
            days[-1]["items"].sort(key=lambda i: i["start"] or "99:99")
            continue

        if not date_label:
            note("SATNICA", f"RD{spec.n} {spec.year}: blok sa {len(items)} "
                            f"stavki nema datum, a nema ni prethodni dan "
                            f"(lokacija: {venue})")

        days.append({
            "edition": spec.n,
            "label": date_label or "—",
            "weekday": weekday,
            "venue": venue,
            "items": items,
        })

    return days


# ------------------------------------------------------------ FOTOGRAFIJE

def photo_records(spec: EditionSpec, pages: dict, att: dict[int, str]) -> list[dict]:
    photos: list[dict] = []
    for order, slug in enumerate(spec.gallery_slugs, start=1):
        page = pages.get(slug)
        if not page:
            note("GALERIJA", f"RD{spec.n}: nema stranice {slug}")
            continue

        ids = [
            int(i)
            for group in re.findall(r'images="([^"]+)"', page["post_content"])
            for i in group.split(",")
            if i.strip().isdigit()
        ]
        if not ids:
            note("GALERIJA", f"RD{spec.n} {slug}: nijedan ID slike u shortcode-u")
            continue

        day_label = tidy(page["post_title"])
        for seq, img_id in enumerate(ids, start=1):
            rel = att.get(img_id)
            if not rel:
                note("FOTO", f"{slug}: prilog {img_id} nije u bazi")
                continue
            path = MEDIA / rel
            if not path.exists():
                note("FOTO", f"{slug}: {rel} nije na disku")
                continue
            size = image_size(path)
            if not size:
                note("FOTO", f"{slug}: {rel} — dimenzije nečitljive")
            photos.append({
                "id": f"rd{spec.n}-d{order}-{seq:03d}",
                "edition": spec.n,
                "editionYear": spec.year,
                "day": order,
                "dayLabel": day_label,
                "src": "/media/" + rel,
                "w": size[0] if size else None,
                "h": size[1] if size else None,
                "variants": size_variants(rel),
            })
    return photos


# ------------------------------------------------------------------ izlaz

HEADER = """// GENERISANO iz stare WP baze skriptom scripts/extract_archive.py.
//
// Od ovog trenutka fajl se održava RUKOM. Skripta je čitala Visual Composer
// HTML pisan kroz sedam godina u tri različita obrasca i nije mogla sve da
// pogodi — ispravke koje ovdje unesemo su tačnije od svakog ponovnog
// parsiranja. Ako se skripta ikad pusti opet, piše pored, u *.generated.ts.
"""


def write_ts(name: str, decl: str, body: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / f"{name}.ts"
    if target.exists():
        target = OUT / f"{name}.generated.ts"
        note("IZLAZ", f"{name}.ts već postoji — pisao sam u {target.name}, "
                      f"uporedi pa spoji ručno")
    target.write_text(HEADER + "\n" + decl + body + "\n", encoding="utf-8")
    print(f"  → {target.relative_to(ROOT)}")


def main() -> None:
    # Ručno ispravljeni izlazi se ne smiju gaziti kad se mijenja samo jedan
    # parser: `--only program` regeneriše isključivo satnice.
    only = None
    if "--only" in sys.argv:
        only = sys.argv[sys.argv.index("--only") + 1]

    pages = {p["post_name"]: p for p in json.loads(PAGES.read_text("utf-8"))
             if p.get("post_name")}
    att = attachment_map()
    print(f"priloga u bazi: {len(att)}")

    films: list[dict] = []
    program: list[dict] = []
    photos: list[dict] = []

    for spec in EDITIONS:
        if spec.films_slug:
            page = pages.get(spec.films_slug)
            if page:
                got = film_records(spec, page["post_content"], att)
                films += got
                print(f"RD{spec.n} {spec.year}: {len(got)} filmova")
            else:
                note("STRANICA", f"RD{spec.n}: nema {spec.films_slug}")
        else:
            note("FILMOVI", f"RD{spec.n} {spec.year}: nema stranice filmova "
                            f"(rupa i na starom sajtu)")

        if spec.program_slug:
            page = pages.get(spec.program_slug)
            if page:
                got = program_records(spec, page["post_content"])
                program += got
                total = sum(len(d["items"]) for d in got)
                print(f"RD{spec.n} {spec.year}: {len(got)} dana, {total} termina")
            else:
                note("STRANICA", f"RD{spec.n}: nema {spec.program_slug}")

        got_photos = photo_records(spec, pages, att)
        photos += got_photos
        if got_photos:
            print(f"RD{spec.n} {spec.year}: {len(got_photos)} fotografija")

    if not only or only == "films":
      write_ts(
        "films",
        "import type { ArchiveFilm } from './types';\n\n"
        "export const archiveFilms: ArchiveFilm[] = [\n",
        "".join(f"  {obj(f, '  ')},\n" for f in films) + "];",
    )

    if not only or only == "program":
      write_ts(
        "program",
        "import type { ArchiveDay } from './types';\n\n"
        "export const archiveProgram: ArchiveDay[] = [\n",
        "".join(
            "  {\n"
            f"    edition: {d['edition']},\n"
            f"    label: {ts(d['label'])},\n"
            f"    weekday: {ts(d['weekday'])},\n"
            f"    venue: {ts(d['venue'])},\n"
            "    items: [\n"
            + "".join(f"      {obj(i, '      ')},\n" for i in d["items"])
            + "    ],\n  },\n"
            for d in program
        ) + "];",
    )

    if not only or only == "photos":
      write_ts(
        "photos",
        "import type { ArchivePhoto } from './types';\n\n"
        "export const archivePhotos: ArchivePhoto[] = [\n",
        "".join(f"  {obj(p, '  ')},\n" for p in photos) + "];",
    )

    # Pokrivenost po polju — prvo što čovjek treba da vidi kad otvori
    # izvještaj: koliko toga arhiva uopšte ima, a ne samo šta je palo.
    coverage = "\n".join(
        f"  {field_name:<10} {sum(1 for f in films if f.get(field_name)):>3} / "
        f"{len(films)}  "
        f"{round(100 * sum(1 for f in films if f.get(field_name)) / max(len(films), 1)):>3}%"
        for field_name in ("director", "country", "year", "duration",
                           "synopsis", "poster", "trailer", "screening")
    )

    REPORT.write_text(
        "IZVJEŠTAJ EKSTRAKCIJE ARHIVE\n"
        + "=" * 60 + "\n\n"
        f"filmova: {len(films)}   dana programa: {len(program)}   "
        f"fotografija: {len(photos)}\n\n"
        "Pokrivenost polja kod filmova:\n" + coverage + "\n\n"
        "Sve ispod traži ljudsko oko. Redoslijed je redoslijed nastanka.\n\n"
        + "\n".join(notes) + "\n",
        encoding="utf-8",
    )

    print(f"\nfilmova {len(films)} · dana {len(program)} · fotografija {len(photos)}")
    print(f"napomena u izvještaju: {len(notes)} → {REPORT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
