// Izlog — trejler u kartici i filtriranje mreže.
//
// Stanje watchliste ostaje na videoteka.ts (kartica je i .rd-vt-slot); ovdje
// je samo ono što je vezano za mrežu: video u kartici i filteri.
//
// Trejler ima dva nivoa:
//   1. preview — nijemo, u petlji, kreće ~320 ms poslije ulaska mišem i samo
//      na pravom pokazivaču; ništa se ne skida dok korisnik ne zastane,
//   2. puštanje — na klik, sa zvukom i kontrolama; svira samo jedan po jedan.
//
// Listeneri se kače na document jednom po tabu (ClientRouter mijenja DOM,
// pa element-listeneri ne bi preživjeli navigaciju).

const PREVIEW_DELAY = 320;

let docWired = false;
let hoverTimer: number | undefined;
let previewCard: HTMLElement | null = null;
let playingCard: HTMLElement | null = null;

const canPreview = () =>
  matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------ video */

function videoOf(card: HTMLElement): HTMLVideoElement | null {
  return card.querySelector<HTMLVideoElement>(".rd-izlog-video");
}

/** Skida izvor i vraća karticu na still — i za preview i za puštanje. */
function reset(card: HTMLElement | null): void {
  if (!card) return;

  const video = videoOf(card);
  if (video) {
    video.pause();
    video.removeAttribute("src");
    video.load();
    video.hidden = true;
    video.muted = true;
    video.controls = false;
    video.loop = true;
  }

  card.querySelector<HTMLIFrameElement>(".rd-izlog-frame")?.remove();
  card.classList.remove("is-preview", "is-playing");

  const stop = card.querySelector<HTMLElement>("[data-izlog-stop]");
  if (stop) stop.hidden = true;
}

function startPreview(card: HTMLElement): void {
  if (card === playingCard) return;

  const video = videoOf(card);
  // YouTube trejler nema preview — facade se učitava tek na klik.
  if (!video || !video.dataset.src) return;

  video.src = video.dataset.src;
  video.hidden = false;
  video.muted = true;
  video.controls = false;
  card.classList.add("is-preview");

  void video.play().catch(() => {
    // Autoplay odbijen — vrati still, korisnik i dalje ima dugme.
    reset(card);
  });

  previewCard = card;
}

function stopPreview(): void {
  window.clearTimeout(hoverTimer);
  if (previewCard && previewCard !== playingCard) reset(previewCard);
  previewCard = null;
}

