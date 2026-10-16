// Every page's title, description and share image, in one place.
//
// Link-preview crawlers (iMessage, Slack, Discord, X, Facebook) don't run
// JavaScript, so the server writes these tags into index.html for each URL
// (server/page-meta.ts). The client's <SEO> renders the same values after
// hydration so the tab title and tags stay right as you navigate. Both sides
// call metaForPath() and the section helpers below; pages don't hard-code copy.
//
// Pure TS on purpose: the server imports this file too.

export const SITE = {
  name: "kpow",
  origin: "https://kpow.xyz",
  locale: "en_US",
  themeColor: "#000000",
};

export interface ShareImage {
  /** Absolute, or a path on this site */
  src: string;
  w?: number;
  h?: number;
  alt?: string;
}

export interface PageMeta {
  /** Page title without the site name; `fullTitle()` adds it */
  title: string;
  /** Empty means no description tags at all */
  description: string;
  image: ShareImage;
  /** og:type */
  type?: string;
  /** Keep out of search results (admin, auth, 404) */
  noindex?: boolean;
  /** Canonical path when it differs from the requested one */
  path?: string;
}

/** A 1200×630 card from client/public/og/ (made by scripts/og-cards). */
const card = (name: string, alt: string): ShareImage => ({ src: `/og/${name}.jpg`, w: 1200, h: 630, alt });

export const CARDS = {
  home: card("home", "kpow: the viz family of LED builds on a desk"),
  about: card("about", "kpow: about Kevin"),
  builds: card("builds", "kpow build log: LED instruments, handheld consoles and robots"),
  vizbot: card("vizbot", "vizBot: a tiny desk robot with a face"),
  vizspot: card("vizspot", "vizSpot: a 64×64 LED board showing what Spotify is playing"),
  vizmac: card("vizmac", "vizMac: a lit keyboard and the desk controller showing Now Playing"),
  led: card("led", "LED art: pixel grids running WLED"),
  shows: card("shows", "k-shows: concert clips"),
  phashboard: card("phashboard", "phashboard: Phish shows and PhantasyFish games"),
  itunez: card("itunez", "itunez: listening stats"),
  books: card("books", "book feed"),
  starred: card("starred", "star feed: starred articles"),
  videos: card("videos", "youtubez live"),
  pmonk: card("pmonk", "pmonk"),
  battle: card("battle", "battle: choose your champion"),
  donuts: card("donuts", "donut tour: a map of donut shops"),
};

const page = (title: string, description: string, image: ShareImage, extra: Partial<PageMeta> = {}): PageMeta => ({
  title,
  description,
  image,
  ...extra,
});

const HOME = page(
  "into the singularity",
  "kpow.xyz: the viz family of LED and desk-robot builds, a build log, concert clips, Phish stats, and what's playing and being read.",
  CARDS.home,
);

export const NOT_FOUND = page("page not found", "There's nothing at this address on kpow.xyz.", CARDS.home, { noindex: true });

