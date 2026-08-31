// Galerija — projekcija kadra iz kontakt-kopije.
//
// Redoslijed se čita iz DOM-a, ne iz podataka: kadrovi su već poređani na
// stranici, pa strelice prate tačno ono što korisnik vidi. Velika slika se
// skida tek kad se otvori projekcija, a susjedna se tiho pripremi unaprijed
// da listanje ne trepće.

let frames: HTMLElement[] = [];
let current = 0;

function dialog(): HTMLDialogElement | null {
  return document.querySelector<HTMLDialogElement>("[data-lightbox]");
}

/** Sljedeći/prethodni kadar bez skoka na sam kraj — traka nije beskonačna. */
function show(index: number): void {
  const box = dialog();
  if (!box || !frames.length) return;

  current = Math.max(0, Math.min(frames.length - 1, index));
  const frame = frames[current];
  const img = box.querySelector<HTMLImageElement>("[data-lb-img]");
  if (!img) return;

  const full = frame.dataset.full ?? "";
  const thumb = frame.querySelector("img");

  img.src = full;
  img.alt = thumb?.alt ?? "";
  // Dimenzije iz podataka drže odnos stranica dok se slika ne učita.
  if (frame.dataset.w) img.width = Number(frame.dataset.w);
  if (frame.dataset.h) img.height = Number(frame.dataset.h);

  const no = box.querySelector("[data-lb-no]");
  const total = box.querySelector("[data-lb-total]");
  const day = box.querySelector("[data-lb-day]");
  if (no) no.textContent = String(current + 1);
  if (total) total.textContent = String(frames.length);
  if (day) {
    const sheet = frame.closest(".rd-cs");
    day.textContent = sheet?.querySelector(".rd-cs-day")?.textContent ?? "";
  }

  box.querySelectorAll<HTMLButtonElement>("[data-lb-prev]").forEach((b) => {
    b.disabled = current === 0;
  });
  box.querySelectorAll<HTMLButtonElement>("[data-lb-next]").forEach((b) => {
    b.disabled = current === frames.length - 1;
  });

  preload(current + 1);
  preload(current - 1);
}

function preload(index: number): void {
  const frame = frames[index];
  if (!frame?.dataset.full) return;
  const img = new Image();
  img.src = frame.dataset.full;
}

function open(frame: HTMLElement): void {
  const box = dialog();
  if (!box) return;
  show(frames.indexOf(frame));
  if (typeof box.showModal === "function") box.showModal();
  else box.setAttribute("open", "");
}

function close(): void {
  const box = dialog();
  if (!box) return;
  // Izbaci izvor da velika slika ne ostane u memoriji zatvorenog dijaloga.
  const img = box.querySelector<HTMLImageElement>("[data-lb-img]");
  if (img) img.removeAttribute("src");
  if (box.open) box.close();
}

let docWired = false;

function wireDocument(): void {
  if (docWired) return;
  docWired = true;

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const frame = target.closest<HTMLElement>("[data-photo]");
    if (frame) {
      open(frame);
      return;
    }

    if (target.closest("[data-lb-prev]")) {
      show(current - 1);
      return;
    }
    if (target.closest("[data-lb-next]")) {
      show(current + 1);
      return;
    }
    if (target.closest("[data-lb-close]")) {
      close();
      return;
    }

    // Klik pored slike zatvara — ali samo prazan prostor platna, nikad sama
    // slika. Provjera na dijalog ovdje ne bi radila: platno ga prekriva.
    if (target.matches("[data-lb-stage]")) close();
  });

  // Prevlačenje prstom — na telefonu je to prvo što ruka pokuša.
  let touchX = 0;
  let touchY = 0;

  document.addEventListener(
    "touchstart",
    (event) => {
      if (!dialog()?.open) return;
      touchX = event.changedTouches[0].clientX;
      touchY = event.changedTouches[0].clientY;
    },
    { passive: true },
  );

  document.addEventListener(
    "touchend",
    (event) => {
      if (!dialog()?.open) return;
      const dx = event.changedTouches[0].clientX - touchX;
      const dy = event.changedTouches[0].clientY - touchY;
      // Vodoravno i dovoljno daleko, inače je to bilo skrolovanje.
      if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy)) return;
      show(dx < 0 ? current + 1 : current - 1);
    },
    { passive: true },
  );

  document.addEventListener("keydown", (event) => {
    const box = dialog();
    if (!box?.open) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      show(current + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      show(current - 1);
    }
  });
}

export function wireGallery(): void {
  frames = [...document.querySelectorAll<HTMLElement>("[data-photo]")];
  if (!frames.length) return;

  wireDocument();

  const box = dialog();
  if (box && box.dataset.wired !== "true") {
    box.dataset.wired = "true";
    box.addEventListener("close", () => {
      const img = box.querySelector<HTMLImageElement>("[data-lb-img]");
      if (img) img.removeAttribute("src");
    });
  }
}
