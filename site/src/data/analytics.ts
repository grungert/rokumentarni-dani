/**
 * Google Analytics 4 — mjerni identifikator toka podataka.
 *
 * Nalazi se u GA konzoli: Admin → Data streams → izaberi tok → Measurement ID.
 * Oblik je `G-` pa deset znakova, npr. `G-ABCD123456`.
 *
 * Nije tajna: GA ga ionako ispisuje u izvoru svake stranice, pa stoji u
 * repozitorijumu umjesto u .env — inače bi se gubio pri svakom build-u na
 * drugoj mašini.
 *
 * Dok je prazan, skripta se uopšte ne ubacuje: sajt tada ne dodiruje Google
 * ni jednim zahtjevom. Tako i ostaje na razvojnoj mašini, gdje bi posjete
 * samo prljale statistiku.
 */
export const GA_ID = "G-7MVDH0D8DQ";

/**
 * Da li uopšte ima šta da se nudi. Traka se prikazuje i na razvojnoj mašini,
 * da se izgled može provjeriti, ali sam GA se tamo ne učitava — o tome vodi
 * računa skripta u ConsentBar.astro.
 */
export const GA_READY = GA_ID.startsWith("G-");
