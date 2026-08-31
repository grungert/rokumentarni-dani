// Sopstvena produkcija festivala — Live Sessions i podcast Premotavanje.
//
// Isti izvor koriste naslovna (tri kartice) i /produkcija/ (sve), pa spisak
// ne može da se raziđe na dva mjesta.

export interface Video {
  /** YouTube ID. */
  id: string;
  /** Izvođač ili gost — nosi naslov kartice. */
  artist: string;
  title: string;
}

/**
 * Live Sessions — snimljene originalne izvedbe crnogorskih autora.
 *
 * NAPOMENA: četiri epizode nemaju ime izvođača, stoji im samo „Live Session".
 * Serijal iz 2020. je imao sedam epizoda — Big Do, SoloSoul, Anja Zagorac,
 * Bacili & Bellerophontes, Yonic, Autogeni trening i Emily Rose — pa su
 * imena koja fale među njima, ali se ne zna koji snimak je koji i ne
 * pogađamo. Najlakše se rješava ako serijal ima YouTube plejlistu: tada
 * naslovi dolaze sami, isto kao kod podcasta ispod.
 */
export const liveSessions: Video[] = [
  { id: "tJ4dnWwYHYo", artist: "Anja Zagorac", title: "Rokumentarni dani · Live Sessions" },
  { id: "amoqTYC3TQ8", artist: "Bacili & Bellerophontes", title: "Rokumentarni dani · Live Sessions" },
  { id: "Y1K-84ZZqj4", artist: "Autogeni trening", title: "Rokumentarni dani · Live Sessions · Unplugged" },
  { id: "LGOcJXbpOrg", artist: "Live Session", title: "Rokumentarni dani · Live Sessions" },
  { id: "Lm7KIW0sFO4", artist: "Live Session", title: "Rokumentarni dani · Live Sessions" },
  { id: "JGVyJZ0V4lo", artist: "Live Session", title: "Rokumentarni dani · Live Sessions" },
  { id: "oWNPxBrqlIU", artist: "Live Session", title: "Rokumentarni dani · Live Sessions" },
];

export const PODCAST_PLAYLIST_ID = "PLI5tSRbbmD83Vl8Jxmtl3Zjp0QU4yw-IM";

/** YouTube kanal na kojem sve ovo stoji. */
export const YOUTUBE_CHANNEL = "https://www.youtube.com/@BucanPas";

/**
 * Epizode iz javnog RSS-a plejliste — bez API ključa. YouTube vraća
 * posljednjih ~15. Ako mreža zakaže tokom build-a, vraća se prazan spisak i
 * stranica se crta bez te sekcije: bolje nego da build padne zbog tuđeg
 * servisa.
 */
export async function fetchPlaylist(playlistId: string): Promise<Video[]> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`,
      { signal: ctrl.signal },
    );
    clearTimeout(timer);
    if (!res.ok) return [];

    const xml = await res.text();
    return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)]
      .map((match) => {
        const body = match[1];
        const id = body.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] ?? "";
        const raw = body.match(/<title>([^<]+)<\/title>/)?.[1] ?? "";
        // Naslovi su najčešće „Gost — tema"; ako nisu, cijeli naslov je gost.
        const parts = raw.split(/\s+[—–-]\s+/);
        return parts.length > 1
          ? { id, artist: parts[0].trim(), title: parts.slice(1).join(" — ").trim() }
          : { id, artist: raw, title: "Rokumentarni dani · Premotavanje" };
      })
      .filter((video) => video.id);
  } catch (error) {
    console.warn("[produkcija] RSS plejliste nedostupan:", error);
    return [];
  }
}
