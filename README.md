# kpow.xyz

**Into the singularity.** One site that collects everything I listen to, read,
watch, build and go see: ten years of music plays, every Phish show, phone clips
from every concert, a shelf of books, a devlog of LED gadgets and robots, and a
donut map of America.

Live at **[kpow.xyz](https://kpow.xyz)**.

```
React 18 + Vite + Tailwind ── Express ── Postgres (DigitalOcean)
                                 │
   Spotify · Last.fm · phish.net · phish.in · PhantasyFish · Yelp
   YouTube · Feedbin · GitHub · Goodreads · DigitalOcean Spaces
```

---

## Contents

1. [What's on the site](#whats-on-the-site)
2. [Quick start](#quick-start)
3. [Environment variables](#environment-variables)
4. [How it fits together](#how-it-fits-together)
5. [Project layout](#project-layout)
6. [Scripts](#scripts)
7. [Deploying](#deploying)
8. [Ground rules](#ground-rules)

---

## What's on the site

### Things I follow

| Route | What it is | Data from |
|---|---|---|
| `/` | Home: projects, setlist game, concert carousel, starred articles, now playing, books, donuts, GitHub | everything below |
| `/itunez` | Years of listening: top artists and songs by year | Apple Music export + Last.fm + Spotify, merged in Postgres |
| `/shows` | **k-shows**: phone clips from every concert, with stats, a journal and a map | Postgres + video on a DigitalOcean Space |
| `/phashboard/:tab?` | Phish shows I've been to, setlists, songs, venues, on-this-day, PhantasyFish games | phish.net, phish.in, phantasyfish.net |
| `/books` | Reading shelves, ratings and reviews | Postgres (imported from Goodreads) |
| `/starred-articles` | Everything I've starred in my feed reader | Feedbin |
| `/videos` | Latest videos from channels I follow | YouTube Data API |
| `/donut-tour/:city?/:state?` | Donut shops anywhere on a map | Yelp Fusion |

### Things I build

The **build log** is a devlog for every hardware project. It has no database:
it's markdown in [kpow-buildlog](https://github.com/kpow/kpow-buildlog), baked in at build time.

| Route | What it is |
|---|---|
| `/builds`, `/builds/recently`, `/builds/:slug` | Build log: all projects, newest entries, one project |
| `/vizbot` (+ `/guide`, `/touch`, `/web`, `/releases`) | **vizBot**: open-source firmware that gives a small ESP32 screen a face. Releases come from GitHub |
| `/vizspot/guide`, `/vizspot/controls` | **vizSpot**: a 64×64 LED board that shows what's playing on Spotify. Pairs from your phone through an encrypted relay |
| `/vizmac` (+ `/guide`, `/controller`) | **vizMac**: one knob for the whole desk (keyboard lighting, Spotify, focus timer, WLED) |
| `/8x8` (+ `/guide`) | **8x8 labz**: a handheld sketchbook for 8×8 pixel icons on a real LED matrix |
| `/led` | WLED desktop LED art |

### Everything else

`/about`, `/privacy`, `/battle` (hero vs villain game), `/cube` (a static three.js toy),
`/pmonk` (a memorial page: please don't change its copy), `/auth`, and `/admin`.

### Admin

`/admin` is one dark panel behind a login (new accounts need approval). Sections:

- **Shows**: edit k-shows nights, bands and venues
- **Books**: add and edit books, refine covers, import from Goodreads
- **Music**: Spotify + Last.fm play sync, connect Spotify, album lookup
- **Phashboard**: build times and "Rebuild now"

Locked out? `node --env-file=.env scripts/set-password.mjs`.

---

## Quick start

Needs Node 20+ (developed on 24) and a Postgres database.

```bash
git clone https://github.com/kpow/kpow_v3.git
cd kpow_v3
npm install
```

1. Create `.env` in the repo root with at least `DATABASE_URL` and `SESSION_SECRET`
   (see [Environment variables](#environment-variables)).
2. Start the dev server (Express + Vite on one port):

   ```bash
   npm run dev
   ```

3. Open <http://localhost:5000>.

Pages whose API key is missing just show empty or error states; the rest of the
site still runs. The build log needs `npm run buildlog` once to fetch its content.

---

## Environment variables

`.env` is read by `npm run dev` (`tsx --env-file=.env`) and never committed.

### Required

| Variable | Used for |
|---|---|
| `DATABASE_URL` | Postgres (TLS on, self-signed certs accepted for DigitalOcean) |
| `SESSION_SECRET` | Express sessions (stored in Postgres) |

### Per feature

| Variable | Feature |
|---|---|
| `LASTFM_API_KEY` | Music: scrobbles + album lookups |
| `SPOTIFY_CLIENT_ID` | Music: recently played (PKCE app, no secret; connect once at `/admin/music`) |
| `SPOTIFY_REDIRECT_URI` | Optional override for the Spotify callback |
| `MUSIC_SYNC` | `on` / `off`: force the 30-minute play sync (on by default in production) |
| `PHISH_API_KEY` | Phashboard + home setlist game |
| `PHASHBOARD_PHISHNET_USER`, `PHASHBOARD_PF_USER`, `PHANTASYFISH_URL` | Optional Phashboard overrides |
| `SHOWZ_SYNC_TOKEN` | k-shows: bearer token for the namer's sync |
| `SHOWZ_JSON_URL`, `SHOWZ_CDN_BASE` | Optional k-shows overrides |
| `YELP_API_KEY` | Donut tour |
| `YOUTUBE_API_KEY` | Videos |
| `FEEDBIN_KEY` | Starred articles |
| `GITHUB_TOKEN` | GitHub section + vizBot releases (optional, raises the rate limit) |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Contact form email |
| `BUILDLOG_PATH`, `BUILDLOG_URL` | Where the build log sync reads content |
| `VIZBRAIN_INVITES`, `VIZBRAIN_INSTALLER_URL`, `VIZBRAIN_LINK_BASE` | vizbrain invite-only install links (`/vb/<code>`) |
| `SITE_URL` | Origin for absolute share-image URLs |
| `PORT` | Defaults to `5000` |

---

## How it fits together

### One server, one port

`server/index.ts` runs Express. In dev it mounts Vite as middleware; in
production it serves the built client from `dist/`. Every external API goes
through `/api/*` so keys stay on the server.

### Cache everything upstream

Page views never fan out to third-party APIs:

- **Music** plays live in Postgres. A background job pulls Spotify and Last.fm
  every 30 minutes and merges duplicates. `GET /api/music/plays` is a public
  mirror other projects read instead of hitting Spotify.
- **Phashboard** builds five data parts on the server, stores them in Postgres,
  and rebuilds anything older than 6 hours in the background.
- **k-shows** data lives in Postgres; the video lives on a DigitalOcean Space.
  A Mac app (the "namer") imports and publishes clips, then syncs via
  `PUT /api/showz/sync`.
- **vizBot releases** and the **vizbrain installer** are cached from GitHub.

### Build log at build time

```
kpow-buildlog (markdown + images)
  → scripts/sync-buildlog.mjs   (first step of npm run build)
  → client/public/builds.json + client/public/buildlog/<slug>/media/
  → React reads /builds.json
```

A push to the content repo plus a redeploy publishes new entries.

### Link previews without JS

Crawlers (iMessage, Slack, Discord, X) don't run JavaScript, so
`server/page-meta.ts` writes each page's title, description and share image into
`index.html` before sending it. Copy lives in `client/src/lib/page-meta.ts`;
the server also serves `/sitemap.xml` and returns a real 404 for unknown routes.

---

## Project layout

```
client/
  public/            static files: og/ share cards, vizspot/ pairing page, cube/
  src/
    App.tsx          every route (wouter)
    pages/           one file per page
    components/      grouped by feature: showz/, phashboard/, buildlog/,
                     vizbot/, labz/, admin/, home/, donuts/, ui/ (shadcn) …
    lib/             fetchers, stats, page-meta.ts
server/
  index.ts           Express entry
  routes.ts          registers every route module
  routes/            one file per API (music, showz, phashboard, vizspot …)
  lib/               music/ sync + merge, phashboard/ builder, showz-store.ts
  page-meta.ts       server-side <head> tags + sitemap
db/
  schema.ts          Drizzle schema (users, music, books)
scripts/             build log sync, og cards, password reset, data migrations
types/               shared TypeScript types
```

---

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Sync build log → Vite build → bundle server |
| `npm start` | Run the production build |
| `npm run check` | TypeScript type check |
| `npm run buildlog` | Sync the build log content only |
| `node scripts/check-page-meta.mjs http://localhost:5000` | Check every route the way a crawler sees it |
| `node scripts/og-cards/serve.mjs` | Redraw the 1200×630 share cards |
| `node --env-file=.env scripts/set-password.mjs` | Reset an admin password |

---

## Deploying

Runs on **DigitalOcean App Platform**, deploying `main` on every push.
Health check: `GET /api/health`. Database is DigitalOcean managed Postgres;
k-shows media is on a DigitalOcean Space behind its CDN.

---

## Ground rules

- **Never run `npm run db:push`.** Several tables (music columns, k-shows,
  Phashboard, vizSpot) are created by the app with `CREATE TABLE IF NOT EXISTS`
  and aren't in `db/schema.ts`, and drizzle-kit offers to drop the session table.
- **Add a route in two places:** `client/src/App.tsx` and `STATIC_PAGES` in
  `client/src/lib/page-meta.ts`. Otherwise the server sends it as a 404.
- **Specific routes before params** in `App.tsx` (`/builds/recently` before
  `/builds/:slug`): wouter takes the first match.
- **Scoped styles:** build log, Phashboard and admin CSS each sit under their own
  class (`.buildlog`, `.phashboard`, `.admin-dark`). Keep it that way.
- **No Spotify calls in a request path.** The Spotify app is shared and rate limited.

More detail for each feature lives in [CLAUDE.md](CLAUDE.md).

## License

MIT
