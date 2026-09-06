// Izdanja Rokumentarnih dana — pisano rukom, nije generisano.
//
// Datumi i prostori su iz programskih stranica stare baze i objava iz tog
// vremena. Slogan ima samo RD6 — jedino izdanje koje je imenovan slogan
// zaista i objavilo; ostalima se ne izmišlja.
import type { Edition } from "./types";

export const editions: Edition[] = [
  {
    n: 1,
    year: 2017,
    slug: "2017",
    title: "Rokumentarni dani 1",
    dates: "26–28. maj 2017",
    cities: ["Nikšić"],
  },
  {
    n: 2,
    year: 2018,
    slug: "2018",
    title: "Rokumentarni dani 2",
    dates: "8–11. jun 2018",
    cities: ["Nikšić"],
  },
  {
    n: 3,
    year: 2019,
    slug: "2019",
    title: "Rokumentarni dani 3",
    dates: "23–26. maj 2019",
    cities: ["Podgorica", "Nikšić"],
  },
  {
    n: 4,
    year: 2020,
    slug: "2020",
    title: "Rokumentarni dani 4",
    dates: "23–27. oktobar 2020",
    cities: ["Podgorica", "Nikšić", "Mojkovac"],
  },
  {
    n: 5,
    year: 2021,
    slug: "2021",
    title: "Rokumentarni dani 5",
    dates: "29. novembar – 3. decembar 2021",
    cities: ["Podgorica", "Nikšić"],
  },
  {
    n: 6,
    year: 2022,
    slug: "2022",
    title: "Rokumentarni dani 6",
    slogan: "Osvajanje slobode",
    dates: "9, 10, 16. i 17. decembar 2022",
    cities: ["Podgorica", "Nikšić", "Mojkovac"],
  },
  {
    n: 7,
    year: 2023,
    slug: "2023",
    title: "Rokumentarni dani 7",
    dates: "10, 11, 18. i 19. novembar 2023",
    cities: ["Nikšić", "Podgorica"],
  },
];

/**
 * Tekuće izdanje — ono koje je na /program/, i jedino koje NIJE u nizu
 * `editions` iznad: taj niz su ZAVRŠENA izdanja i iz njega se računa
 * statistika na naslovnoj („7 završenih izdanja").
 *
 * Isti oblik kao arhivska izdanja, namjerno: kad RD8 prođe, cijeli ovaj
 * objekat se preseli u niz gore, a ovdje ga zamijeni RD9. Zaglavlje,
 * naslovna i /program/ tada same pokupe novi broj i datume — nigdje se ne
 * dira kod, samo ovaj fajl.
 *
 * Satnica tekućeg izdanja stoji odvojeno, u data/program.ts, jer nosi
 * podatke kakve arhiva nema: trejlere, sinopsise i stavke za listu
 * gledanja.
 */
export const currentEdition: Edition = {
  n: 8,
  year: 2026,
  slug: "2026",
  title: "Rokumentarni dani 8",
  dates: "17–20. septembar 2026",
  cities: ["Podgorica"],
  venue: "Kružni tok",
};

export const editionByNumber = new Map(editions.map((e) => [e.n, e]));

/** „RD2 · 2018" — kratka oznaka koja staje na karticu. */
export function editionTag(n: number): string {
  const edition = editionByNumber.get(n);
  return edition ? `RD${edition.n} · ${edition.year}` : `RD${n}`;
}
