#!/usr/bin/env python3
"""Prebacuje site/dist/ na Apache hosting preko FTP-a (Bluehost).

Kredencijali NIKAD ne idu u kod ni u komandu — čitaju se iz .env.deploy u
korijenu repozitorijuma, koji .gitignore već hvata obrascem `.env.*`.

    FTP_HOST=ftp.rokumentarnidani.me
    FTP_USER=korisnik@rokumentarnidani.me
    FTP_PASS=lozinka
    FTP_DIR=/public_html
    FTP_TLS=1            # 0 samo ako server odbija FTPS
    FTP_PORT=21

Podrazumijevano se šalje samo ono što na serveru fali ili je druge veličine,
pa ponovljeni upload ide brzo. Stari fajlovi se NE brišu bez `--delete`.

Upotreba:
    python3 scripts/deploy_ftp.py --dry-run    # samo ispiše šta bi uradio
    python3 scripts/deploy_ftp.py              # pošalje izmjene
    python3 scripts/deploy_ftp.py --fresh      # ciljni folder je prazan
    python3 scripts/deploy_ftp.py --skip-prepare
"""

from __future__ import annotations

import ftplib
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "site" / "dist"
CONF = ROOT / ".env.deploy"

# Ovo se nikad ne šalje, ni kad se nađe u dist/.
SKIP = {".DS_Store", "Thumbs.db"}


def load_conf() -> dict[str, str]:
    if not CONF.exists():
        sys.exit(
            f"nema {CONF.name} — napravi ga po uputstvu na vrhu ove skripte.\n"
            "Fajl je već u .gitignore i ne smije se commitovati."
        )
    conf: dict[str, str] = {}
    for line in CONF.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        conf[key.strip()] = value.strip().strip("'\"")

    missing = [k for k in ("FTP_HOST", "FTP_USER", "FTP_PASS") if not conf.get(k)]
    if missing:
        sys.exit(f"u {CONF.name} fali: {', '.join(missing)}")
    conf.setdefault("FTP_DIR", "/public_html")
    conf.setdefault("FTP_TLS", "1")
    conf.setdefault("FTP_PORT", "21")
    return conf


def connect(conf: dict[str, str]) -> ftplib.FTP:
    port = int(conf["FTP_PORT"])
    if conf["FTP_TLS"] != "0":
        ftp = ftplib.FTP_TLS()
        ftp.connect(conf["FTP_HOST"], port, timeout=30)
        ftp.login(conf["FTP_USER"], conf["FTP_PASS"])
        # Bez ovoga ide šifrovana prijava a podaci u čisto — besmislena polovina.
        ftp.prot_p()
        print(f"povezan (FTPS) → {conf['FTP_HOST']}")
    else:
        ftp = ftplib.FTP()
        ftp.connect(conf["FTP_HOST"], port, timeout=30)
        ftp.login(conf["FTP_USER"], conf["FTP_PASS"])
        print(f"povezan (FTP, BEZ ŠIFROVANJA) → {conf['FTP_HOST']}")
        print("  lozinka putuje u čitljivom obliku; koristi FTPS ako server može.")
    ftp.set_pasv(True)
    return ftp


def remote_index(ftp: ftplib.FTP, base: str) -> dict[str, int]:
    """Mapa putanja → veličina za sve što već stoji na serveru.

    Jedno listanje po folderu umjesto pitanja za svaki fajl posebno: dist ima
    preko dvije hiljade fajlova, pa je razlika između pedesetak kružnih
    putovanja i dvije hiljade — minut naspram pola sata.
    """
    nadjeno: dict[str, int] = {}

    def prodji(putanja: str) -> None:
        try:
            unosi = list(ftp.mlsd(putanja, facts=["type", "size"]))
        except ftplib.all_errors:
            return  # folder ne postoji — sve u njemu se šalje
        for ime, cinjenice in unosi:
            if ime in (".", ".."):
                continue
            puna = f"{putanja}/{ime}"
            tip = cinjenice.get("type")
            if tip == "dir":
                prodji(puna)
            elif tip == "file":
                nadjeno[puna] = int(cinjenice.get("size", -1))

    prodji(base)
    return nadjeno


def ensure_dir(ftp: ftplib.FTP, path: str, made: set[str]) -> None:
    if path in made or path in ("", "/"):
        return
    parent = path.rsplit("/", 1)[0]
    ensure_dir(ftp, parent, made)
    try:
        ftp.mkd(path)
    except ftplib.error_perm:
        pass  # već postoji
    made.add(path)


def local_files() -> list[Path]:
    return sorted(
        f for f in DIST.rglob("*") if f.is_file() and f.name not in SKIP
    )


def main() -> None:
    args = sys.argv[1:]
    dry = "--dry-run" in args

    if "--skip-prepare" not in args:
        print("→ priprema dist/")
        subprocess.run(
            [sys.executable, str(ROOT / "scripts" / "prepare_deploy.py")],
            check=True,
        )
        print()

    if not DIST.exists():
        sys.exit("nema site/dist/ — pusti prvo pripremu")

    files = local_files()
    if not files:
        sys.exit("site/dist/ je prazan")

    conf = load_conf()
    base = conf["FTP_DIR"].rstrip("/")
    print(f"lokalno: {len(files)} fajlova   →   {base}/\n")

    ftp = connect(conf)
    if "--fresh" in args:
        # Popisivanje se preskače kad se šalje u prazan folder. Nad starom WP
        # instalacijom ono traje predugo: obilazi wp-content/uploads sa
        # desetinama hiljada fajlova koje ionako ne poredimo ni sa čim.
        postoji: dict[str, int] = {}
        print("--fresh: ne popisujem server, šaljem sve\n")
    else:
        print("čitam šta već stoji na serveru…")
        postoji = remote_index(ftp, base)
        print(f"na serveru: {len(postoji)} fajlova\n")

    made: set[str] = set()
    poslato = presko = 0
    bajta = 0

    for f in files:
        rel = f.relative_to(DIST).as_posix()
        target = f"{base}/{rel}"
        size = f.stat().st_size

        if postoji.get(target) == size:
            presko += 1
            continue

        if dry:
            print(f"  [bi poslao] {rel}")
        else:
            ensure_dir(ftp, target.rsplit("/", 1)[0], made)
            with f.open("rb") as fh:
                ftp.storbinary(f"STOR {target}", fh)
            print(f"  ↑ {rel}")
        poslato += 1
        bajta += size

    print(f"\nposlato {poslato}, preskočeno {presko} (isti) — {bajta / 1e6:.1f} MB")

    if "--delete" in args:
        print("\nbrisanje viška na serveru nije automatsko.")
        print("Stara WP instalacija se sigurnije uklanja iz cPanel File")
        print("Managera, uz backup — v. napomenu o kompromitovanom nalogu")
        print("u README.md.")

    ftp.quit()
    if dry:
        print("\n(probni hod — ništa nije poslato)")


if __name__ == "__main__":
    main()
