// Scroll-into-view otkrivanje sekcija — isti obrazac koji koriste ostale
// stranice, izdvojen u modul da ga ne prepisujemo po stranici.
export function wireReveal(): void {
  const targets = document.querySelectorAll<HTMLElement>(
    ".reveal:not(.is-visible), .reveal-stagger:not(.is-visible)",
  );
  if (!targets.length) return;

  const reduced =
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced || !("IntersectionObserver" in window)) {
    targets.forEach((t) => t.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
  );

  targets.forEach((t) => io.observe(t));
}
