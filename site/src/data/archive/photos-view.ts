// Fotografije iz arhive — grupisanje i srcset.
//
// Zaseban modul namjerno: photos.ts nosi 543 zapisa i nema razloga da ga
// vuče svaka stranica koja dodirne arhivu. Uvozi ga samo galerija.
import { archivePhotos } from "./photos";
import type { ArchivePhoto } from "./types";

export { archivePhotos };

export interface PhotoDay {
  /** Redni broj dana u izdanju. */
  n: number;
  /** „Dan 3" — stari naslovi su neujednačeni i jedan ima grešku (DAN VI). */
  label: string;
  /** Naslov stranice sa starog sajta, za slučaj da ga treba provjeriti. */
  legacyLabel: string;
  photos: ArchivePhoto[];
}

export interface PhotoEdition {
  edition: number;
  year: number;
  total: number;
  days: PhotoDay[];
}

export const photoEditions: PhotoEdition[] = (() => {
  const byEdition = new Map<number, ArchivePhoto[]>();
  for (const photo of archivePhotos) {
    const list = byEdition.get(photo.edition) ?? [];
    list.push(photo);
    byEdition.set(photo.edition, list);
  }

  return [...byEdition.entries()]
    .map(([edition, list]) => {
      const byDay = new Map<number, ArchivePhoto[]>();
      for (const photo of list) {
        const day = byDay.get(photo.day) ?? [];
        day.push(photo);
        byDay.set(photo.day, day);
      }

      return {
        edition,
        year: list[0].editionYear,
        total: list.length,
        days: [...byDay.entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([n, photos]) => ({
            n,
            label: `Dan ${n}`,
            legacyLabel: photos[0].dayLabel,
            photos,
          })),
      };
    })
    .sort((a, b) => a.year - b.year);
})();

/**
 * srcset iz veličina koje WP zaista ima za tu sliku — nikad se ne pretpostavlja
 * da neka postoji. 345x198 i 150x150 postoje za svih 543, ostalo je nejednako.
 */
export function photoSrcset(photo: ArchivePhoto, sizes: string[]): string | undefined {
  const parts = sizes
    .filter((size) => photo.variants.includes(size))
    .map((size) => {
      const width = size.split("x")[0];
      const src = photo.src.replace(/(\.[a-z]+)$/i, `-${size}$1`);
      return `${src} ${width}w`;
    });
  return parts.length ? parts.join(", ") : undefined;
}

/** Najmanja postojeća varijanta — kadar u kontakt-kopiji. */
export function photoThumb(photo: ArchivePhoto): string {
  const size = ["345x198", "400x260", "150x150"].find((s) =>
    photo.variants.includes(s),
  );
  return size
    ? photo.src.replace(/(\.[a-z]+)$/i, `-${size}$1`)
    : photo.src;
}

