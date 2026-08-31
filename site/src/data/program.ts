// Program festivala — MOCKUP PODACI.
//
// Raspored (dani, termini, trajanja) je prepisan iz radne verzije RD8
// programa. Sve ostalo — režija, zemlja, godina, sinopsis, still i trejler —
// je PLACEHOLDER i mora se zamijeniti prije objave. Stillovi su privremeno
// posuđeni iz arhive ranijih izdanja (/media/...), trejler je lokalni loop.
//
// Kad stignu pravi podaci: mijenja se samo ovaj fajl. Stranica, polica,
// omot i članska karta čitaju isključivo odavde.

export type ProgramKind =
  | "film" // dokumentarac u glavnom programu
  | "videodrom" // blok kratkih formi / spotova
  | "koncert"
  | "tribina" // razgovor, promocija, panel
  | "rezerva"; // nije u satnici — čeka slobodan termin

export interface Trailer {
  /** mp4 svira inline; youtube se učitava tek na klik (facade). */
  type: "mp4" | "youtube";
  /** putanja do fajla, ili YouTube video ID. */
  src: string;
}

export interface ProgramItem {
  /** Stabilan ključ — ide u localStorage i u share-link. Ne mijenjati. */
  id: string;
  /** Kataloški broj na kičmi kasete. */
  cat: string;
  kind: ProgramKind;
  title: string;
  origTitle?: string;
  /** "17:30" — prazno za rezerve. */
  start?: string;
  end?: string;
  /** Minuti — jedini izvor istine za trajanje i detekciju preklapanja. */
  duration: number;
  year?: number;
  country?: string;
  director?: string;
  synopsis: string;
  /** Still 539×303 iz arhive — privremeno. */
  still: string;
  trailer?: Trailer;
  tags?: string[];
}

export interface ProgramDay {
  id: string;
  label: string;
  /** ISO datum — potreban za .ics export. */
  date: string;
  dateLabel: string;
  city: string;
  venue: string;
  items: ProgramItem[];
}

const M = "/media/2022/12";
const M23 = "/media/2023/11";

/** Placeholder trejler — projektorski loop koji već imamo u /public. */
const TRAILER: Trailer = { type: "mp4", src: "/projector-loop.mp4" };

