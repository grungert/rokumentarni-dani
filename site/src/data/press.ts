// Medijski zapisi o festivalu — 31 link, sve iz 2017. godine.
//
// Izvučeno iz stare WP stranice „Press" (ID 2), koja je do sada stajala na
// adresi /sample-page/, nelinkovana ni sa jednog mjesta. Link tekst u
// originalu je bila sama adresa, pa naslova nema — `label` je izveden iz
// sluga i ponegdje nedostaje. Ništa nije dopisivano; ako neko zna prave
// naslove, upisuju se ovdje.
//
// Većina adresa je http:// iz 2017. i dio je vjerovatno mrtav. Ne
// provjeravamo ih pri buildu — vanjski servisi nisu razlog da build padne.

export interface PressLink {
  outlet: string;
  url: string;
  /**
   * Kod zapisa iz 2017. naslov je IZVEDEN iz adrese (u staroj bazi je link
   * tekst bila sama adresa); kod kasnijih je pravi naslov objave.
   */
  label?: string;
  /** Godina izdanja o kojem se piše — samo kad je pouzdano poznata. */
  year?: number;
  /** Server odbija automatske zahtjeve (403/406) — stranica nije mrtva. */
  botBlocked?: boolean;
}

export const pressLinks: PressLink[] = [
  { outlet: "bktvnews.com", url: "http://www.bktvnews.com/kultura/film/branko-radakovic-briljirao-i-u-crnoj-gori-ovacije-za-limunovo-drvo/112975" },
  { outlet: "bruskin.me", url: "http://www.bruskin.me/2017/05/21/16-filmova-na-programu-revije-rokumentarni-dani-u-niksicu-26-28-05/", label: "Filmova na programu revije rokumentarni dani u niksicu 26 28 05" },
  { outlet: "bruskin.me", url: "http://www.bruskin.me/2017/05/19/pocinju-rokumentarni-dani-u-niksicu/", label: "Pocinju rokumentarni dani u niksicu" },
  { outlet: "cdm.me", url: "https://www.cdm.me/zabava/muzika-film-tv/film-muzika-umjetnost-razlicitih-generacija/", label: "Film muzika umjetnost razlicitih generacija" },
  { outlet: "cdm.me", url: "https://www.cdm.me/kultura/ovacije-za-limunovo-drvo/", label: "Ovacije za limunovo drvo" },
  { outlet: "crna.gora.me", url: "https://crna.gora.me/magazin/muzika/upoznajte-se-sa-programom-filmske-revije-rokumentarni-dani/", label: "Upoznajte se sa programom filmske revije rokumentarni dani" },
  { outlet: "dan.co.me", url: "http://www.dan.co.me/?nivo=3&datum=2017-05-05&rubrika=Kultura&clanak=597231&najdatum=2017-05-04" },
  { outlet: "dan.co.me", url: "http://www.dan.co.me/?nivo=3&rubrika=Periskop&clanak=600339&datum=2017-05-28" },
  { outlet: "dan.co.me", url: "http://www.dan.co.me/?nivo=3&rubrika=Sarena%20strana&clanak=599815&najdatum=2017-05-24&datum=2017-05-26" },
  { outlet: "evensi.com", url: "https://www.evensi.com/rokumentarni-dani-nikisic/211663297" },
  { outlet: "glas.ba", url: "http://www.glas.ba/2017/05/24/rockumentarni-festivali-poput-pozara-sire-se-regionom/", label: "Rockumentarni festivali poput pozara sire se regionom" },
  { outlet: "infoera.rs", url: "http://infoera.rs/2017/05/24/zvuk-lampasa-na-reviji-rokumentarni-dani-u-niksicu/", label: "Zvuk lampasa na reviji rokumentarni dani u niksicu" },
  { outlet: "mladiniksica.me", url: "http://www.mladiniksica.me/crnogorski-dzez-sastav-mp-trio-u-niksicu/", label: "Crnogorski dzez sastav mp trio u niksicu" },
  { outlet: "mladiniksica.me", url: "http://www.mladiniksica.me/tag/rokumentarni-dani/", label: "Rokumentarni dani" },
  { outlet: "mladiniksica.me", url: "http://www.mladiniksica.me/rokumentarni-dani-u-niksicu/", label: "Rokumentarni dani u niksicu" },
  { outlet: "monitor.co.me", url: "http://www.monitor.co.me/index.php?option=com_content&view=article&id=7650:irena-juki-pranji-hrvatska-strip-autorka-svijest-o-stripu-nije-beznaajna&catid=5372:broj-1387&Itemid=6752" },
  { outlet: "montenegrina.net", url: "http://montenegrina.net/fokus/niksic-manifestacija-rokumentarni-dani/", label: "Niksic manifestacija rokumentarni dani" },
  { outlet: "mulj.net", url: "http://mulj.net/index.php/strip/6643-irena-jukic-pranjic-svijest-o-stripu-nije-masovna-ni-kolektivna-no-to-ne-znaci-da-je-beznacajna", label: "Irena jukic pranjic svijest o stripu nije masovna ni kolektivna no to ne znaci da je beznacajna" },
  { outlet: "mulj.net", url: "http://mulj.net/index.php/intervju/6650-m-o-r-t-nije-bog-onaj-na-nebu-vec-onaj-ciju-rijec-ne-mozete-srusiti", label: "M o r t nije bog onaj na nebu vec onaj ciju rijec ne mozete srusiti" },
  { outlet: "mulj.net", url: "http://mulj.net/index.php/tekstovi/kolumne/6651-rokumentarni-dani", label: "Rokumentarni dani" },
  { outlet: "mulj.net", url: "http://mulj.net/index.php/strip/6620-veljko-miljanic-buducnost-crnogorske-ilustracije", label: "Veljko miljanic buducnost crnogorske ilustracije" },
  { outlet: "onogost.me", url: "http://www.onogost.me/kultura/rokumentarni-dani-po-prvi-put-od-26-do-28-maja", label: "Rokumentarni dani po prvi put od 26 do 28 maja" },
  { outlet: "onogost.me", url: "http://www.onogost.me/kultura/rokumentarni-dani-pregled-odabranih-filmova-sa-ex-yu-prostora", label: "Rokumentarni dani pregled odabranih filmova sa ex yu prostora" },
  { outlet: "onogost.me", url: "http://www.onogost.me/kultura/rokumentarni-dani-svirke-mp-trija-multietnicke-atrakcije-mort", label: "Rokumentarni dani svirke mp trija multietnicke atrakcije mort" },
  { outlet: "pasaz.rs", url: "http://pasaz.rs/uzicki-film-sa-interakcije-na-rokumentarnim-danima-u-niksicu/", label: "Uzicki film sa interakcije na rokumentarnim danima u niksicu" },
  { outlet: "radioluna.rs", url: "http://www.radioluna.rs/uzicki-kraj/15245/film-sa-interakcije-na-rokumentarnim-danima-u-niksicu.html", label: "Film sa interakcije na rokumentarnim danima u niksicu" },
  { outlet: "stereoart.me", url: "http://stereoart.me/2014-11-05-03-46-13/rubrike/live/item/741-rokumentarni-dani-posveta-muzici-iznutra", label: "Rokumentarni dani posveta muzici iznutra" },
  { outlet: "trecisvijet.com", url: "http://trecisvijet.com/2017/05/13/rokumentarni-dani-od-26-do-28-maja-u-niksicu/", label: "Rokumentarni dani od 26 do 28 maja u niksicu" },
  { outlet: "vijesti.me", url: "http://www.vijesti.me/caffe/mp-trio-multietnicka-atrakcija-i-mort-na-rokumenarnim-danima-u-niksicu-938554", label: "Mp trio multietnicka atrakcija i mort na rokumenarnim danima u niksicu 938554" },
  { outlet: "vijesti.me", url: "http://www.vijesti.me/caffe/organizatori-rokumentarnih-dana-zadovoljni-naredne-godine-bice-jos-bolje-940039", label: "Organizatori rokumentarnih dana zadovoljni naredne godine bice jos bolje 940039" },
];

