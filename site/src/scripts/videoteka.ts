// Videoteka — logika kartica, info dijaloga i članske karte.
//
// Bez frameworka: stanje živi u localStorage-u, DOM se osvježava jednim
// render() prolazom. Metapodaci se uvoze iz istog fajla koji renderuje
// stranicu, pa nema drugog izvora istine ni dupliranja u data- atributima.
//
// Delegirani listeneri kače se na document tačno jednom (modul se izvršava
// jednom po tabu); wireVideoteka() se poziva i na astro:page-load jer
// ClientRouter zamijeni DOM, a stanje treba ponovo iscrtati.

import { program, type ProgramItem } from "../data/program";

const STORE_KEY = "rd:watchlist:v1";
const MEMBER_KEY = "rd:member-no:v1";
const SHARE_PREFIX = "w=";

interface Entry {
  /** Kad je dodat — redoslijed dodavanja. */
  at: number;
}

type State = Record<string, Entry>;

/** Dan + termin uz stavku, sve na jednom mjestu za render i .ics. */
interface Resolved {
  item: ProgramItem;
  dayId: string;
  dayLabel: string;
  date: string;
  city: string;
  venue: string;
  /** Minuti od ponoći; null kad termin nije upisan. */
  startMin: number | null;
  endMin: number | null;
}

/* ------------------------------------------------------------------ index */

const index = new Map<string, Resolved>();

for (const day of program) {
  for (const item of day.items) {
    index.set(item.id, {
      item,
      dayId: day.id,
      dayLabel: day.label,
      date: day.date,
      city: day.city,
      venue: day.venue,
      startMin: toMin(item.start),
      endMin: toMin(item.end),
    });
  }
}

function toMin(hhmm?: string): number | null {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
}

/** Kompaktno, kao u zaglavlju dana: „5h 15min". */
function minLabel(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return `${m}min`;
  return m ? `${h}h ${m}min` : `${h}h`;
}

/* ------------------------------------------------------------------ store */

function load(): State {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as State;
    if (!parsed || typeof parsed !== "object") return {};
    // Odbaci ID-jeve kojih više nema u programu — program se mijenja.
    const clean: State = {};
    for (const [id, entry] of Object.entries(parsed)) {
      if (!index.has(id)) continue;
      clean[id] = { at: Number(entry?.at) || Date.now() };
    }
    return clean;
  } catch {
    return {};
  }
}

function save(state: State): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    /* privatni mod / pun storage — radi dalje, samo bez pamćenja */
  }
}

function memberNo(): string {
  try {
    const existing = localStorage.getItem(MEMBER_KEY);
    if (existing) return existing;
    const fresh = `RD8-${String(Math.floor(1000 + Math.random() * 8999))}`;
    localStorage.setItem(MEMBER_KEY, fresh);
    return fresh;
  } catch {
    return "RD8-0000";
  }
}

let state: State = {};

/* -------------------------------------------------------------- preklapanja */

/** ID-jevi uzetih termina koji se sudaraju sa nekim drugim uzetim terminom. */
function clashing(): Set<string> {
  const out = new Set<string>();
  const byDay = new Map<string, Resolved[]>();

  for (const id of Object.keys(state)) {
    const r = index.get(id);
    if (!r || r.startMin === null || r.endMin === null) continue;
    const list = byDay.get(r.dayId) ?? [];
    list.push(r);
    byDay.set(r.dayId, list);
  }

  for (const list of byDay.values()) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        if (a.startMin! < b.endMin! && b.startMin! < a.endMin!) {
          out.add(a.item.id);
          out.add(b.item.id);
        }
      }
    }
  }

  return out;
}

/* ----------------------------------------------------------------- render */