export const program: ProgramDay[] = [
  {
    id: "cet",
    label: "Četvrtak",
    date: "2026-12-10",
    dateLabel: "10. decembar",
    city: "Nikšić",
    venue: "Blues Brothers Bar",
    items: [
      {
        id: "cet-videodrom",
        cat: "RD8-001",
        kind: "videodrom",
        title: "Videodrom",
        start: "17:00",
        end: "17:30",
        duration: 30,
        synopsis:
          "Uvodni blok — izbor crnogorskih spotova i kratkih video formi novije produkcije, pušten bez najave, kao kad se traka vrti dok se sala puni.",
        still: `${M}/DAN1-539x303.jpg`,
        tags: ["spotovi", "CG"],
      },
      {
        id: "cet-punk",
        cat: "RD8-002",
        kind: "film",
        title: "Punk u doba komunizma",
        start: "17:30",
        end: "19:10",
        duration: 100,
        year: 2019,
        country: "Slovenija",
        director: "Placeholder Ime",
        synopsis:
          "PLACEHOLDER SINOPSIS. Priča o sceni koja je nastala u stanovima i podrumima, prije nego što je iko od njih imao pojma da pravi istoriju.",
        still: `${M}/Borderland-Soundtrack-539x303.jpg`,
        trailer: TRAILER,
        tags: ["punk", "ex-YU"],
      },
      {
        id: "cet-mucin-prica",
        cat: "RD8-003",
        kind: "tribina",
        title: "Priča sa Mučinom",
        start: "19:10",
        end: "19:45",
        duration: 35,
        synopsis:
          "Razgovor o albumu, organizaciji, bookingu i koncertima — kako se danas izvlači tura kroz region bez etikete iza sebe.",
        still: `${M}/DAN2-539x303.jpg`,
        tags: ["razgovor"],
      },
      {
        id: "cet-praslovan",
        cat: "RD8-004",
        kind: "film",
        title: "Praslovan",
        start: "19:45",
        end: "21:15",
        duration: 90,
        year: 2024,
        country: "Srbija",
        director: "Placeholder Ime",
        synopsis:
          "PLACEHOLDER SINOPSIS. Portret autora koji je decenijama radio mimo scene, i scene koja ga je tek naknadno prepoznala.",
        still: `${M}/Other-Music-539x303.jpg`,
        trailer: TRAILER,
        tags: ["portret"],
      },
      {
        id: "cet-koncert-mucin",
        cat: "RD8-005",
        kind: "koncert",
        title: "Mučin",
        start: "21:30",
        end: "22:30",
        duration: 60,
        country: "Crna Gora",
        synopsis:
          "Koncert u sali, poslije projekcija. Ulaz besplatan, kao i na sve ostalo.",
        still: `${M}/DAN3-539x303.jpg`,
        tags: ["live"],
      },
    ],
  },
  {
    id: "pet",
    label: "Petak",
    date: "2026-12-11",
    dateLabel: "11. decembar",
    city: "Nikšić",
    venue: "Blues Brothers Bar",
    items: [
      {
        id: "pet-videodrom",
        cat: "RD8-006",
        kind: "videodrom",
        title: "Videodrom",
        start: "17:00",
        end: "17:30",
        duration: 30,
        synopsis:
          "Drugi blok kratkih formi — regionalni spotovi i video-radovi.",
        still: `${M}/DAN4-539x303.jpg`,
        tags: ["spotovi"],
      },
      {
        id: "pet-40watts",
        cat: "RD8-007",
        kind: "film",
        title: "40 Watts from Nowhere",
        start: "17:30",
        end: "19:00",
        duration: 89,
        year: 2023,
        country: "SAD",
        director: "Placeholder Ime",
        synopsis:
          "PLACEHOLDER SINOPSIS. Piratski radio u Los Angelesu — 40 vati i antena na krovu protiv cijele industrije.",
        still: `${M23}/littlerichard-539x303.jpg`,
        trailer: TRAILER,
        tags: ["radio", "DIY"],
      },
      {
        id: "pet-grandpa",
        cat: "RD8-008",
        kind: "film",
        title: "Grandpa Guru",
        start: "19:00",
        end: "20:30",
        duration: 91,
        year: 2022,
        country: "Holandija",
        director: "Placeholder Ime",
        synopsis:
          "PLACEHOLDER SINOPSIS. Čovjek koji je pola vijeka snimao sve oko sebe, i arhiva koja je od toga ostala.",
        still: `${M23}/sonnyboy-539x303.jpg`,
        trailer: TRAILER,
        tags: ["arhiva"],
      },
      {
        id: "pet-madeinny",
        cat: "RD8-009",
        kind: "film",
        title: "Made in NY Jazz",
        start: "20:30",
        end: "21:00",
        duration: 27,
        year: 2021,
        country: "SAD",
        director: "Placeholder Ime",
        synopsis: "PLACEHOLDER SINOPSIS. Kratki metar o njujorškoj sceni.",
        still: `${M23}/bella-539x303.jpg`,
        trailer: TRAILER,
        tags: ["jazz", "kratki"],
      },
      {
        id: "pet-izaosmeha",
        cat: "RD8-010",
        kind: "film",
        title: "Iza osmeha",
        start: "21:00",
        end: "21:30",
        duration: 32,
        year: 2024,
        country: "Crna Gora",
        director: "Placeholder Ime",
        synopsis:
          "PLACEHOLDER SINOPSIS. Domaći kratki dokumentarac, regionalna premijera.",
        still: `${M23}/nekadisasd-539x303.jpg`,
        trailer: TRAILER,
        tags: ["CG", "premijera"],
      },
      {
        id: "pet-koncert",
        cat: "RD8-011",
        kind: "koncert",
        title: "Kantautorski set",
        start: "21:30",
        end: "22:30",
        duration: 60,
        synopsis:
          "Akustično veče — izvođač se potvrđuje. Rezervisan termin u satnici.",
        still: `${M}/DAN5-539x303.jpg`,
        tags: ["live", "TBC"],
      },
    ],
  },
  {
    id: "sub",
    label: "Subota",
    date: "2026-12-12",
    dateLabel: "12. decembar",
    city: "Podgorica",
    venue: "201 engaging space",
    items: [
      {
        id: "sub-videodrom",
        cat: "RD8-012",
        kind: "videodrom",
        title: "Videodrom",
        start: "17:00",
        end: "18:00",
        duration: 60,
        synopsis: "Prošireni blok — sat vremena spotova, bez pauze.",
        still: `${M}/Anonymous-Club-539x303.jpg`,
        tags: ["spotovi"],
      },
      {
        id: "sub-tribina",
        cat: "RD8-013",
        kind: "tribina",
        title: "Tribina u dvorištu",
        start: "18:00",
        end: "19:00",
        duration: 60,
        synopsis:
          "Razgovor na otvorenom, prije nego što padne mrak i počnu projekcije.",
        still: `${M}/Koncert-za-mir-539x303.jpg`,
        tags: ["razgovor"],
      },
      {
        id: "sub-sara",
        cat: "RD8-014",
        kind: "koncert",
        title: "Sara Renar",
        start: "19:00",
        end: "21:00",
        duration: 120,
        country: "Hrvatska",
        synopsis: "Koncert — centralni muzički termin izdanja.",
        still: `${M}/One-su-tu-539x303.jpg`,
        tags: ["live"],
      },
      {
        id: "sub-sanjalice",
        cat: "RD8-015",
        kind: "film",
        title: "Sanjalice",
        start: "21:30",
        end: "22:40",
        duration: 69,
        year: 2023,
        country: "BiH",
        director: "Placeholder Ime",
        synopsis:
          "PLACEHOLDER SINOPSIS. Projekcija u suterenu — mali prostor, veliki zvuk.",
        still: `${M}/I-Am-What-I-Am-gipsy-mafia-539x303.jpg`,
        trailer: TRAILER,
        tags: ["suteren"],
      },
    ],
  },
  {
    id: "ned",
    label: "Nedjelja",
    date: "2026-12-13",
    dateLabel: "13. decembar",
    city: "Podgorica",
    venue: "201 engaging space",
    items: [
      {
        id: "ned-videodrom",
        cat: "RD8-016",
        kind: "videodrom",
        title: "Videodrom",
        start: "17:00",
        end: "17:30",
        duration: 30,
        synopsis: "Završni blok kratkih formi.",
        still: `${M23}/bitlvania-539x303.jpg`,
        tags: ["spotovi"],
      },
      {
        id: "ned-osmasila",
        cat: "RD8-017",
        kind: "film",
        title: "Osma sila",
        start: "17:30",
        end: "17:50",
        duration: 19,
        year: 2025,
        country: "Crna Gora",
        director: "Placeholder Ime",
        synopsis: "PLACEHOLDER SINOPSIS. Kratki metar, domaća produkcija.",
        still: `${M23}/kraljcacka-539x303.jpg`,
        trailer: TRAILER,
        tags: ["CG", "kratki"],
      },
      {
        id: "ned-trecisvijet",
        cat: "RD8-018",
        kind: "film",
        title: "Treći svijet",
        start: "17:50",
        end: "19:30",
        duration: 101,
        year: 2022,
        country: "Srbija",
        director: "Placeholder Ime",
        synopsis:
          "PLACEHOLDER SINOPSIS. Dugometražni portret scene koja je nastala bez ičije dozvole.",
        still: `${M}/Od-Golog-otoka-do-kralja-romske-muzike-539x303.jpg`,
        trailer: TRAILER,
        tags: ["ex-YU"],
      },
      {
        id: "ned-undergroundtop",
        cat: "RD8-019",
        kind: "film",
        title: "Underground top lista",
        start: "19:30",
        end: "20:40",
        duration: 70,
        year: 2023,
        country: "Sj. Makedonija",
        director: "Placeholder Ime",
        synopsis: "PLACEHOLDER SINOPSIS. Lista koja nikad nije bila zvanična.",
        still: `${M}/In-The-Court-of-Crimson-King-539x303.jpg`,
        trailer: TRAILER,
        tags: ["scena"],
      },
      {
        id: "ned-randominacija",
        cat: "RD8-020",
        kind: "film",
        title: "Randominacija",
        start: "20:40",
        end: "20:50",
        duration: 9,
        year: 2025,
        country: "Crna Gora",
        director: "Placeholder Ime",
        synopsis: "PLACEHOLDER SINOPSIS. Devet minuta, bez objašnjenja.",
        still: `${M23}/gifup-539x303.jpg`,
        trailer: TRAILER,
        tags: ["kratki"],
      },
      {
        id: "ned-koncert-ana",
        cat: "RD8-021",
        kind: "koncert",
        title: "Ana Paška",
        start: "21:00",
        end: "22:30",
        duration: 90,
        synopsis: "Zatvaranje izdanja — koncert.",
        still: `${M}/Hiccups-with-Little-Steven-Premotavanje-sa-Steven-Van-Zandtom-539x303.jpg`,
        tags: ["live", "zatvaranje"],
      },
    ],
  },
];