/** Fixed pages, by exact path. */
export const STATIC_PAGES: Record<string, PageMeta> = {
  "/": HOME,
  "/about": page(
    "about Kevin",
    "Digital architect, leader and developer with 20+ years of designing solutions and running development teams. What I do and what I'm into.",
    CARDS.about,
    { type: "profile" },
  ),
  "/privacy": page(
    "privacy",
    "Privacy policy for kpow-dash, Kevin's personal dashboard: what it reads from Google, where that data stays, and how to revoke access.",
    CARDS.about,
  ),
  "/builds": page(
    "build log",
    "Every thing kpow is building: LED instruments, handheld consoles, robots, and the devlog behind them.",
    CARDS.builds,
  ),
  "/builds/recently": page(
    "recently · build log",
    "The latest devlog entries across every kpow build, newest first.",
    CARDS.builds,
  ),
  "/vizbot": page(
    "vizBot: a tiny desk robot",
    "vizBot is open-source firmware that gives a little ESP32 screen a face and a personality. Moods, speech bubbles, clock, weather and light shows on four boards.",
    CARDS.vizbot,
  ),
  "/vizbot/guide": page(
    "vizBot user guide",
    "Get vizBot on your WiFi, update the firmware, read the notes for your board, fix common problems.",
    CARDS.vizbot,
  ),
  "/vizbot/touch": page(
    "vizBot touch screen",
    "How to drive vizBot from its touch screen: gestures, the quick dock, the scene, mood and light sheets, settings, and the CoreS3 and Stackchan layout.",
    CARDS.vizbot,
  ),
  "/vizbot/web": page(
    "vizBot web panel",
    "Every card on vizBot's web panel: expressions, personality, appearance, WLED sprites, device, sounds, weather, WiFi, WLED display and Stackchan head control.",
    CARDS.vizbot,
  ),
  "/vizbot/releases": page(
    "vizBot downloads",
    "vizBot firmware for the Waveshare 1.69, Waveshare 1.3, M5Stack CoreS3 and Stackchan. Pick your board, grab one file, update over WiFi.",
    CARDS.vizbot,
  ),
  "/vizspot/guide": page(
    "vizSpot",
    "vizSpot: a 64×64 LED board that shows what you're playing on Spotify, reacts to the music, and sets up from your phone.",
    CARDS.vizspot,
  ),
  "/vizspot/controls": page(
    "vizSpot controls",
    "A section-by-section guide to the vizSpot control page: modes, effects, microphone, Spotify, power and WiFi settings.",
    CARDS.vizspot,
  ),
  "/vizmac": page(
    "vizMac: one knob for the whole desk",
    "A desk macropad for the Mac. One knob and one button run per-key lighting on a ROCCAT Vulcan Pro TKL, Spotify and Music, a focus timer and your WLED lights.",
    CARDS.vizmac,
  ),
  "/vizmac/guide": page(
    "vizMac user guide",
    "The vizMac menu bar app and web UI: effects and palettes, the keyboard, Wi-Fi access and pairing, controller updates, WLED lights, and fixes for common problems.",
    CARDS.vizmac,
  ),
  "/vizmac/controller": page(
    "vizMac controller",
    "The vizMac desk controller: the knob and KO button, the mode picker, Keys, Now Playing, the Clock and focus timer, WLED, Wi-Fi setup from your phone, and updates.",
    CARDS.vizmac,
  ),
  "/led": page(
    "led art",
    "Hand-built addressable-LED desktop art running WLED on an ESP32 and WS2812B. Change colors and effects from any phone or browser.",
    CARDS.led,
  ),
  "/shows": page(
    "k-shows",
    "Every night I pointed a phone at a stage: the numbers, then the story, with a map that follows along.",
    CARDS.shows,
  ),
  "/phashboard": page(
    "phashboard",
    "Phish shows, setlists, venues and PhantasyFish games.",
    CARDS.phashboard,
  ),
  "/itunez": page(
    "itunez",
    "Years of Apple Music and Spotify plays: top artists, songs and listening habits.",
    CARDS.itunez,
  ),
  "/books": page(
    "book feed",
    "What I'm reading and have read, from Goodreads: shelves, ratings and reviews.",
    CARDS.books,
  ),
  "/starred-articles": page(
    "star feed",
    "Articles worth keeping: everything I've starred in my feed reader.",
    CARDS.starred,
  ),
  "/videos": page(
    "youtubez live",
    "The latest videos from the YouTube channels I follow: music, tech and more.",
    CARDS.videos,
  ),
  // just the name, on purpose: those who know, know
  "/pmonk": page("pmonk", "", CARDS.pmonk),
  "/battle": page(
    "battle: choose your champion",
    "Enter the arena and pit heroes and villains against each other, testing their combinations and powers.",
    CARDS.battle,
    { type: "game" },
  ),
  "/donut-tour": page(
    "donut tour",
    "Find donut shops anywhere on a map: ratings, reviews and locations from Yelp.",
    CARDS.donuts,
  ),
  "/auth": page("sign in", "Sign in to kpow.xyz.", CARDS.home, { noindex: true }),
};