function render(): void {
  const clash = clashing();
  const taken = Object.keys(state);

  // 1. Kartice u mreži
  document.querySelectorAll<HTMLElement>(".rd-vt-slot").forEach((slot) => {
    const id = slot.dataset.id ?? "";
    const isTaken = id in state;
    slot.classList.toggle("is-taken", isTaken);
    slot.classList.toggle("is-clash", clash.has(id));

    const quick = slot.querySelector<HTMLButtonElement>("[data-toggle]");
    if (quick) {
      quick.setAttribute("aria-pressed", String(isTaken));
      const glyph = quick.querySelector(".rd-vt-quick-glyph");
      if (glyph) glyph.textContent = isTaken ? "✓" : "+";
      const label = quick.querySelector(".sr-only");
      const title = index.get(id)?.item.title ?? "";
      if (label)
        label.textContent = `${
          isTaken ? "Ukloni iz liste" : "Dodaj u listu"
        } — ${title}`;
    }
  });

  // 2. Brojač na tabu
  const count = document.querySelector("[data-member-count]");
  if (count) count.textContent = String(taken.length);

  const no = document.querySelector("[data-member-no]");
  if (no) no.textContent = memberNo();

  // 3. Redovi karte — grupisani po danu, sortirani po terminu
  const rows = document.querySelector<HTMLElement>("[data-member-rows]");
  const tpl = document.querySelector<HTMLTemplateElement>(
    "[data-member-rowtpl]",
  );
  const empty = document.querySelector<HTMLElement>("[data-member-empty]");

  if (rows && tpl) {
    rows.textContent = "";

    const resolved = taken
      .map((id) => index.get(id))
      .filter((r): r is Resolved => Boolean(r))
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.startMin ?? 9999) - (b.startMin ?? 9999);
      });

    let lastDay = "";
    for (const r of resolved) {
      if (r.dayId !== lastDay) {
        lastDay = r.dayId;
        const head = document.createElement("p");
        head.className = "rd-vt-row-daylabel";
        head.textContent = `${r.dayLabel} · ${r.city}`;
        rows.appendChild(head);
      }

      const node = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;
      node.dataset.id = r.item.id;
      node.classList.toggle("is-clash", clash.has(r.item.id));

      node.querySelector("[data-row-time]")!.textContent = r.item.start ?? "—";
      node.querySelector("[data-row-title]")!.textContent = r.item.title;
      node.querySelector("[data-row-sub]")!.textContent =
        `${r.item.duration}′ · ${r.item.cat}`;

      rows.appendChild(node);
    }

    if (empty) empty.hidden = taken.length > 0;
  }

  // 4. Upozorenje o preklapanju
  const clashBox = document.querySelector<HTMLElement>("[data-member-clash]");
  const clashTxt = document.querySelector("[data-member-clash-txt]");
  if (clashBox && clashTxt) {
    clashBox.hidden = clash.size === 0;
    if (clash.size) {
      const titles = [...clash]
        .map((id) => index.get(id)?.item.title)
        .filter(Boolean);
      clashTxt.textContent = `${titles.join(" i ")} se preklapaju. Izaberi jedno.`;
    }
  }

  // 5. Zbir po danima
  const total = document.querySelector<HTMLElement>("[data-member-total]");
  if (total) {
    if (!taken.length) {
      total.textContent = "";
    } else {
      const perDay = new Map<string, { label: string; mins: number }>();
      for (const id of taken) {
        const r = index.get(id);
        if (!r) continue;
        const cur = perDay.get(r.dayId) ?? { label: r.dayLabel, mins: 0 };
        cur.mins += r.item.duration;
        perDay.set(r.dayId, cur);
      }
      total.textContent = [...perDay.values()]
        .map((d) => `${d.label}: ${minLabel(d.mins)}`)
        .join("  ·  ");
    }
  }

  // 6. Dugme u otvorenom omotu
  const sheet = document.querySelector<HTMLDialogElement>("[data-sheet]");
  if (sheet?.open) syncSheetControls(sheet);
}

/* ------------------------------------------------------------------- omot */

