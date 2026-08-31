// Stare WP adrese → nova mjesta.
//
// Ove stranice su godinama bile na sajtu, linkovane su sa starog menija i
// iz medijskih objava. Sadržaj im sada živi u arhivi, katalogu i galeriji,
// pa stara adresa mora da vodi tamo — a ne da servira duplikat ili, kod
// galerija, praznu stranicu kojoj je migracija pojela sadržaj.
//
// Isti spisak koristi i astro.config.mjs (pravi redirekcije) i
// [...slug].astro (izuzima ih iz generisanja), pa ne mogu da se raziđu.

export const legacyRedirects: Record<string, string> = {
  // Foto galerije — u migraciji su ostale prazne, sadržaj je vraćen tek
  // preko SQL dumpa i sada je u kontakt-kopijama.
  "/foto-galerija-2017-dan-i/": "/galerija/2017/",
  "/foto-galerija-dan-ii/": "/galerija/2017/",
  "/foto-galerija-dan-3/": "/galerija/2017/",
  "/2018-foto-galerija-dan-i/": "/galerija/2018/",
  "/2018-foto-galerija-dan-ii/": "/galerija/2018/",
  "/2018-foto-galerija-dan-iii/": "/galerija/2018/",
  "/2018-foto-galerija-dan-vi/": "/galerija/2018/",

  // Satnice.
  "/program-2017/": "/arhiva/2017/",
  "/program-2018/": "/arhiva/2018/",
  "/program-2019-2/": "/arhiva/2019/",
  "/program-2020/": "/arhiva/2020/",
  "/program-2021/": "/arhiva/2021/",
  "/program-2022/": "/arhiva/2022/",
  "/program-2022-2/": "/arhiva/2023/",

  // Selekcije filmova. Pažnja na slug „dokumentarni-filmovi-2019": sadržaj
  // je selekcija za oktobar 2020, pa ide na /arhiva/2020/.
  "/dokumentarni-filmovi-2017/": "/arhiva/2017/",
  "/dokumentarni-filmovi-2018/": "/arhiva/2018/",
  "/dokumentarni-filmovi-2019/": "/arhiva/2020/",
  "/dokumentarni-filmovi-2021/": "/arhiva/2021/",
  "/dokumentarni-filmovi-2022/": "/arhiva/2022/",
  "/dokumentarni-filmovi-2022-2/": "/arhiva/2023/",

  // Press je dobio pravu adresu; „sample-page" je bio WP-ov podrazumijevani
  // slug koji je godinama nosio spisak medijskih objava.
  "/sample-page/": "/press/",

  // Duplirane i probne naslovne iz WP-a.
  "/pocetna/": "/",
  "/pocetna-2020/": "/",
  "/home/": "/",
  "/home-2/": "/",
  "/test/": "/",
  "/teest/": "/",
  "/novosti/": "/blog/",
};

/** Slugovi (bez kosih crta) koje [...slug].astro više ne smije da generiše. */
export const redirectedSlugs = new Set(
  Object.keys(legacyRedirects).map((path) => path.replace(/^\/|\/$/g, "")),
);