export const PHASHBOARD_TABS: Record<string, string> = {
  phantasy: "PhantasyFish",
  songs: "songs",
  shows: "shows",
  venues: "venues",
  onthisday: "on this day",
};

/** Page 2+ of a paged feed: same page, "page n" in the title, canonical to itself. */
function paged(base: PageMeta, n: string): PageMeta {
  const num = Number(n);
  if (!Number.isInteger(num) || num < 1) return NOT_FOUND;
  return num === 1 ? base : { ...base, title: `${base.title} · page ${num}` };
}

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Meta for any path the SPA serves, without fetched data. Build pages and
 * pages that know more (shows, phashboard) refine this with the helpers below.
 * Returns NOT_FOUND (noindex) for paths no route in App.tsx matches.
 */
export function metaForPath(rawPath: string): PageMeta {
  const path = rawPath.length > 1 ? rawPath.replace(/\/+$/, "") : rawPath;
  const fixed = STATIC_PAGES[path];
  if (fixed) return fixed;

  let m: RegExpMatchArray | null;
  if ((m = path.match(/^\/(books|videos|starred-articles)\/page\/([^/]+)$/))) return paged(STATIC_PAGES[`/${m[1]}`], m[2]);
  if ((m = path.match(/^\/phashboard\/([^/]+)$/))) return phashboardMeta(m[1]);
  if ((m = path.match(/^\/donut-tour\/([^/]+)\/([^/]+)$/))) {
    const city = titleCase(safeDecode(m[1]));
    const state = safeDecode(m[2]).toUpperCase();
    return {
      ...STATIC_PAGES["/donut-tour"],
      title: `donut shops in ${city}, ${state}`,
      description: `Donut shops in ${city}, ${state} on a map, with ratings, reviews and locations from Yelp.`,
    };
  }
  // the server and BuildDetail know whether the slug exists; until then, the section
  if ((m = path.match(/^\/builds\/([^/]+)$/))) return { ...STATIC_PAGES["/builds"], title: `${safeDecode(m[1])} · build log` };
  if (path === "/admin" || path.startsWith("/admin/")) {
    return page("admin", "kpow.xyz admin.", CARDS.home, { noindex: true });
  }
  return NOT_FOUND;
}

function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

// ------------------------------------------------------------------ build log

/** The fields of a builds.json entry this needs */
export interface BuildLike {
  slug: string;
  title: string;
  summary: string;
  hero?: string | null;
}

/** A build log entry; `null` (unknown slug) is a 404. */
export function buildMeta(build: BuildLike | null, heroSize?: { w: number; h: number }): PageMeta {
  if (!build) return NOT_FOUND;
  return {
    title: `${build.title} · build log`,
    description: build.summary,
    image: build.hero ? { src: build.hero, ...heroSize, alt: build.title } : CARDS.builds,
    type: "article",
  };
}

// ------------------------------------------------------------------ k-shows

/** The fields of /api/showz this needs */
export interface ShowzLike {
  base: string;
  nights: { date: string; artists: string[]; venue?: string | null; clips: { id: string; artist?: string | null; w: number; h: number }[] }[];
}