/** Odakle je dijalog izletio — kadar kartice koja ga je otvorila. */
let sheetOrigin: DOMRect | null = null;
let sheetClosing = false;
/** Izlazna animacija zatvaranja koje je još u toku — v. closeSheet(). */
let sheetOutAnim: Animation | null = null;
/**
 * Posljednja izlazna animacija, bez obzira na stanje. Odvojena od
 * `sheetOutAnim`, koji se prazni čim zatvaranje bude dovršeno: ova referencija
 * preživi i završeno zatvaranje, jer animacija sa `fill: forwards` i tada
 * nastavlja da drži `opacity: 0` i umanjen transform. Na nju se otkazivanje
 * oslanja umjesto na `getAnimations()`, koji je u nekim stanjima ne prijavi
 * iako i dalje djeluje — tada dijalog ostane otvoren i neviden.
 */
let lastOutAnim: Animation | null = null;

const reducedMotion = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches;

function openSheet(id: string): void {
  const sheet = document.querySelector<HTMLDialogElement>("[data-sheet]");
  const body = document.querySelector<HTMLElement>("[data-sheet-body]");
  const source = document.querySelector<HTMLElement>(`[data-detail="${id}"]`);
  if (!sheet || !body || !source) return;

  // Boja vrste i polazni kadar stižu sa kartice — dijalog nastavlja njen izgled.
  const card = source.closest<HTMLElement>("[data-kind]");
  const screen = card?.querySelector<HTMLElement>(".rd-izlog-screen");
  sheetOrigin = (screen ?? card)?.getBoundingClientRect() ?? null;

  const kind = card
    ? getComputedStyle(card).getPropertyValue("--k").trim()
    : "";
  if (kind) sheet.style.setProperty("--k", kind);
  else sheet.style.removeProperty("--k");

  const clone = source.cloneNode(true) as HTMLElement;
  clone.hidden = false;
  clone.removeAttribute("hidden");

  const title = clone.querySelector("[data-sheet-title]");
  if (title) title.id = "rd-vt-sheet-title";

  body.textContent = "";
  body.appendChild(clone);
  body.scrollTop = 0;

  sheet.dataset.item = id;
  syncSheetControls(sheet);

  // Zatvaranje koje je još u toku se prekida. Veza sa njegovom izlaznom
  // animacijom se raskida prije otkazivanja, jer njen `cancel` slušalac
  // dovršava zatvaranje — a dijalog koji sada otvaramo nije onaj koji se
  // zatvarao, pa bi se zatvorio čim ga prikažemo.
  const stale = sheetOutAnim;
  sheetOutAnim = null;
  sheetClosing = false;
  stale?.cancel();

  // Otkazivanje po referenci — ne zavisi od toga da li je animacija u listi.
  const zaostali = lastOutAnim;
  lastOutAnim = null;
  zaostali?.cancel();

  if (!sheet.open) {
    if (typeof sheet.showModal === "function") sheet.showModal();
    else sheet.setAttribute("open", "");
  }

  // Ostatak se čisti tek poslije prikaza, i to je bitno: zatvoren <dialog> je
  // `display: none`, pa getAnimations() na njemu vraća praznu listu i nema se
  // šta otkazati. Već završena izlazna animacija ima `fill: forwards` i
  // preživi zatvaranje — čim showModal() vrati dijalog u prikaz, ona opet
  // drži opacity 0 i umanjen transform, preko svježe napunjenog sadržaja.
  sheet.getAnimations?.().forEach((a) => a.cancel());

  flipSheet(sheet, "in");
}

/** Dijalog izleti iz kartice i vrati se u nju — ista ideja kao let u listu. */
function flipSheet(
  sheet: HTMLDialogElement,
  dir: "in" | "out",
): Animation | null {
  if (!sheetOrigin || typeof sheet.animate !== "function" || reducedMotion()) {
    return null;
  }

  const to = sheet.getBoundingClientRect();
  if (!to.width || !to.height) return null;

  // Jedan faktor za obje ose — nesrazmjerno skaliranje izobliči sadržaj.
  const scale = Math.min(1, Math.max(0.12, sheetOrigin.width / to.width));
  const dx = sheetOrigin.left + sheetOrigin.width / 2 - (to.left + to.width / 2);
  const dy = sheetOrigin.top + sheetOrigin.height / 2 - (to.top + to.height / 2);

  const small = {
    transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
    opacity: 0,
  };
  const full = { transform: "none", opacity: 1 };

  return sheet.animate(dir === "in" ? [small, full] : [full, small], {
    duration: dir === "in" ? 400 : 300,
    easing:
      dir === "in"
        ? "cubic-bezier(0.2, 1.05, 0.35, 1)"
        : "cubic-bezier(0.5, 0, 0.85, 0.4)",
    // Izlaz ostaje na kraju dok close() ne sakrije dijalog — inače trepne
    // natrag u punu veličinu na jedan frejm.
    fill: dir === "out" ? "forwards" : "none",
  });
}

