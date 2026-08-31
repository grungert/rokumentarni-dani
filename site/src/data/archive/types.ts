// Arhiva Rokumentarnih dana — oblik podataka za izdanja RD1 (2017) do RD7 (2023).
//
// Ove tipove piše čovjek, sadržaj generiše scripts/extract_archive.py pa ga
// dalje održavamo rukom. Sva polja koja stara baza nije uvijek imala su
// opciona — nedostatak podatka je stvarno stanje arhive, ne greška u tipu,
// i stranica mora umjeti da ga preskoči bez rupe u dizajnu.

/** Jedno izdanje festivala. Tekuće izdanje ima isti oblik kao arhivska. */
export interface Edition {
  /** Redni broj izdanja — RD1…RD8. */
  n: number;
  year: number;
  /** Ruta: /arhiva/2018/ */
  slug: string;
  title: string;
  /** Samo RD6 je imao imenovan slogan („Osvajanje slobode"). */
  slogan?: string;
  dates?: string;
  cities: string[];
}

export interface ArchiveFilm {
  /** Stabilan ključ kroz izdanja — isti film može biti prikazan dvaput. */
  id: string;
  /** Ruta: /filmovi/<slug>/ */
  slug: string;
  title: string;
  /** Ime ciklusa ili podnaslov — 2019. ih je pisala u istom naslovu. */
  subtitle?: string;
  /** Kojem izdanju pripada projekcija. */
  edition: number;
  editionYear: number;
  director?: string;
  production?: string;
  country?: string;
  /** Godina filma, ne izdanja. */
  year?: number;
  /** Minuti. */
  duration?: number;
  synopsis?: string;
  /** Putanja u /media/, iz stare biblioteke. */
  poster?: string;
  /** YouTube ID — imaju ga samo izdanja 2017. i 2018. */
  trailer?: string;
  /** Sirov tekst termina projekcije, kako je bio zapisan. */
  screening?: string;
}

export interface ArchiveItem {
  /**
   * „19:15", ili izostaje: RD6 je za tri grada objavio program bez satnice
   * („TBA"). Termin je postojao, sat nikad nije objavljen.
   */
  start?: string;
  end?: string;
  title: string;
  kind: "film" | "koncert" | "dj" | "tribina" | "videodrom";
}

export interface ArchiveDay {
  edition: number;
  /** Kako je dan bio napisan na starom sajtu — „26. MAJ - PETAK". */
  label: string;
  weekday?: string;
  venue?: string;
  items: ArchiveItem[];
}

export interface ArchivePhoto {
  id: string;
  edition: number;
  editionYear: number;
  /** Redni broj dana u okviru izdanja (1…4). */
  day: number;
  dayLabel: string;
  src: string;
  w?: number;
  h?: number;
  /** Veličine koje je WP već ispekao, npr. ["150x150", "768x512"]. */
  variants: string[];
}
