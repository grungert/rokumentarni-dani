// Snimci se puštaju u mjestu, u samoj kartici.
//
// Do klika na stranici nema nijednog YouTube skripta ni kolačića — samo
// sličica. Zato delegirani listener, a ne iframe u markupu.
let docWired = false;

export function wireVideoFacades(): void {
  if (!document.querySelector("[data-video-play]")) return;
  if (docWired) return;
  docWired = true;

  document.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement | null)?.closest<HTMLElement>(
      "[data-video-play]",
    );
    if (!button) return;

    const id = button.dataset.videoPlay;
    const frame = button.closest<HTMLElement>("[data-video]");
    if (!id || !frame || frame.dataset.playing === "true") return;

    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    iframe.title = "Snimak";
    iframe.allow = "autoplay; encrypted-media; picture-in-picture";
    iframe.allowFullscreen = true;
    iframe.className = "rd-vid-player";

    frame.appendChild(iframe);
    frame.dataset.playing = "true";
    button.remove();
  });
}
