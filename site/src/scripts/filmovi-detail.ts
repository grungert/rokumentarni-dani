// Trejler na stranici filma.
//
// YouTube se ne dira dok neko ne klikne: do tada je na ekranu samo plakat,
// bez ijednog zahtjeva ka Google-u i bez kolačića. Zato youtube-nocookie
// i zato iframe nastaje tek ovdje, a ne u markupu.
export function wireFilmTrailer(): void {
  const button = document.querySelector<HTMLElement>("[data-film-play]");
  if (!button || button.dataset.wired === "true") return;
  button.dataset.wired = "true";

  button.addEventListener("click", () => {
    const id = button.dataset.filmPlay;
    const screen = document.querySelector<HTMLElement>("[data-film-screen]");
    if (!id || !screen) return;

    const frame = document.createElement("iframe");
    frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    frame.title = "Trejler";
    frame.allow = "autoplay; encrypted-media; picture-in-picture";
    frame.allowFullscreen = true;
    frame.className = "rd-film-frameplayer";

    screen.appendChild(frame);
    screen.dataset.playing = "true";
    button.remove();
  });
}
