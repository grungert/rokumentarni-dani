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
    python3 scripts/deploy_ftp.py --jobs 4     # više veza uporedo
    python3 scripts/deploy_ftp.py --skip-prepare
"""

from __future__ import annotations

import ftplib
import queue
import subprocess
import sys
import threading
import time
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


def connect(conf: dict[str, str], tiho: bool = False) -> ftplib.FTP:
    port = int(conf["FTP_PORT"])
    if conf["FTP_TLS"] != "0":
        ftp = ftplib.FTP_TLS()
        ftp.connect(conf["FTP_HOST"], port, timeout=90)
        ftp.login(conf["FTP_USER"], conf["FTP_PASS"])
        # Bez ovoga ide šifrovana prijava a podaci u čisto — besmislena polovina.
        ftp.prot_p()
        if not tiho:
            print(f"povezan (FTPS) → {conf['FTP_HOST']}")
    else:
        ftp = ftplib.FTP()
        ftp.connect(conf["FTP_HOST"], port, timeout=90)
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

    za_slanje = []
    presko = 0
    for f in files:
        rel = f.relative_to(DIST).as_posix()
        if postoji.get(f"{base}/{rel}") == f.stat().st_size:
            presko += 1
        else:
            za_slanje.append((f, rel))

    bajta = sum(f.stat().st_size for f, _ in za_slanje)
    print(f"za slanje: {len(za_slanje)}, preskačem {presko} (isti) — {bajta / 1e6:.1f} MB\n")

    if dry:
        for _, rel in za_slanje[:40]:
            print(f"  [bi poslao] {rel}")
        if len(za_slanje) > 40:
            print(f"  … još {len(za_slanje) - 40}")
        ftp.quit()
        print("\n(probni hod — ništa nije poslato)")
        return

    # Folderi se prave unaprijed, jednom vezom: da se radnici ne utrkuju oko
    # istog mkd i da greška „već postoji" ne izgleda kao pad.
    made: set[str] = set()
    for _, rel in za_slanje:
        if "/" in rel:
            ensure_dir(ftp, f"{base}/{rel.rsplit('/', 1)[0]}", made)
    ftp.quit()

    jobs = 1
    if "--jobs" in args:
        jobs = max(1, min(8, int(args[args.index("--jobs") + 1])))

    posao: queue.Queue = queue.Queue()
    for stavka in za_slanje:
        posao.put(stavka)

    brojac = {"ok": 0, "greska": 0}
    kljuc = threading.Lock()
    ukupno = len(za_slanje)

    def radnik(n: int) -> None:
        veza = connect(conf, tiho=True)
        while True:
            try:
                f, rel = posao.get_nowait()
            except queue.Empty:
                break

            # Kad veza jednom istekne, ostaje mrtva: bez ponovnog povezivanja
            # svaki sljedeći fajl na toj niti pada isto tako. Zato se veza
            # podiže iznova i fajl pokušava do tri puta.
            posljednja = None
            for pokusaj in range(3):
                try:
                    with f.open("rb") as fh:
                        veza.storbinary(f"STOR {base}/{rel}", fh)
                    with kljuc:
                        brojac["ok"] += 1
                        if brojac["ok"] % 50 == 0:
                            print(
                                f"  {brojac['ok']}/{ukupno}"
                                f"{'  (grešaka ' + str(brojac['greska']) + ')' if brojac['greska'] else ''}",
                                flush=True,
                            )
                    break
                except ftplib.all_errors as e:
                    posljednja = e
                    try:
                        veza.close()
                    except Exception:
                        pass
                    try:
                        veza = connect(conf, tiho=True)
                    except ftplib.all_errors as e2:
                        posljednja = e2
                        time.sleep(3)
            else:
                with kljuc:
                    brojac["greska"] += 1
                    print(f"  ✗ {rel}: {posljednja}", flush=True)
            posao.task_done()
        try:
            veza.quit()
        except ftplib.all_errors:
            pass

    print(f"šaljem sa {jobs} {'vezom' if jobs == 1 else 'veze uporedo'}…\n")
    niti = [threading.Thread(target=radnik, args=(i,), daemon=True) for i in range(jobs)]
    for t in niti:
        t.start()
    for t in niti:
        t.join()

    poslato = brojac["ok"]
    print(f"\nposlato {poslato}, preskočeno {presko} (isti), grešaka {brojac['greska']}")

    if "--delete" in args:
        print("\nbrisanje viška na serveru nije automatsko.")
        print("Stara WP instalacija se sigurnije uklanja iz cPanel File")
        print("Managera, uz backup — v. napomenu o kompromitovanom nalogu")
        print("u README.md.")



if __name__ == "__main__":
    main()
