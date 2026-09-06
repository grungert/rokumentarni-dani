// Program festivala — RD8, 17–20. septembar 2026, Kružni tok, Podgorica.
//
// Izvori: „RD8 program 3 septembar 2026" (satnica) i „FILMOVI PODACI I
// SINOPSIS" (zemlja, godina, trajanje, režija, sinopsis, trejler). Gdje su
// se dokumenti razišli, satnica daje termin a dokument sa filmovima daje
// trajanje: `start`/`end` je termin u sali, `duration` je stvarna dužina
// djela, pa je slot po pravilu nešto duži.
//
// Stillovi su kadrovi iz trejlera samog naslova, odnosno zvanične fotografije
// gdje trejlera nema. Jedini izuzetak je tribina „Zapisano mladošću", koja
// još nosi posuđen kadar iz arhive — nema svoj materijal.
// Stranica, polica, omot i članska karta čitaju isključivo odavde.

export type ProgramKind =
  | "film" // dokumentarac u glavnom programu
  | "videodrom" // blok kratkih formi / spotova
  | "koncert"
  | "tribina"; // razgovor, promocija, panel

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
  start?: string;
  end?: string;
  /**
   * Minuti — stvarna dužina djela, ne dužina termina. Jedini izvor istine
   * za trajanje i detekciju preklapanja.
   */
  duration: number;
  year?: number;
  country?: string;
  director?: string;
  synopsis: string;
  /** Still 539×303 iz arhive — privremeno. */
  still: string;
  /**
   * Programska napomena uz termin — ono što se iz satnice ne može pročitati.
   * Bez nje termin duži od djela izgleda kao greška u rasporedu.
   */
  note?: string;
  /**
   * `still` je plakat, ne kadar iz filma. Plakat je uspravan i nosi tekst,
   * pa se prikazuje cijeli i u boji — a ne isječen na 16:9 i obezbojen,
   * kako se prikazuju kadrovi.
   */
  stillIsPoster?: boolean;
  trailer?: Trailer;
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

/** Jedini preostali posuđeni kadar — tribina „Zapisano mladošću". */
const M = "/media/2022/12";

/** Isti prostor sva četiri dana. */
const CITY = "Podgorica";
const VENUE = "Kružni tok";

/** Trejler sa YouTubea — učitava se tek na klik. */
const yt = (id: string): Trailer => ({ type: "youtube", src: id });

/**
 * Videodrom je isti format sva četiri dana, pa i isti opis — stoji na
 * jednom mjestu da se ne raziđe po danima. Razlikuju se samo termin,
 * trajanje i izvedba koja je te večeri na kartici.
 */
const VIDEODROM =
  "Spotovi crnogorskih bendova, uključujući Live Sessions izvedbe iz sopstvene produkcije Rokumentarnih dana. Zagrijavanje za svaki festivalski dan, dok se sala puni.";

