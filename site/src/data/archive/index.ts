// Izvedeni pogledi na arhivu. Generisani fajlovi ostaju sirovi zapisi —
// svako grupisanje, sortiranje i čišćenje živi ovdje, na jednom mjestu,
// da stranice ne bi svaka za sebe računala isto.
import { archiveFilms } from "./films";
import { archiveProgram } from "./program";
import { editions } from "./editions";
import type { ArchiveDay, ArchiveFilm } from "./types";

export { archiveFilms, archiveProgram, editions };

/** Isti naslov prikazan u više izdanja je JEDAN film sa više projekcija. */
export interface FilmGroup {
  slug: string;
  /** Zapis iz najstarijeg izdanja — nosi naslov, sinopsis i ostalo. */
  film: ArchiveFilm;
  /** Sva izdanja u kojima je prikazan, od najstarijeg. */
  screenings: ArchiveFilm[];
  /** Prvi zapis koji ima plakat — ne mora biti isti kao `film`. */
  poster?: string;
  trailer?: string;
}

export const filmGroups: FilmGroup[] = (() => {
  const bySlug = new Map<string, ArchiveFilm[]>();
  for (const film of archiveFilms) {
    const list = bySlug.get(film.slug) ?? [];
    list.push(film);
    bySlug.set(film.slug, list);
  }

  return [...bySlug.entries()]
    .map(([slug, list]) => {
      const screenings = [...list].sort((a, b) => a.editionYear - b.editionYear);
      return {
        slug,
        film: screenings[0],
        screenings,
        // Podaci su nejednaki po godinama — uzmi prvi koji ih ima, bez obzira
        // iz kog je izdanja, umjesto da kartica ostane prazna.
        poster: screenings.find((f) => f.poster)?.poster,
        trailer: screenings.find((f) => f.trailer)?.trailer,
      };
    })
    .sort((a, b) => a.film.title.localeCompare(b.film.title, "sr"));
})();

/** Zemlje su pisane i kao „Italija/Francuska" i kao „UK, Srbija". */
export function splitCountries(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[\/,]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Spisak za filter — svaka zemlja jednom, azbučno. */
export const allCountries: string[] = [
  ...new Set(archiveFilms.flatMap((f) => splitCountries(f.country))),
].sort((a, b) => a.localeCompare(b, "sr"));

/** Godine izdanja u kojima ima filmova, od najnovije. */
export const filmYears: number[] = [
  ...new Set(archiveFilms.map((f) => f.editionYear)),
].sort((a, b) => b - a);

export function editionOf(year: number) {
  return editions.find((e) => e.year === year);
}

/** „91 min" — trajanje se prikazuje samo kad ga stvarno imamo. */
export function durationLabel(minutes?: number): string | null {
  return minutes ? `${minutes} min` : null;
}

/* --------------------------------------------------------------- izdanja */

/** Naslovi prikazani u jednom izdanju, redom kojim su bili na stranici. */
export function filmsOfEdition(n: number): FilmGroup[] {
  return filmGroups
    .filter((group) => group.screenings.some((s) => s.edition === n))
    .sort((a, b) => a.film.title.localeCompare(b.film.title, "sr"));
}

export function programOfEdition(n: number): ArchiveDay[] {
  return archiveProgram.filter((day) => day.edition === n);
}

/** Šta izdanje uopšte ima — po ovome stranica odlučuje koje sekcije crta. */
export interface EditionStats {
  films: number;
  days: number;
  items: number;
}

export function statsOfEdition(n: number): EditionStats {
  const days = programOfEdition(n);
  return {
    films: archiveFilms.filter((f) => f.edition === n).length,
    days: days.length,
    items: days.reduce((sum, day) => sum + day.items.length, 0),
  };
}

/** Oznaka vrste termina u satnici — prati jezik kaseta sa programa. */
export const archiveKindLabel: Record<ArchiveDay["items"][number]["kind"], string> = {
  film: "Film",
  koncert: "Koncert",
  dj: "DJ",
  tribina: "Tribina",
  videodrom: "Videodrom",
};

/** Red ispod naslova: režija · zemlja · godina, bez praznih karika. */
export function credits(film: ArchiveFilm): string {
  return [film.director, film.country, film.year ? `${film.year}.` : null]
    .filter(Boolean)
    .join(" · ");
}