function syncSheetControls(sheet: HTMLDialogElement): void {
  const id = sheet.dataset.item ?? "";
  const isTaken = id in state;

  const take = sheet.querySelector<HTMLButtonElement>("[data-sheet-take]");
  const label = sheet.querySelector("[data-sheet-take-label]");
  if (take) take.dataset.taken = String(isTaken);
  if (label) label.textContent = isTaken ? "Ukloni iz liste" : "Dodaj u listu";

}

/** Skida trejler i prazni ljušturu — poslije stvarnog close()-a. */
function cleanupSheet(): void {
  const sheet = document.querySelector<HTMLDialogElement>("[data-sheet]");
  const body = document.querySelector<HTMLElement>("[data-sheet-body]");
  if (!sheet) return;

  // `close` na <dialog> stiže kao zadatak iz reda čekanja, pa može stići i
  // pošto je omot već ponovo otvoren — dovoljno je da neko klikne INFO u tih
  // nekoliko milisekundi. Tada ovo čišćenje pripada prošlom sadržaju i
  // ispraznilo bi dijalog koji je upravo napunjen: ostane otvoren i prazan,
  // sa zatamnjenom stranom iza sebe.
  if (sheet.open) return;

  sheet.querySelectorAll("video").forEach((v) => {
    v.pause();
    v.removeAttribute("src");
    v.load();
  });
  sheet.querySelectorAll("iframe").forEach((f) => f.remove());

  if (body) body.textContent = "";
  delete sheet.dataset.item;
  sheetClosing = false;
}

function closeSheet(): void {
  const sheet = document.querySelector<HTMLDialogElement>("[data-sheet]");
  if (!sheet) return;

  if (!sheet.open) {
    cleanupSheet();
    return;
  }
  if (sheetClosing) return;

  // Zvuk prestaje odmah, slika još putuje nazad u karticu.
  sheet.querySelectorAll("video").forEach((v) => v.pause());

  const anim = flipSheet(sheet, "out");
  if (!anim) {
    sheet.close();
    return;
  }

  sheetClosing = true;
  sheetOutAnim = anim;
  lastOutAnim = anim;
  const finish = () => {
    // Otkazano iz openSheet(): zatvaranje je prekinuto, dijalog je opet gore.
    if (sheetOutAnim !== anim) return;
    sheetOutAnim = null;
    if (sheet.open) sheet.close();
    else cleanupSheet();
  };
  anim.addEventListener("finish", finish);
  anim.addEventListener("cancel", finish);
}