/** /shows with the real numbers; the image is a still from the newest night with a landscape clip. */
export function showsMeta(data: ShowzLike | null | undefined): PageMeta {
  const base = STATIC_PAGES["/shows"];
  if (!data?.nights.length) return base;
  const nights = data.nights;
  const clips = nights.reduce((n, x) => n + x.clips.length, 0);
  const bands = new Set(nights.flatMap((n) => n.clips.map((c) => c.artist).filter(Boolean))).size;
  const first = nights.reduce((a, n) => (n.date < a ? n.date : a), nights[0].date).slice(0, 4);
  const newest = [...nights].sort((a, b) => b.date.localeCompare(a.date)).find((n) => n.clips.some((c) => c.w > c.h));
  const clip = newest?.clips.find((c) => c.w > c.h);
  return {
    ...base,
    description: `${nights.length} nights, ${clips} clips, ${bands} bands since ${first}. Every night I pointed a phone at a stage: the numbers, then the story, with a map that follows along.`,
    image: clip
      ? { src: `${data.base}/clips/${clip.id}.full.jpg`, w: clip.w, h: clip.h, alt: `${clip.artist ?? "A band"} at ${newest!.venue ?? "a show"}` }
      : base.image,
  };
}

// ------------------------------------------------------------------ phashboard

export interface PhashSummary {
  shows: number;
  years_span: number;
  hours: number;
  unique_songs: number;
  venues: number;
}

/** /phashboard and its tabs, with the summary numbers once they're known. The page shows the overview for an unknown tab, so that canonicalizes to /phashboard. */
export function phashboardMeta(tab?: string, s?: PhashSummary | Record<string, any> | null, pf?: { games: number } | Record<string, any> | null): PageMeta {
  const base = STATIC_PAGES["/phashboard"];
  const label = tab && PHASHBOARD_TABS[tab];
  const description = s
    ? `${s.shows} Phish shows over ${s.years_span} years: ${s.hours} hours, ${s.unique_songs} different songs, ${s.venues} venues${pf ? `, and ${pf.games} PhantasyFish games` : ""}.`
    : base.description;
  return { ...base, title: label ? `${label} · phashboard` : base.title, description, ...(label ? {} : { path: "/phashboard" }) };
}

// ------------------------------------------------------------------ rendering

export function fullTitle(meta: PageMeta) {
  return meta.title === HOME.title ? `${SITE.name} · ${HOME.title}` : `${meta.title} · ${SITE.name}`;
}

export function absoluteUrl(src: string, origin: string) {
  return /^https?:\/\//.test(src) ? src : `${origin}${src.startsWith("/") ? "" : "/"}${src}`;
}

/** The tags, as [tag, attrs] pairs, in head order. Shared by the server's HTML and the client's <Helmet>. */
export function headTags(meta: PageMeta, path: string, origin: string): { tag: "meta" | "link"; attrs: Record<string, string> }[] {
  const title = fullTitle(meta);
  const url = absoluteUrl(meta.path ?? (path.length > 1 ? path.replace(/\/+$/, "") : path), SITE.origin);
  const img = meta.image;
  const imgUrl = absoluteUrl(img.src, origin);
  const name = (name: string, content: string) => ({ tag: "meta" as const, attrs: { name, content } });
  const prop = (property: string, content: string) => ({ tag: "meta" as const, attrs: { property, content } });
  return [
    ...(meta.description ? [name("description", meta.description)] : []),
    ...(meta.noindex ? [name("robots", "noindex, nofollow")] : [{ tag: "link" as const, attrs: { rel: "canonical", href: url } }]),
    prop("og:site_name", SITE.name),
    prop("og:locale", SITE.locale),
    prop("og:type", meta.type ?? "website"),
    prop("og:title", title),
    ...(meta.description ? [prop("og:description", meta.description)] : []),
    prop("og:url", url),
    prop("og:image", imgUrl),
    ...(imgUrl.startsWith("https:") ? [prop("og:image:secure_url", imgUrl)] : []),
    ...(img.w && img.h ? [prop("og:image:width", String(img.w)), prop("og:image:height", String(img.h))] : []),
    ...(img.alt ? [prop("og:image:alt", img.alt)] : []),
    name("twitter:card", "summary_large_image"),
    name("twitter:title", title),
    ...(meta.description ? [name("twitter:description", meta.description)] : []),
    name("twitter:image", imgUrl),
    ...(img.alt ? [name("twitter:image:alt", img.alt)] : []),
  ];
}
