// GENERISANO iz stare WP baze skriptom scripts/extract_archive.py.
//
// Od ovog trenutka fajl se održava RUKOM. Skripta je čitala Visual Composer
// HTML pisan kroz sedam godina u tri različita obrasca i nije mogla sve da
// pogodi — ispravke koje ovdje unesemo su tačnije od svakog ponovnog
// parsiranja. Ako se skripta ikad pusti opet, piše pored, u *.generated.ts.

import type { ArchiveDay } from './types';

export const archiveProgram: ArchiveDay[] = [
  {
    edition: 1,
    label: "26. MAJ - PETAK",
    weekday: "petak",
    venue: "Blues bar",
    items: [
      {
        start: "17:00",
        end: "18:00",
        title: "koncert MP Trio",
        kind: "koncert",
      },
      {
        start: "18:00",
        end: "19:00",
        title: "otvaranje festivala",
        kind: "tribina",
      },
      {
        start: "19:15",
        end: "20:05",
        title: "Viljuška puna ljubavi",
        kind: "film",
      },
      {
        start: "20:10",
        end: "21:50",
        title: "CG arhiva",
        kind: "film",
      },
      {
        start: "21:50",
        end: "22:15",
        title: "Manitua mi!",
        kind: "film",
      },
      {
        start: "22:30",
        end: "01:00",
        title: "KONCERT: Multietnička atrakcija",
        kind: "koncert",
      },
    ],
  },
  {
    edition: 1,
    label: "27. MAJ - SUBOTA",
    weekday: "subota",
    venue: "JU Zahumlje",
    items: [
      {
        start: "16:00",
        end: "17:00",
        title: "Mi plačemo iza tamnih naočara",
        kind: "film",
      },
      {
        start: "17:05",
        end: "17:25",
        title: "Mizar",
        kind: "film",
      },
      {
        start: "17:30",
        end: "18:50",
        title: "Maske",
        kind: "film",
      },
      {
        start: "19:00",
        end: "20:10",
        title: "Limunovo drvo",
        kind: "film",
      },
      {
        start: "20:20",
        end: "21:00",
        title: "TRIBINA: Dokumentarni film i muzika",
        kind: "tribina",
      },
      {
        start: "21:15",
        end: "22:25",
        title: "Jadranka",
        kind: "film",
      },
    ],
  },
  {
    edition: 1,
    label: "28. MAJ - NEDJELJA",
    weekday: "nedjelja",
    venue: "JU Zahumlje & Blues bar",
    items: [
      {
        start: "13:00",
        end: "13:15",
        title: "Tranzistor",
        kind: "film",
      },
      {
        start: "13:20",
        end: "13:35",
        title: "Zvuk lampaša",
        kind: "film",
      },
      {
        start: "13:45",
        end: "14:45",
        title: "Strip",
        kind: "film",
      },
      {
        start: "15:00",
        end: "16:00",
        title: "TRIBINA: O stripu i ilustraciji",
        kind: "tribina",
      },
      {
        start: "16:00",
        end: "20:00",
        title: "BAZAR MUZIKE",
        kind: "film",
      },
      {
        start: "18:00",
        end: "19:20",
        title: "Sanjao sam o Smirnnoff Buffalu",
        kind: "film",
      },
      {
        start: "19:30",
        end: "20:40",
        title: "No Smokin in Sarajevo",
        kind: "film",
      },
      {
        start: "20:50",
        end: "22:25",
        title: "Mi smo kao ti",
        kind: "film",
      },
      {
        start: "22:00",
        end: "00:00",
        title: "KONCERT: M.O.R.T",
        kind: "koncert",
      },
    ],
  },
  {
    edition: 2,
    label: "08. JUN - PETAK",
    weekday: "petak",
    venue: "Blues bar",
    items: [
      {
        start: "18:00",
        end: "18:10",
        title: "Otvaranje festivala",
        kind: "tribina",
      },
      {
        start: "18:10",
        end: "18:30",
        title: "Work in progress (koncertni film o Nikoli Vranjkoviću rad Miloša Macanovića i koncertni film o Bjesovima rad Miloša Macanovića i Zorana Marinkovića)",
        kind: "koncert",
      },
      {
        start: "18:30",
        end: "19:50",
        title: "Priča o Evi Braun (SRB)",
        kind: "film",
      },
      {
        start: "20:00",
        end: "20:30",
        title: "Trenje (SRB)",
        kind: "film",
      },
      {
        start: "20:30",
        end: "21:10",
        title: "FILM iz produkcije Rokumentarnih dana o grupama Parampaščad i Bubnjivi",
        kind: "film",
      },
      {
        start: "22:00",
        end: "24:00",
        title: "KONCERT: Parampaščad i Bubnjivi",
        kind: "koncert",
      },
    ],
  },
  {
    edition: 2,
    label: "09. JUN - SUBOTA",
    weekday: "subota",
    venue: "Gradska kuća",
    items: [
      {
        start: "17:00",
        end: "17:30",
        title: "Film Dečak iz vode (SRB)",
        kind: "film",
      },
      {
        start: "17:30",
        end: "18:50",
        title: "CHARLATAN MAGNIFIQUE (SLO)",
        kind: "film",
      },
      {
        start: "19:00",
        end: "20:00",
        title: "LP BULDOŽER - PLJUNI ISTINI U OČI (SLO)",
        kind: "film",
      },
      {
        start: "20:00",
        end: "21:00",
        title: "TRIBINA MUZIKA NA FILMU - Igor Bašin (SLO), Zoran Marković (CG)",
        kind: "tribina",
      },
      {
        start: "22:00",
        end: "01:00",
        title: "After u Blues baru – DJ",
        kind: "dj",
      },
    ],
  },
  {
    edition: 2,
    label: "10. JUN- NEDJELJA",
    weekday: "nedjelja",
    venue: "JU Zahumlje",
    items: [
      {
        start: "13:00",
        end: "18:00",
        title: "BAZAR MUZIKE",
        kind: "film",
      },
      {
        start: "15:00",
        end: "17:00",
        title: "umjetničke radionice za mlade",
        kind: "film",
      },
      {
        start: "17:00",
        end: "18:00",
        title: "FILM Rock je kamp (BiH)",
        kind: "film",
      },
      {
        start: "18:00",
        end: "19:10",
        title: "DUBIOZA KOLEKTIV – film za djecu i odrasle (BiH)",
        kind: "film",
      },
      {
        start: "19:15",
        end: "22:15",
        title: "Kontakt - film o novosadskoj alternativnoj sceni(SRB)",
        kind: "film",
      },
      {
        start: "22:00",
        end: "01:00",
        title: "After u Blues baru - veče gitare na gotovs",
        kind: "film",
      },
    ],
  },
  {
    edition: 2,
    label: "11. JUN- PONEDELJAK",
    weekday: "ponedjeljak",
    venue: "Blues bar",
    items: [
      {
        start: "17:00",
        end: "18:00",
        title: "Video spotovi crnogorskih autora novije produkcije i snimci iz arhiva",
        kind: "film",
      },
      {
        start: "18:00",
        end: "19:00",
        title: "Razgovor sa domaćim režiserima o muzici i video produkciji",
        kind: "tribina",
      },
      {
        start: "19:00",
        end: "20:00",
        title: "FILM – Cijeli svijet u jednoj dolini",
        kind: "film",
      },
      {
        start: "22:00",
        end: "01:00",
        title: "After u Blues Baru - Hippie party",
        kind: "film",
      },
    ],
  },
  {
    edition: 4,
    label: "23. OKTOBAR - PETAK",
    weekday: "petak",
    venue: "CKZ Ribnica, Podgorica",
    items: [
      {
        start: "17:00",
        end: "17:15",
        title: "Vrpca @ Stivi",
        kind: "film",
      },
      {
        start: "17:15",
        end: "17:30",
        title: "Praia do ventu Eternu",
        kind: "film",
      },
      {
        start: "17:30",
        end: "19:00",
        title: "Izgubljeno dugme",
        kind: "film",
      },
      {
        start: "19:00",
        end: "20:00",
        title: "Cavern Club (Beat Goes On)",
        kind: "film",
      },
      {
        start: "20:15",
        end: "20:45",
        title: "Tribina",
        kind: "tribina",
      },
      {
        start: "20:45",
        end: "22:00",
        title: "DJ SET",
        kind: "dj",
      },
    ],
  },
  {
    edition: 4,
    label: "24. OKTOBAR - SUBOTA",
    weekday: "subota",
    venue: "CKZ Ribnica, Podgorica",
    items: [
      {
        start: "16:30",
        end: "17:45",
        title: "It’s A Rockabilly World",
        kind: "film",
      },
      {
        start: "17:45",
        end: "19:30",
        title: "Rokumentarni dani Live sessions",
        kind: "film",
      },
      {
        start: "19:30",
        end: "20:30",
        title: "Viktorija 15",
        kind: "film",
      },
      {
        start: "20:30",
        end: "21:00",
        title: "Videoteka Mladena Ivanovića",
        kind: "film",
      },
      {
        start: "21:00",
        end: "22:00",
        title: "DJ SET",
        kind: "dj",
      },
    ],
  },
  {
    edition: 4,
    label: "25. OKTOBAR - NEDELJA",
    weekday: "nedjelja",
    venue: "Blues Brothers Bar, Nikšić",
    items: [
      {
        start: "16:00",
        end: "16:05",
        title: "Otvaranje",
        kind: "tribina",
      },
      {
        start: "16:05",
        end: "16:30",
        title: "Repetitor",
        kind: "film",
      },
      {
        start: "16:30",
        end: "18:10",
        title: "Rokumentarni dani Live Sessions",
        kind: "film",
      },
      {
        start: "18:10",
        end: "20:00",
        title: "Chuck",
        kind: "film",
      },
      {
        start: "20:00",
        end: "22:00",
        title: "Koncert",
        kind: "koncert",
      },
    ],
  },
  {
    edition: 4,
    label: "26. OKTOBAR - PONEDELJAK",
    weekday: "ponedjeljak",
    venue: "Blues Brothers Bar, Nikšić",
    items: [
      {
        start: "17:00",
        end: "18:50",
        title: "Tusta",
        kind: "film",
      },
      {
        start: "18:50",
        end: "19:00",
        title: "Praia do ventu Eternu",
        kind: "film",
      },
      {
        start: "19:00",
        end: "20:00",
        title: "Bure Bareta",
        kind: "film",
      },
      {
        start: "20:00",
        end: "20:30",
        title: "Tribina zatvaranje",
        kind: "tribina",
      },
      {
        start: "20:30",
        end: "22:00",
        title: "Open Guitar Night",
        kind: "film",
      },
    ],
  },
  {
    edition: 4,
    label: "27. OKTOBAR - UTORAK",
    weekday: "utorak",
    venue: "Dom Kulture, Mojkovac",
    items: [
      {
        start: "18:00",
        end: "18:30",
        title: "Rokumentarni dani Live Sessions",
        kind: "film",
      },
      {
        start: "18:30",
        end: "19:45",
        title: "It’s A Rockabilly World",
        kind: "film",
      },
      {
        start: "19:45",
        end: "20:00",
        title: "Vrpca @ Stivi",
        kind: "film",
      },
      {
        start: "20:00",
        end: "21:00",
        title: "Viktorija 15",
        kind: "film",
      },
    ],
  },
  {
    edition: 5,
    label: "29. NOVEMBAR - PONEDELJAK",
    weekday: "ponedjeljak",
    venue: "CKZ Ribnica, Podgorica",
    items: [
      {
        start: "17:00",
        end: "20:00",
        title: "Berza vinila u saradnji sa NVO Montenegro Records",
        kind: "film",
      },
      {
        start: "18:00",
        end: "19:00",
        title: "Buč Kesidi, Euforija uživo",
        kind: "film",
      },
      {
        start: "19:10",
        end: "21:00",
        title: "A Symphony of Noise",
        kind: "film",
      },
      {
        start: "21:10",
        end: "21:45",
        title: "Crna Gora u stripu",
        kind: "film",
      },
      {
        start: "21:45",
        end: "23:10",
        title: "FAITH I BRANKO",
        kind: "film",
      },
      {
        start: "23:10",
        end: "00:00",
        title: "DJ set",
        kind: "dj",
      },
    ],
  },
  {
    edition: 5,
    label: "30. NOVEMBAR - UTORAK",
    weekday: "utorak",
    venue: "CKZ Ribnica, Podgorica",
    items: [
      {
        start: "17:00",
        end: "20:00",
        title: "Berza vinila u saradnji sa NVO Montenegro Records",
        kind: "film",
      },
      {
        start: "18:00",
        end: "19:30",
        title: "Rock'n'Roll",
        kind: "film",
      },
      {
        start: "19:30",
        end: "20:00",
        title: "FUS - Dobri duh Nikšića",
        kind: "film",
      },
      {
        start: "20:00",
        end: "20:30",
        title: "Premotavanje Live",
        kind: "film",
      },
      {
        start: "20:30",
        end: "21:50",
        title: "Soviet Hippies",
        kind: "film",
      },
      {
        start: "22:00",
        end: "23:30",
        title: "Here We Move, Here We Groove",
        kind: "film",
      },
    ],
  },
  {
    edition: 5,
    label: "02. DECEMBAR - ČETVRTAK",
    weekday: "četvrtak",
    venue: "JU Zahumlje, Nikšić",
    items: [
      {
        start: "18:00",
        end: "19:00",
        title: "Daleka obala u USA",
        kind: "film",
      },
      {
        start: "19:10",
        end: "20:40",
        title: "Rock'n'roll",
        kind: "film",
      },
      {
        start: "20:45",
        end: "21:15",
        title: "FUS - Dobri duh Nikšića",
        kind: "film",
      },
      {
        start: "21:20",
        end: "22:20",
        title: "Električni Orgazam za ljude budućnosti",
        kind: "film",
      },
      {
        start: "22:30",
        end: "23:00",
        title: "xYUGOx",
        kind: "film",
      },
    ],
  },
  {
    edition: 5,
    label: "03. DECEMBAR - PETAK",
    weekday: "petak",
    venue: "JU Zahumlje, Nikšić",
    items: [
      {
        start: "18:00",
        end: "19:00",
        title: "Buč Kesidi, Euforija uživo",
        kind: "film",
      },
      {
        start: "19:00",
        end: "20:30",
        title: "NS Made: Love Hunters",
        kind: "film",
      },
      {
        start: "20:30",
        end: "21:45",
        title: "Soviet Hippies",
        kind: "film",
      },
      {
        start: "21:45",
        end: "23:20",
        title: "Scream for me Sarajevo",
        kind: "film",
      },
    ],
  },
  {
    edition: 6,
    label: "09.12. - PETAK",
    weekday: "petak",
    venue: "201 engaging space, Podgorica",
    items: [
      {
        start: "17:00",
        title: "Anonymous Club",
        kind: "film",
      },
      {
        start: "18:30",
        title: "Uskrs grad i rokenrol",
        kind: "film",
      },
      {
        start: "19:00",
        title: "Predstavljanje Dok N Ritam festivala",
        kind: "film",
      },
      {
        start: "19:30",
        title: "(tribina Ženski glasovi u umjetnosti)",
        kind: "tribina",
      },
      {
        start: "20:30",
        title: "Underplayed",
        kind: "film",
      },
      {
        start: "22:00",
        title: "One su tu",
        kind: "film",
      },
    ],
  },
  {
    edition: 6,
    label: "10.12. - SUBOTA",
    weekday: "subota",
    venue: "201 engaging space, Podgorica",
    items: [
      {
        start: "17:00",
        title: "Koncert za mir",
        kind: "koncert",
      },
      {
        start: "17:30",
        title: "Borderland Soundtrack",
        kind: "film",
      },
      {
        start: "19:30",
        title: "(tribina antiratni glasovi, i razgovor sa autorkom filma Borderland Soundtrack)",
        kind: "tribina",
      },
      {
        start: "20:30",
        title: "In The Court of Crimson King",
        kind: "film",
      },
      {
        start: "22:00",
        title: "Premotavanje sa Steven Van Zandtom",
        kind: "film",
      },
    ],
  },
  {
    edition: 6,
    label: "16.12 - PETAK",
    weekday: "petak",
    venue: "Blues Brothers Bar, Nikšić",
    items: [
      {
        title: "Rudeboy",
        kind: "film",
      },
      {
        title: "Od golog otoka do kralja romske muzike",
        kind: "film",
      },
      {
        title: "I Am What I Am",
        kind: "film",
      },
      {
        title: "(tribina - Glasovi manjine)",
        kind: "tribina",
      },
      {
        title: "Other Music",
        kind: "film",
      },
    ],
  },
  {
    edition: 6,
    label: "17.12. - SUBOTA",
    weekday: "subota",
    venue: "Centar za kulturu, Mojkovac",
    items: [
      {
        title: "One su tu",
        kind: "film",
      },
      {
        title: "Od golog otoka do kralja romske muzike",
        kind: "film",
      },
      {
        title: "Koncert za mir",
        kind: "koncert",
      },
      {
        title: "Rudeboy",
        kind: "film",
      },
    ],
  },
  {
    edition: 6,
    label: "TBA - SUBOTA",
    weekday: "subota",
    venue: "TBA, Kotor",
    items: [
      {
        title: "One su tu",
        kind: "film",
      },
      {
        title: "Borderland Soundtrack",
        kind: "film",
      },
      {
        title: "I Am What I Am",
        kind: "film",
      },
    ],
  },
  {
    edition: 7,
    label: "10.11. - PETAK",
    weekday: "petak",
    venue: "Blues Brothers Bar, Nikšić",
    items: [
      {
        start: "18:00",
        title: "Videodrom",
        kind: "videodrom",
      },
      {
        start: "18:30",
        title: "Nekad i sad (CG)",
        kind: "film",
      },
      {
        start: "19:00",
        title: "Brain Holidays - Bites of Paradise",
        kind: "film",
      },
      {
        start: "19:45",
        title: "Svjetla Sarajeva",
        kind: "film",
      },
      {
        start: "21:00",
        title: "Dj Set",
        kind: "dj",
      },
    ],
  },
  {
    edition: 7,
    label: "11.11. - SUBOTA",
    weekday: "subota",
    venue: "Blues Brothers Bar, Nikšić",
    items: [
      {
        start: "18:00",
        title: "Videodrom",
        kind: "videodrom",
      },
      {
        start: "18:30",
        title: "Sonny Boy iz Stubičke Slatine",
        kind: "film",
      },
      {
        start: "19:00",
        title: "Gif Up!",
        kind: "film",
      },
      {
        start: "19:30",
        title: "O Bella Ciao",
        kind: "film",
      },
      {
        start: "21:00",
        title: "Don't Give Up, Gif Up!",
        kind: "film",
      },
    ],
  },
  {
    edition: 7,
    label: "18.11. - SUBOTA",
    weekday: "subota",
    venue: "201 engaging space, Podgorica",
    items: [
      {
        start: "19:00",
        title: "I Am Everything",
        kind: "film",
      },
      {
        start: "20:45",
        title: "New York Hodočašće",
        kind: "film",
      },
      {
        start: "21:30",
        title: "Ovo nije moj dom",
        kind: "film",
      },
      {
        start: "23:00",
        title: "Don’t Give up, Gif Up!",
        kind: "film",
      },
    ],
  },
  {
    edition: 7,
    label: "19.11. - NEDELJA",
    weekday: "nedjelja",
    venue: "201 engaging space, Podgorica",
    items: [
      {
        start: "19:00",
        title: "Videodrom",
        kind: "videodrom",
      },
      {
        start: "19:30",
        title: "Nekad i sad",
        kind: "film",
      },
      {
        start: "20:00",
        title: "Bitlvania",
        kind: "film",
      },
      {
        start: "21:45",
        title: "O Bella Ciao",
        kind: "film",
      },
    ],
  },
];