/** Naslovi koji čekaju slobodan termin — polica „Rezerve". */
export const reserves: ProgramItem[] = [
  {
    id: "rez-bajka",
    cat: "RD8-R01",
    kind: "rezerva",
    title: "Bajka bespovratnog vremena",
    duration: 120,
    year: 2021,
    country: "Srbija",
    director: "Placeholder Ime",
    synopsis: "PLACEHOLDER SINOPSIS. Naslov na čekanju — termin nije potvrđen.",
    still: `${M23}/svjetlajj-539x303.jpg`,
    trailer: TRAILER,
    tags: ["rezerva"],
  },
  {
    id: "rez-harley",
    cat: "RD8-R02",
    kind: "rezerva",
    title: "Harley Flanagan — Wired for Chaos",
    duration: 99,
    year: 2024,
    country: "SAD",
    director: "Placeholder Ime",
    synopsis: "PLACEHOLDER SINOPSIS. Naslov na čekanju — termin nije potvrđen.",
    still: `${M23}/lennon-539x303.jpg`,
    trailer: TRAILER,
    tags: ["rezerva", "hardcore"],
  },
];

/** Ravna lista — koristi je klijentska logika (članska karta, share-link). */
export const allItems: ProgramItem[] = [
  ...program.flatMap((d) => d.items),
  ...reserves,
];

export const kindLabel: Record<ProgramKind, string> = {
  film: "Film",
  videodrom: "Videodrom",
  koncert: "Koncert",
  tribina: "Tribina",
  rezerva: "Rezerva",
};
