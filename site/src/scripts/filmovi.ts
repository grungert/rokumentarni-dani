// Filteri kataloga — pretraga, izdanje, zemlja, trejler.
//
// Svih 79 kartica je već u DOM-u (statički render, radi i bez JS-a i vidi ga
// pretraživač), pa filtriranje ne dohvata ništa — samo pali i gasi `hidden`
// po data- atributima koje je kartica ponijela sa sobom.

interface Filters {
  query: string;
  year: string;
  country: string;
  trailerOnly: boolean;
}

const state: Filters = {
  query: "",
  year: "sve",
  country: "sve",
  trailerOnly: false,
};

function apply(): void {
  const cards = document.querySelectorAll<HTMLElement>("[data-film]");
  let shown = 0;

  cards.forEach((card) => {
    const years = (card.dataset.years ?? "").split(" ");
    const countries = (card.dataset.countries ?? "").split("|");
    const haystack = card.dataset.search ?? "";

    const visible =
      (!state.query || haystack.includes(state.query)) &&
      (state.year === "sve" || years.includes(state.year)) &&
      (state.country === "sve" || countries.includes(state.country)) &&
      (!state.trailerOnly || card.dataset.trailer === "1");

    card.hidden = !visible;
    if (visible) shown += 1;
  });

  const count = document.querySelector("[data-film-count]");
  if (count) count.textContent = String(shown);

  const empty = document.querySelector<HTMLElement>("[data-film-empty]");
  if (empty) empty.hidden = shown > 0;
}

function reset(): void {
  state.query = "";
  state.year = "sve";
  state.country = "sve";
  state.trailerOnly = false;

  const search = document.querySelector<HTMLInputElement>("[data-film-search]");
  if (search) search.value = "";

  const select = document.querySelector<HTMLSelectElement>("[data-film-country]");
  if (select) select.value = "sve";

  syncChips();
  apply();
}

function syncChips(): void {
  document.querySelectorAll<HTMLElement>("[data-film-year]").forEach((chip) => {
    chip.setAttribute(
      "aria-pressed",
      String((chip.dataset.filmYear ?? "") === state.year),
    );
  });

  const trailer = document.querySelector<HTMLElement>("[data-film-trailer]");
  if (trailer) trailer.setAttribute("aria-pressed", String(state.trailerOnly));
}

let docWired = false;

function wireDocument(): void {
  if (docWired) return;
  docWired = true;

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const yearChip = target.closest<HTMLElement>("[data-film-year]");
    if (yearChip) {
      state.year = yearChip.dataset.filmYear ?? "sve";
      syncChips();
      apply();
      return;
    }

    if (target.closest("[data-film-trailer]")) {
      state.trailerOnly = !state.trailerOnly;
      syncChips();
      apply();
      return;
    }

    if (target.closest("[data-film-reset]")) {
      reset();
    }
  });

  document.addEventListener("input", (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.matches("[data-film-search]")) {
      state.query = (target as HTMLInputElement).value.trim().toLowerCase();
      apply();
    }
  });

  document.addEventListener("change", (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.matches("[data-film-country]")) {
      state.country = (target as HTMLSelectElement).value;
      apply();
    }
  });
}

export function wireFilmFilters(): void {
  if (!document.querySelector("[data-film-grid]")) return;
  wireDocument();
  // Navigacija je zamijenila DOM — stanje filtera preživi, kartice ne.
  syncChips();
  apply();
}