export const program: ProgramDay[] = [
  {
    id: "cet",
    label: "Četvrtak",
    date: "2026-09-17",
    dateLabel: "17. septembar",
    city: CITY,
    venue: VENUE,
    items: [
      {
        id: "cet-videodrom",
        cat: "RD8-001",
        kind: "videodrom",
        title: "Videodrom",
        start: "17:00",
        end: "18:00",
        duration: 60,
        synopsis: VIDEODROM,
        still: "/media/2026/09/ls-anja-zagorac.jpg",
        trailer: yt("tJ4dnWwYHYo"),
      },
      {
        id: "ned-izaosmeha",
        cat: "RD8-002",
        kind: "film",
        title: "Iza osmeha",
        start: "18:00",
        end: "18:35",
        duration: 32,
        year: 2025,
        country: "Srbija",
        director: "Marko Đorđević",
        synopsis:
          "Deset godina nakon smrti Vlade Divljana porodica otvara kutije sa njegovim stvarima. Između ostalog pronalaze snimke načinjene malom kamerom. Vladini snimci porodičnog života, kao i pravljenja muzike u svojoj sobi ili sa bendom, uz domaštane animirane avanture na pustom ostrvu, vode nas duboko u intimni svijet našeg poznatog muzičara.",
        still: "/media/2026/09/film-iza-osmeha.jpg",
        trailer: yt("pr2K1HOt_2I"),
      },
      {
        id: "cet-praslovan",
        cat: "RD8-003",
        kind: "film",
        title: "Praslovan",
        start: "19:00",
        end: "21:00",
        duration: 115,
        year: 2024,
        country: "Slovenija / Hrvatska",
        director: "Slobodan Maksimović",
        synopsis:
          "Emotivni i inspirativni biografski film koji prati život i karijeru jednog od najznačajnijih kantautora — Zorana Predina. Otkriva njegov put od mladosti u Mariboru do vrhunca slave sa bendom Lačni Franz i solo karijere koja ga je učinila ikonom muzičke scene. Kroz retrospektivu najvećih hitova film pokazuje kako su njegove pjesme odražavale društvene promjene i lične preokrete. Kroz priču nas vode Đorđe Balašević, Branko Đurić, Miljenko Jergović, Gabi Novak, Jure Franko, Magnifico, Ante Tomić i drugi.",
        still: "/media/2026/09/film-praslovan.jpg",
        trailer: yt("k1qdmmzkwPs"),
      },
      {
        id: "cet-koncert-janjo",
        cat: "RD8-004",
        kind: "koncert",
        title: "Janjo & Yataguns",
        start: "21:30",
        end: "22:30",
        duration: 60,
        country: "Crna Gora",
        synopsis:
          "Marko Janjušević — Janjo — osnivač je i frontmen nikšićkog Manitoua, a nastupa i kao Pas Manit. Slikar po obrazovanju, izašao iz stripa, grafita i uličnog crteža, drži tetovažni studio u Nikšiću i potpisuje vizuelni jezik svojih izdanja jednako koliko i muzički. Festival otvara sa sastavom Yataguns.",
        still: "/media/2026/09/janjo.jpg",
        stillIsPoster: true,
        trailer: yt("kCABrMxONDU"),
      },
    ],
  },
  {
    id: "pet",
    label: "Petak",
    date: "2026-09-18",
    dateLabel: "18. septembar",
    city: CITY,
    venue: VENUE,
    items: [
      {
        id: "pet-videodrom",
        cat: "RD8-005",
        kind: "videodrom",
        title: "Videodrom",
        start: "17:00",
        end: "18:00",
        duration: 60,
        synopsis: VIDEODROM,
        still: "/media/2026/09/ls-bacili-bellerophontes.jpg",
        trailer: yt("amoqTYC3TQ8"),
      },
      {
        id: "pet-vlajternativa",
        cat: "RD8-006",
        kind: "film",
        title: "Vlajternativa itd.",
        start: "18:00",
        end: "19:05",
        duration: 62,
        year: 2022,
        country: "Hrvatska",
        director: "Ante Storić",
        synopsis:
          "Dugometražni dokumentarni film o najvećem i najhumanijem festivalu alternativne muzike na Balkanu — Vlajternativi u Benkovcu. Autorski rad multimedijalnog obrtnika, repera, pisca, snimatelja i reditelja Ante Storića iz Šibenika. U filmu se pojavljuje preko 50 govornika i govornica koji svako na svoj način pred kamerom pričaju utiske i iskustva sa doživljene, preživljene ili odsvirane Vlajternative.",
        still: "/media/2026/09/film-vlajternativa.jpg",
      },
      {
        id: "pet-prica-mucin",
        cat: "RD8-007",
        kind: "tribina",
        title: "Priča sa Mučinom",
        start: "19:05",
        end: "19:35",
        duration: 30,
        synopsis:
          "Razgovor o albumu, promociji vinila, bookingu i koncertima — kako se danas izvlači tura kroz region bez etikete iza sebe.",
        still: "/media/2026/09/mucin.jpg",
      },
      {
        id: "pet-uimeoca",
        cat: "RD8-008",
        kind: "film",
        title: "U ime oca Petra",
        start: "19:45",
        end: "20:45",
        duration: 52,
        year: 2022,
        country: "Hrvatska",
        director: "Ines Pletikos",
        synopsis:
          "Franci Blašković kultna je figura istarske kulturne i društvene scene: frontmen benda Gori ussi Winnetou, kantautor i ekološki aktivista, predsjednik „Lige za boj protiv turizma\". Njegova kći Petra Blašković, glumica, otkriva kako je bilo odrastati uz harizmatičnog oca i majku Arinku Blašković Šegando, muzičarku i muzičku pedagoškinju.",
        still: "/media/2026/09/film-u-ime-oca-petra.jpg",
      },
      {
        id: "pet-koncert-mucin",
        cat: "RD8-009",
        kind: "koncert",
        title: "Mučin",
        start: "21:30",
        end: "22:30",
        duration: 60,
        country: "Crna Gora",
        synopsis:
          "Podgorički trojac — Nemanja Grbović (gitara, vokal), Veljko Vučurović (bas, vokal) i Đorđije Njunjić (bubnjevi) — svira Oi! punk sa post-punk i coldwave rubovima. Prva dva digitalna EP-a sabrali su na ploču za zagrebački Geenger Records, a „Moj grob\" snimili na tekst Ivana Gorana Kovačića. Sviraju uveče, poslije razgovora o ploči i turnejama.",
        still: "/media/2026/09/mucin.jpg",
        trailer: yt("0wVknUT_gXw"),
      },
    ],
  },
  {
    id: "sub",
    label: "Subota",
    date: "2026-09-19",
    dateLabel: "19. septembar",
    city: CITY,
    venue: VENUE,
    items: [
      {
        id: "sub-videodrom",
        cat: "RD8-010",
        kind: "videodrom",
        title: "Videodrom",
        start: "17:00",
        end: "18:00",
        duration: 60,
        synopsis: VIDEODROM,
        still: "/media/2026/09/ls-yonic.jpg",
        trailer: yt("LGOcJXbpOrg"),
      },
      {
        id: "sub-randominacija",
        cat: "RD8-011",
        kind: "film",
        title: "Randominacija",
        start: "18:00",
        end: "18:10",
        duration: 9,
        year: 2026,
        country: "Crna Gora",
        director: "Emilijan Dimitrijević",
        synopsis:
          "Kratki dokumentarni film o Marku Lubardi, poznatijem kao Random. Kroz razgovor, arhivske snimke i fragmente sa nastupa, film prati njegov odnos prema muzici, novcu, pritisku i ličnim izborima koje pravi van reflektora. Realizovan kao studentski projekat, sa fokusom na autentičnost, minimalizam i dokumentarni pristup.",
        still: "/media/2026/09/film-randominacija.jpg",
        trailer: yt("zaW9TVkOBcU"),
      },
      {
        id: "sub-osmasila",
        cat: "RD8-012",
        kind: "film",
        title: "Osma sila – S felerom rođeni",
        start: "18:10",
        end: "18:30",
        duration: 18,
        year: 2024,
        country: "Crna Gora",
        director: "Sead Šabotić",
        synopsis:
          "Kratki dokumentarni film donosi priču o kultnom nikšićkom rok bendu Osma sila — o njegovom nastanku, značaju na muzičkoj sceni osamdesetih, dugoj pauzi i ponovnom okupljanju uz objavljivanje davno snimljenog albuma. Kroz priče članova benda, arhivske snimke i fotografije, film govori o muzici, mladosti, prijateljstvu i potrebi da se konačno dovrši ono što je nekada ostalo nedovršeno.",
        still: "/media/2026/09/film-osma-sila.jpg",
        trailer: yt("6o-QeeMlvGE"),
      },
      {
        id: "sub-madeinny",
        cat: "RD8-013",
        kind: "film",
        title: "Made in NY Jazz fest",
        start: "18:40",
        end: "19:10",
        duration: 27,
        year: 2025,
        country: "Crna Gora",
        synopsis:
          "Zavirite iza kulisa Made in New York Jazz Festivala Montenegro i otkrijte šta je sve potrebno da bi džez svjetske klase zaživio na sceni. Od pripreme bine, produkcije i organizacije do trenutaka koje su dijelili umjetnici, ekipa i publika — zapis bilježi energiju, strast i posvećenost iza jednog od najuzbudljivijih džez događaja godine.",
        still: "/media/2026/09/film-made-in-ny-jazz.jpg",
      },
      {
        id: "cet-grandpa",
        cat: "RD8-014",
        kind: "film",
        title: "Grandpa Guru",
        start: "19:15",
        end: "20:45",
        duration: 91,
        year: 2024,
        country: "Bosna i Hercegovina / Hrvatska",
        director: "Silvio Mirošničenko",
        synopsis:
          "Portretni dokumentarac koji eklektičnim stilom prikazuje kontinuitet rada benda Kultur Shock, s posebnim naglaskom na život, muziku i umjetnost njihovog frontmena Srđana Gine Jevđevića. Pratimo Ginovo duhovno putovanje u potrazi za vlastitim identitetom, nakon izlaska iz sarajevskog ratnog okruženja i dolaska u Seattle, gdje ga Krist Novoselic iz Nirvane i Jello Biafra iz Dead Kennedysa podstiču da nastavi da se bavi muzikom. Gina progoni pitanje pripadnosti i osjećaj rastrganosti između Amerike, Sarajeva i majke za koju je izuzetno vezan.",
        still: "/media/2026/09/film-grandpa-guru.jpg",
        trailer: yt("D3q2Sa29Q1s"),
      },
      {
        id: "sub-koncert-shortreports",
        cat: "RD8-015",
        kind: "koncert",
        title: "Short Reports",
        start: "21:30",
        end: "22:30",
        duration: 60,
        country: "Srbija",
        synopsis:
          "Indi-rok duo iz Novog Sada, osnovan 2019: Nikoleta Feher na bubnjevima i Nemanja Velimirović na gitari i vokalu, koji je prije toga pet godina svirao u beogradskom E-Playu. Iza njih su albumi „Cats VS Dogs\" i „Vožnja\", singlovi „Connection\" i „Mathilda\", i preko sto dvadeset odsviranih koncerata.",
        still: "/media/2026/09/short-reports.jpg",
        trailer: yt("zsQFIp9T08w"),
      },
    ],
  },
  {
    id: "ned",
    label: "Nedjelja",
    date: "2026-09-20",
    dateLabel: "20. septembar",
    city: CITY,
    venue: VENUE,
    items: [
      {
        id: "ned-videodrom",
        cat: "RD8-016",
        kind: "videodrom",
        title: "Videodrom",
        start: "16:30",
        end: "17:00",
        duration: 30,
        synopsis: VIDEODROM,
        still: "/media/2026/09/ls-autogeni-trening.jpg",
        trailer: yt("Y1K-84ZZqj4"),
      },
      {
        id: "ned-tribina",
        cat: "RD8-017",
        kind: "tribina",
        title: "Zapisano mladošću",
        start: "17:00",
        end: "17:45",
        duration: 45,
        synopsis:
          "Tribina u dvorištu, za vrijeme trajanja sajma — razgovor prije nego što počnu posljednje projekcije izdanja.",
        still: `${M}/One-su-tu-539x303.jpg`,
      },
      {
        id: "sub-funkyu",
        cat: "RD8-018",
        kind: "film",
        title: "Funk Yu",
        start: "18:00",
        end: "19:20",
        duration: 81,
        year: 2024,
        country: "Hrvatska / Crna Gora",
        director: "Franko Dujmić",
        synopsis:
          "Franko, kolekcionar vinila, zaputi se na avanturu kroz bivšu Jugoslaviju kako bi pronašao jedini vinilni zapis koji nedostaje njegovoj kolekciji — singl „Ulica Jorgovana / Zlatokosa\", jedan od najboljih primjera jugoslovenskog funka. Na putu susreće raznolike likove koje intervjuiše kako bi dobio uvid u maniju pretraživanja kutija s vinilima.",
        still: "/media/2026/09/film-funk-yu.jpg",
        trailer: yt("JD8uYDP0FUw"),
      },
      {
        id: "ned-sanjalice",
        cat: "RD8-019",
        kind: "film",
        title: "Sanjalice",
        start: "19:30",
        end: "20:40",
        duration: 69,
        year: 2024,
        country: "Srbija / Makedonija",
        director: "Vladimir Petrović",
        synopsis:
          "Jedan od prvih ženskih rok bendova na svijetu osnovan je šezdesetih godina u Beogradu. Tinejdžerke Doda, dvije Ljilje i Nena nastupale su kao VIS Sanjalice. Uprkos složenim okolnostima i predrasudama „čuvara javnog morala\", koji su ih optuživali za širenje buntovničkog duha, osvojile su muzičku scenu rame uz rame s muškim bendovima. Postale su zvijezde, a zatim iznenada odlučile da se raziđu. Ovo je njihova strana priče.",
        still: "/media/2026/09/film-sanjalice.jpg",
        trailer: yt("ZnWFd0ebxFE"),
      },
      {
        id: "ned-koncert-sara",
        cat: "RD8-020",
        kind: "koncert",
        title: "Sara Renar",
        start: "21:00",
        end: "23:00",
        duration: 120,
        country: "Hrvatska",
        synopsis:
          "Zagrebačka kantautorica i izvedbena umjetnica, arhitektica po struci koja je 2015. ostavila posao u struci i posvetila se muzici. Od „Djece\" (2013) do „Nježnih riječi\" (2025) njen izraz ide od akustičnog kantautorstva ka spoju eksperimenta, indieja i elektronike. Za „Jesen\" je 2015. dobila Porina za najbolju žensku vokalnu izvedbu. Zatvara osmo izdanje.",
        still: "/media/2026/09/sara-renar.jpg",
        trailer: yt("9IS_swKigGc"),
      },
    ],
  },
];

/** Ravna lista — koristi je klijentska logika (članska karta, share-link). */
export const allItems: ProgramItem[] = program.flatMap((d) => d.items);

/**
 * Šta dugme za pusti zaista pušta. Nije svuda trejler: koncerti nose spot
 * izvođača, a Videodrom snimak iz sopstvene produkcije — obećati „trejler"
 * nad jednim ili drugim znači slagati posjetioca.
 */
export const videoLabel: Record<ProgramKind, string> = {
  film: "Trejler",
  koncert: "Spot",
  videodrom: "Live Session",
  tribina: "Snimak",
};

export const kindLabel: Record<ProgramKind, string> = {
  film: "Film",
  videodrom: "Videodrom",
  koncert: "Koncert",
  tribina: "Tribina",
};