/**
 * Objave nađene naknadno, pretragom weba — nisu bile na starom sajtu.
 * Provjereno je da adrese odgovaraju; cdm.me odbija automatske zahtjeve
 * (403), ali stranice postoje i otvaraju se u pregledaču.
 *
 * Namjerno NISU ovdje: mulj.net (PopQlt) i nvotnt.me — to su portali samih
 * organizatora, dakle sopstvene objave, a ne ono što su drugi pisali.
 */
const foundLater: PressLink[] = [
  {
    outlet: "cdm.me",
    url: "https://www.cdm.me/zabava/muzika-film-tv/rokumentarni-dani-od-23-do-27-oktobra-u-tri-grada/",
    label: "Rokumentarni dani od 23. do 27. oktobra u tri grada",
    year: 2020,
    botBlocked: true,
  },
  {
    outlet: "cdm.me",
    url: "https://www.cdm.me/kultura/kompletiran-muzicki-program-rokumentarnih-dana/",
    label: "Kompletiran muzički program Rokumentarnih dana",
    botBlocked: true,
  },
  {
    outlet: "cdm.me",
    url: "https://www.cdm.me/zabava/muzika-film-tv/film-muzika-umjetnost-razlicitih-generacija/",
    label: "Film, muzika i umjetnost različitih generacija",
    botBlocked: true,
  },
  {
    outlet: "zrcalo.me",
    url: "https://zrcalo.me/cetvrti-rokumentarni-dani/",
    label: "Četvrti Rokumentarni dani",
    year: 2020,
  },
  {
    outlet: "rtnk.me",
    url: "https://rtnk.me/kultura/u-niksicu-petak-i-subota-rezerisani-za-rokumentarne-dane/",
    label: "U Nikšiću petak i subota „rezervisani\" za Rokumentarne dane",
  },
  {
    outlet: "balkanrock.com",
    url: "https://balkanrock.com/vesti/vesti-iz-regiona/rokumentarni-dani-u-niksicu/",
    label: "Rokumentarni dani u Nikšiću",
  },
];

/** Sve objave — stare iz arhive i one nađene naknadno. */
export const allPress: PressLink[] = [...pressLinks, ...foundLater];