/** Trejler se učitava tek na klik — do tada je na ekranu samo still. */
function playTrailer(btn: HTMLElement): void {
  const media = btn.closest<HTMLElement>(".rd-vt-d-media");
  if (!media) return;

  const video = media.querySelector<HTMLVideoElement>(".rd-vt-d-video");
  if (!video) return;

  const ytId = video.dataset.yt;
  if (ytId) {
    const frame = document.createElement("iframe");
    frame.src = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`;
    frame.title = "Trejler";
    frame.allow = "autoplay; encrypted-media; picture-in-picture";
    frame.allowFullscreen = true;
    frame.style.cssText = "position:absolute;inset:0;width:100%;height:100%;border:0";
    media.appendChild(frame);
  } else if (video.dataset.src) {
    video.src = video.dataset.src;
    video.hidden = false;
    void video.play().catch(() => {
      /* autoplay blokiran — ostaju kontrole */
    });
  }

  btn.remove();
  media.querySelector(".rd-vt-d-still")?.setAttribute("hidden", "");
}

/* -------------------------------------------------------------- .ics izvoz */

function icsEscape(text: string): string {
  return text.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

function icsStamp(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

function exportIcs(): void {
  const ids = Object.keys(state).filter((id) => {
    const r = index.get(id);
    return r && r.date && r.item.start;
  });
  if (!ids.length) return;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Rokumentarni dani//RD8//ME",
    "CALSCALE:GREGORIAN",
  ];

  for (const id of ids) {
    const r = index.get(id)!;
    // Lokalno („floating") vrijeme — događaj je vezan za salu, ne za zonu.
    const start = `${r.date.replace(/-/g, "")}T${r.item.start!.replace(":", "")}00`;

    lines.push(
      "BEGIN:VEVENT",
      `UID:rd8-${id}@rokumentarnidani.me`,
      `DTSTAMP:${icsStamp(new Date())}`,
      `DTSTART:${start}`,
      `DURATION:PT${r.item.duration}M`,
      `SUMMARY:${icsEscape(`${r.item.title} — Rokumentarni dani`)}`,
      `LOCATION:${icsEscape(`${r.venue}, ${r.city}`)}`,
      `DESCRIPTION:${icsEscape(r.item.synopsis)}`,
    );

    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  const blob = new Blob([lines.join("\r\n")], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "rokumentarni-dani.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ----------------------------------------------------------- tuđa lista */

/** Lista iz tuđeg linka (#w=id.id) — ponudi, ne nameći. Link se više ne
 *  pravi u kartici, ali stari linkovi i dalje rade. */
function checkShared(): void {
  const bar = document.querySelector<HTMLElement>("[data-import]");
  if (!bar) return;

  const hash = location.hash.slice(1);
  if (!hash.startsWith(SHARE_PREFIX)) return;

  const ids = hash
    .slice(SHARE_PREFIX.length)
    .split(".")
    .filter((id) => index.has(id));

  if (!ids.length) return;

  const txt = bar.querySelector("[data-import-txt]");
  if (txt)
    txt.textContent = `Neko ti je poslao listu — ${ids.length} ${
      ids.length === 1 ? "naslov" : "naslova"
    }.`;

  bar.dataset.ids = ids.join(".");
  bar.hidden = false;
}

/* --------------------------------------------------------------- listeneri */

let docWired = false;
let openTimer: number | undefined;
let clearTimer: number | undefined;

/** „Isprazni" briše cijelu listu, pa traži drugi klik. */
function armClear(btn: HTMLElement): void {
  btn.dataset.confirm = "true";
  btn.textContent = "Sigurno?";
  window.clearTimeout(clearTimer);
  clearTimer = window.setTimeout(() => disarmClear(), 4000);
}

function disarmClear(): void {
  window.clearTimeout(clearTimer);
  const btn = document.querySelector<HTMLElement>("[data-member-clear]");
  if (!btn) return;
  delete btn.dataset.confirm;
  btn.textContent = "Isprazni";
}

function wireDocument(): void {
  if (docWired) return;
  docWired = true;

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    // Otvori info o naslovu — samo ako `data-open` zaista nosi id stavke.
    const open = target.closest<HTMLElement>("[data-open]");
    if (open?.dataset.open && index.has(open.dataset.open)) {
      openSheet(open.dataset.open);
      return;
    }

    // Brzo uzmi / vrati sa police
    const quick = target.closest<HTMLElement>("[data-toggle]");
    if (quick) {
      toggle(quick.dataset.toggle!);
      return;
    }

    // Omot: uzmi / vrati
    if (target.closest("[data-sheet-take]")) {
      const sheet = document.querySelector<HTMLDialogElement>("[data-sheet]");
      if (sheet?.dataset.item) toggle(sheet.dataset.item);
      return;
    }

    if (target.closest("[data-sheet-close]")) {
      closeSheet();
      return;
    }

    const play = target.closest<HTMLElement>("[data-play]");
    if (play) {
      playTrailer(play);
      return;
    }

    // Članska karta
    // Otvaraju je i tab i × u zaglavlju — stanje je na omotaču, pa se
    // aria-expanded upisuje na svaki okidač.
    if (target.closest("[data-member-toggle]")) {
      const wrap = document.querySelector<HTMLElement>("[data-member]");
      if (wrap) {
        const next = wrap.dataset.expanded !== "true";
        wrap.dataset.expanded = String(next);
        document
          .querySelectorAll("[data-member-toggle]")
          .forEach((el) => el.setAttribute("aria-expanded", String(next)));

        if (!next) disarmClear();

        // Redovi se talasaju samo na otvaranju i zatvaranju, ne i pri svakoj
        // izmjeni liste. Klasa stoji koliko traje animacija.
        window.clearTimeout(openTimer);
        wrap.classList.remove("is-opening", "is-closing");
        wrap.classList.add(next ? "is-opening" : "is-closing");
        openTimer = window.setTimeout(
          () => wrap.classList.remove("is-opening", "is-closing"),
          next ? 700 : 420,
        );
      }
      return;
    }

    const del = target.closest<HTMLElement>("[data-row-del]");
    if (del) {
      const row = del.closest<HTMLElement>(".rd-vt-row");
      if (row?.dataset.id) toggle(row.dataset.id);
      return;
    }

    if (target.closest("[data-member-ics]")) {
      exportIcs();
      return;
    }

    const clear = target.closest<HTMLElement>("[data-member-clear]");
    if (clear) {
      if (clear.dataset.confirm === "true") {
        state = {};
        save(state);
        render();
        disarmClear();
      } else {
        armClear(clear);
      }
      return;
    }

    // Klik bilo gdje drugo poništava spremno brisanje.
    disarmClear();

    // Traka za uvoz podijeljene liste
    if (target.closest("[data-import-yes]")) {
      const bar = document.querySelector<HTMLElement>("[data-import]");
      const ids = (bar?.dataset.ids ?? "").split(".").filter(Boolean);
      for (const id of ids) {
        if (!index.has(id) || id in state) continue;
        state[id] = { at: Date.now() };
      }
      save(state);
      render();
      if (bar) bar.hidden = true;
      history.replaceState(null, "", location.pathname + location.search);
      return;
    }

    if (target.closest("[data-import-no]")) {
      const bar = document.querySelector<HTMLElement>("[data-import]");
      if (bar) bar.hidden = true;
      history.replaceState(null, "", location.pathname + location.search);
      return;
    }
  });

  // Klik na backdrop zatvara omot.
  document.addEventListener("mousedown", (event) => {
    const sheet = document.querySelector<HTMLDialogElement>("[data-sheet]");
    if (!sheet?.open) return;
    const target = event.target as HTMLElement;
    if (target === sheet) closeSheet();
  });

  // Druga kartica je promijenila listu — ostani u sinhronu.
  window.addEventListener("storage", (event) => {
    if (event.key !== STORE_KEY) return;
    state = load();
    render();
  });
}

function toggle(id: string): void {
  if (!index.has(id)) return;

  if (id in state) delete state[id];
  else state[id] = { at: Date.now() };

  save(state);
  render();
}

/* ------------------------------------------------------------------ ulazak */

export function wireVideoteka(): void {
  if (!document.querySelector(".rd-vt-slot")) return;

  state = load();
  wireDocument();

  // `close` na <dialog> ne bubbla, pa ide direktno na element. Dialog je nov
  // poslije svake navigacije — zastavica sprječava dupli listener.
  const sheet = document.querySelector<HTMLDialogElement>("[data-sheet]");
  if (sheet && sheet.dataset.wired !== "true") {
    sheet.dataset.wired = "true";
    sheet.addEventListener("close", () => cleanupSheet());

    // Esc: native close bi presjekao animaciju, pa je vodimo sami.
    sheet.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeSheet();
    });
  }

  checkShared();
  render();
}