/** Klik na „Trejler" — zvuk, kontrole, i samo jedan video u isto vrijeme. */
function play(card: HTMLElement): void {
  if (playingCard && playingCard !== card) reset(playingCard);
  if (previewCard && previewCard !== card) reset(previewCard);
  previewCard = null;

  const video = videoOf(card);
  if (!video) return;

  const ytId = video.dataset.yt;
  if (ytId) {
    const frame = document.createElement("iframe");
    frame.className = "rd-izlog-frame";
    frame.src = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`;
    frame.title = "Trejler";
    frame.allow = "autoplay; encrypted-media; picture-in-picture";
    frame.allowFullscreen = true;
    frame.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;border:0;z-index:6";
    card.querySelector("[data-screen]")?.appendChild(frame);
  } else if (video.dataset.src) {
    if (!video.src) video.src = video.dataset.src;
    video.hidden = false;
    video.muted = false;
    video.controls = true;
    // Preview se vrti u petlji, pravo puštanje ne — kad trejler prođe,
    // kartica se vraća na still.
    video.loop = false;
    video.currentTime = 0;
    void video.play().catch(() => {
      // Zvuk blokiran prije interakcije — pusti nijemo, kontrole ostaju.
      video.muted = true;
      void video.play().catch(() => reset(card));
    });
  } else {
    return;
  }

  card.classList.remove("is-preview");
  card.classList.add("is-playing");

  const stop = card.querySelector<HTMLElement>("[data-izlog-stop]");
  if (stop) stop.hidden = false;

  playingCard = card;
}

function stopPlaying(): void {
  reset(playingCard);
  playingCard = null;
}

/* ------------------------------------------------------------- potvrda klika */

function bumpCount(): void {
  const count = document.querySelector<HTMLElement>(".rd-vt-member-count");
  if (!count) return;
  count.classList.remove("is-bump");
  void count.offsetWidth; // restart animacije
  count.classList.add("is-bump");
}

/** Tab u uglu primi udarac — ivica i brojač u boji vrste, prsten koji se
 *  širi i kratak poskok. Boja stiže sa kartice koja je doletjela. */
function hitTab(kind: string): void {
  const tab = document.querySelector<HTMLElement>(".rd-vt-member-tab");
  if (!tab) return;

  if (kind) tab.style.setProperty("--rd-drop", kind);
  tab.classList.remove("is-hit");
  void tab.offsetWidth; // restart animacije
  tab.classList.add("is-hit");
  window.setTimeout(() => tab.classList.remove("is-hit"), 900);
}

/** Kadar kartice odleti u člansku kartu — kopija stilla putuje po luku do
 *  taba u uglu i tamo nestane. Tek kad sleti, tab reaguje i brojač poskoči,
 *  pa se vidi uzrok i posljedica. */
function flyToMember(card: HTMLElement): boolean {
  const tab = document.querySelector<HTMLElement>(".rd-vt-member-tab");
  const screen = card.querySelector<HTMLElement>(".rd-izlog-screen");
  const still = card.querySelector<HTMLImageElement>(".rd-izlog-still");
  if (!tab || !screen || !still || typeof screen.animate !== "function") {
    return false;
  }

  const from = screen.getBoundingClientRect();
  const to = tab.getBoundingClientRect();
  if (!from.width || !to.width) return false;

  // Ivica i sjaj u boji vrste — leti isti predmet koji je stajao u mreži.
  const kind = getComputedStyle(card).getPropertyValue("--k").trim();

  const ghost = document.createElement("img");
  ghost.className = "rd-izlog-fly";
  ghost.src = still.currentSrc || still.src;
  ghost.alt = "";
  ghost.style.left = `${from.left}px`;
  ghost.style.top = `${from.top}px`;
  ghost.style.width = `${from.width}px`;
  ghost.style.height = `${from.height}px`;
  if (kind) ghost.style.setProperty("--k", kind);
  document.body.appendChild(ghost);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);

  const anim = ghost.animate(
    [
      { transform: "translate(0, 0) scale(1) rotate(0deg)", opacity: 0.95 },
      {
        // Kratak trzaj naviše prije polijetanja — oko ga uhvati.
        transform: `translate(${dx * 0.06}px, ${dy * 0.02 - 22}px) scale(1.07) rotate(-2deg)`,
        opacity: 1,
        offset: 0.18,
      },
      {
        transform: `translate(${dx * 0.62}px, ${dy * 0.4 - 96}px) scale(0.44) rotate(-7deg)`,
        opacity: 0.95,
        offset: 0.62,
      },
      {
        transform: `translate(${dx}px, ${dy}px) scale(0.06) rotate(-12deg)`,
        opacity: 0,
      },
    ],
    { duration: 720, easing: "cubic-bezier(0.35, 0, 0.15, 1)" },
  );

  anim.addEventListener("finish", () => {
    ghost.remove();
    hitTab(kind);
    bumpCount();
  });
  anim.addEventListener("cancel", () => ghost.remove());

  return true;
}

/** Vidljiv trag da je naslov ušao u listu — članska karta stoji u uglu
 *  ekrana i lako je da promakne. */
function confirmAdd(card: HTMLElement | null): void {
  // Uklanjanje iz liste nema bljesak ni let — jezičak koji se uvuče je dovoljan.
  if (!card || !card.classList.contains("is-taken")) {
    bumpCount();
    return;
  }

  card.classList.remove("is-flash");
  void card.offsetWidth;
  card.classList.add("is-flash");
  window.setTimeout(() => card.classList.remove("is-flash"), 700);

  // Pod reduced-motion (ili ako let ne uspije) brojač poskoči odmah.
  if (reduced() || !flyToMember(card)) bumpCount();
}

/* ---------------------------------------------------------------- filteri */

/** Vrsta programa; "sve" gasi filter. Uzeto se filtrira odvojeno. */
let kindFilter = "sve";
let onlyTaken = false;

/** „1 naslov" / „2 naslova" — isto pravilo kao pri renderu strane. */
const titles = (n: number) =>
  `${n} ${n % 10 === 1 && n % 100 !== 11 ? "naslov" : "naslova"}`;

/** „5h 15min" — isti format kao u zaglavlju dana i na članskoj karti. */
function minLabel(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return `${m}min`;
  return m ? `${h}h ${m}min` : `${h}h`;
}

/** Pozicija u koordinatama dokumenta — skrol između dva mjerenja ne smije
 *  da uđe u razliku. */
function docRect(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return { x: r.left + window.scrollX, y: r.top + window.scrollY };
}

const reduced = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Dan bez ijedne vidljive kartice se sklanja; broj i minuti prate filter. */
function settleDays(grid: HTMLElement): void {
  grid.querySelectorAll<HTMLElement>(".rd-izlog-day").forEach((day) => {
    const left = [
      ...day.querySelectorAll<HTMLElement>(".rd-izlog-card:not([hidden])"),
    ];
    day.hidden = left.length === 0;

    const count = day.querySelector("[data-day-count]");
    if (count) count.textContent = titles(left.length);

    const mins = day.querySelector("[data-day-mins]");
    if (mins)
      mins.textContent = minLabel(
        left.reduce((sum, card) => sum + Number(card.dataset.duration || 0), 0),
      );
  });
}

function settleEmpty(shown: number): void {
  const empty = document.querySelector<HTMLElement>("[data-izlog-empty]");
  if (!empty) return;

  empty.hidden = shown > 0;
  const txt = empty.querySelector("[data-izlog-empty-txt]");
  if (txt)
    txt.textContent = onlyTaken
      ? "Lista je prazna — dodaj neki naslov."
      : "Ništa ne odgovara filteru.";
}

/**
 * Filtriranje u tri poteza, da mreža izgleda kao da se presložila, a ne kao
 * da je prescrtana:
 *   1. odbačene kartice izblijede uz mali pomak naviše,
 *   2. one koje ostaju kliznu na svoja nova mjesta (FLIP — zapamti staru
 *      poziciju, pusti pregled da se presloži, pa animiraj razliku),
 *   3. novopristigle uđu odozdo, u talasu.
 */
/** Brzo prebacivanje filtera ne smije da ostavi zakazan stari „commit". */
let commitTimer: number | undefined;

function applyFilters(animate = false): void {
  const grid = document.querySelector<HTMLElement>("[data-izlog]");
  if (!grid) return;

  window.clearTimeout(commitTimer);

  const cards = [...grid.querySelectorAll<HTMLElement>(".rd-izlog-card")];
  const wanted = new Map<HTMLElement, boolean>(
    cards.map((card) => {
      const kindOk = kindFilter === "sve" || card.dataset.kind === kindFilter;
      const takenOk = !onlyTaken || card.classList.contains("is-taken");
      return [card, kindOk && takenOk];
    }),
  );

  const shown = [...wanted.values()].filter(Boolean).length;

  // Skriven video ne svira — bez obzira na to da li se animira.
  cards.forEach((card) => {
    if (!wanted.get(card) && (card === playingCard || card === previewCard)) {
      reset(card);
    }
  });

  const canAnimate =
    animate && !reduced() && typeof grid.animate === "function";

  if (!canAnimate) {
    cards.forEach((card) => (card.hidden = !wanted.get(card)));
    settleDays(grid);
    settleEmpty(shown);
    return;
  }

  const leaving = cards.filter((c) => !c.hidden && !wanted.get(c));
  const entering = cards.filter((c) => c.hidden && wanted.get(c));
  const staying = cards.filter((c) => !c.hidden && wanted.get(c));

  const before = new Map(staying.map((c) => [c, docRect(c)]));

  leaving.forEach((card, i) => {
    card.style.pointerEvents = "none";
    card.animate(
      [
        { opacity: 1, transform: "none" },
        { opacity: 0, transform: "translateY(-10px) scale(0.96)" },
      ],
      {
        duration: 190,
        delay: Math.min(i, 6) * 24,
        easing: "cubic-bezier(0.4, 0, 0.9, 0.4)",
        fill: "forwards",
      },
    );
  });

  const commit = () => {
    leaving.forEach((card) => {
      card.getAnimations().forEach((a) => a.cancel());
      card.style.pointerEvents = "";
      card.hidden = true;
    });
    entering.forEach((card) => (card.hidden = false));

    settleDays(grid);
    settleEmpty(shown);

    // 2. Preostale kartice kliznu sa starog mjesta na novo.
    staying.forEach((card) => {
      const from = before.get(card);
      if (!from) return;
      const to = docRect(card);
      const dx = from.x - to.x;
      const dy = from.y - to.y;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;

      card.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
        { duration: 360, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
      );
    });

    // 3. Nove ulaze odozdo, jedna za drugom.
    entering.forEach((card, i) => {
      card.animate(
        [
          { opacity: 0, transform: "translateY(16px) scale(0.97)" },
          { opacity: 1, transform: "none" },
        ],
        {
          duration: 320,
          delay: 70 + Math.min(i, 7) * 45,
          easing: "cubic-bezier(0.2, 0, 0.1, 1)",
          fill: "backwards",
        },
      );
    });
  };

  if (leaving.length) {
    commitTimer = window.setTimeout(
      commit,
      190 + Math.min(leaving.length - 1, 6) * 24,
    );
  } else {
    commit();
  }
}

/** Poslije filtriranja rezultat mora biti u kadru — ako je mreža ostala
 *  iznad vidljivog dijela, glatko se vraćamo na njen početak. */
function scrollToResults(): void {
  const grid = document.querySelector<HTMLElement>("[data-izlog]");
  const bar = document.querySelector<HTMLElement>(".rd-izlog-bar");
  if (!grid || !bar) return;

  const top = grid.getBoundingClientRect().top;
  const barBottom = bar.getBoundingClientRect().bottom;
  if (top >= barBottom) return; // početak mreže je već u kadru

  window.scrollTo({
    top: window.scrollY + top - barBottom - 12,
    behavior: reduced() ? "auto" : "smooth",
  });
}

function syncChips(): void {
  document
    .querySelectorAll<HTMLElement>("[data-filter-kind]")
    .forEach((chip) =>
      chip.setAttribute(
        "aria-pressed",
        String(chip.dataset.filterKind === kindFilter),
      ),
    );

  const takenChip = document.querySelector<HTMLElement>("[data-filter-taken]");
  if (takenChip) takenChip.setAttribute("aria-pressed", String(onlyTaken));
}

/* -------------------------------------------------------------- listeneri */

function wireDocument(): void {
  if (docWired) return;
  docWired = true;

  // `ended` ne bubbla — hvata se u fazi hvatanja, delegirano kao i ostalo.
  document.addEventListener(
    "ended",
    (event) => {
      const card = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        ".rd-izlog-card",
      );
      if (card && card === playingCard) stopPlaying();
    },
    true,
  );

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const playBtn = target.closest<HTMLElement>("[data-izlog-play]");
    if (playBtn) {
      const card = playBtn.closest<HTMLElement>(".rd-izlog-card");
      if (card) play(card);
      return;
    }

    if (target.closest("[data-izlog-stop]")) {
      stopPlaying();
      return;
    }

    // Skok na dan — glatko, i bez skoka pod reduced-motion. Native `href`
    // ostaje u markupu, pa link radi i bez JS-a.
    const dayLink = target.closest<HTMLAnchorElement>(".rd-izlog-daylink");
    if (dayLink) {
      const hash = dayLink.getAttribute("href") ?? "";
      const day = document.querySelector(hash);
      if (day) {
        event.preventDefault();
        day.scrollIntoView({
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
          block: "start",
        });
        history.pushState(null, "", hash);
      }
      return;
    }

    const kindChip = target.closest<HTMLElement>("[data-filter-kind]");
    if (kindChip) {
      kindFilter = kindChip.dataset.filterKind ?? "sve";
      syncChips();
      applyFilters(true);
      scrollToResults();
      return;
    }

    if (target.closest("[data-filter-taken]")) {
      onlyTaken = !onlyTaken;
      syncChips();
      applyFilters(true);
      scrollToResults();
      return;
    }

    // Info dijalog preuzima ekran — utišaj sve u mreži.
    if (target.closest<HTMLElement>("[data-open]")?.dataset.open) {
      stopPreview();
      stopPlaying();
      return;
    }

    // Dodavanje iz info dijaloga nema odakle da poleti (kartica je iza
    // modala), ali brojač i tad treba da potvrdi klik.
    if (target.closest("[data-sheet-take]")) {
      setTimeout(bumpCount, 0);
      return;
    }

    // Dodavanje u listu mijenja .is-taken tek u render() iz videoteka.ts,
    // pa se na rezultat čeka jedan tik.
    const toggle = target.closest<HTMLElement>("[data-toggle]");
    if (toggle) {
      setTimeout(() => {
        confirmAdd(toggle.closest<HTMLElement>(".rd-izlog-card"));
        if (onlyTaken) applyFilters(true);
      }, 0);
    }
  });

  // Esc gasi trejler — ali samo kad omot nije otvoren, njega Esc već zatvara.
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !playingCard) return;
    if (document.querySelector<HTMLDialogElement>("[data-sheet]")?.open) return;
    stopPlaying();
  });

  if (canPreview()) {
    document.addEventListener("pointerover", (event) => {
      const card = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        ".rd-izlog-card",
      );
      if (!card || card === previewCard || card === playingCard) return;

      stopPreview();
      hoverTimer = window.setTimeout(() => startPreview(card), PREVIEW_DELAY);
    });

    document.addEventListener("pointerout", (event) => {
      const card = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        ".rd-izlog-card",
      );
      if (!card || card !== previewCard) return;

      const to = event.relatedTarget as Node | null;
      if (to && card.contains(to)) return; // kretanje unutar iste kartice
      stopPreview();
    });
  }

  // Navigacija odnosi DOM sa sobom — pusti reference prije zamjene.
  document.addEventListener("astro:before-swap", () => {
    window.clearTimeout(hoverTimer);
    previewCard = null;
    playingCard = null;
    document.querySelectorAll(".rd-izlog-fly").forEach((el) => el.remove());
  });
}

/** Trejler koji je otišao sa ekrana nema publiku — gasi se sam. */
let offscreen: IntersectionObserver | undefined;

function watchOffscreen(): void {
  offscreen?.disconnect();
  // Prag u oba smjera — `isIntersecting` ostaje tačno i kad od kartice
  // viri jedan piksel, pa se gleda sam odnos.
  offscreen = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.intersectionRatio >= 0.25) continue;
        const card = entry.target as HTMLElement;
        if (card === playingCard) stopPlaying();
        else if (card === previewCard) stopPreview();
      }
    },
    { threshold: [0, 0.25] },
  );

  document
    .querySelectorAll<HTMLElement>(".rd-izlog-card")
    .forEach((card) => offscreen!.observe(card));
}

/* ------------------------------------------------------- visina filter trake */

/** Zaglavlje dana se lijepi ispod filter trake, a ona mijenja visinu kad se
 *  čipovi preliju u drugi red. Mjera ide u --rd-bar-h, CSS je koristi. */
let barSize: ResizeObserver | undefined;

function trackBarHeight(): void {
  const bar = document.querySelector<HTMLElement>(".rd-izlog-bar");
  if (!bar) return;

  const apply = () => {
    const h = Math.round(bar.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--rd-bar-h", `${h}px`);
    watchStuck(h);
  };

  apply();
  barSize?.disconnect();
  barSize = new ResizeObserver(apply);
  barSize.observe(bar);
}

/* ----------------------------------------------------------- zalijepljen dan */

/** Zaglavlje koje se zalijepilo dobija .is-stuck — tad se naslov dana skuplja
 *  na veličinu ostalog teksta, da traka ne guta pola ekrana.
 *
 *  Trik: posmatramo zaglavlje sa gornjom marginom tačno na tački lijepljenja.
 *  Dok je slobodno, vidi se cijelo (ratio 1); čim se zalijepi, gornji piksel
 *  izlazi iz posmatranog okvira i ratio padne ispod 1. */
let stuckObs: IntersectionObserver | undefined;

function watchStuck(barH: number): void {
  stuckObs?.disconnect();
  stuckObs = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        entry.target.classList.toggle("is-stuck", entry.intersectionRatio < 1);
      }
    },
    { threshold: [1], rootMargin: `-${64 + barH + 1}px 0px 0px 0px` },
  );

  document
    .querySelectorAll<HTMLElement>(".rd-izlog-dayhead")
    .forEach((head) => stuckObs!.observe(head));
}

export function wireIzlog(): void {
  if (!document.querySelector("[data-izlog]")) return;

  wireDocument();
  watchOffscreen();
  trackBarHeight();
  syncChips();
  applyFilters();
}
