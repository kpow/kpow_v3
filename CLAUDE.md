# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
```bash
npm run dev          # Start development server (Vite frontend + tsx backend)
npm run build        # Build for production (Vite + ESBuild)
npm start            # Run production server
npm run check        # TypeScript type checking
```

### Database
```bash
npm run db:push      # Update database schema using Drizzle Kit
```

## Architecture Overview

This is a full-stack personal digital footprint platform that aggregates data from multiple APIs:

### Frontend (`/client`)
- **React 18 + TypeScript** with Vite
- **Tailwind CSS + ShadCN UI** for styling and components
- **TanStack Query** for data fetching and caching
- **Wouter** for client-side routing
- **Leaflet** for interactive maps
- **Recharts** for data visualization

### Backend (`/server`)
- **Express.js** API server
- **Drizzle ORM** with PostgreSQL (DigitalOcean managed)
- **Passport.js** for session-based authentication
- Multiple API integrations organized by route:
  - `/api/phish/*` - Phish.net API v5
  - `/api/lastfm/*` - Last.fm music data
  - `/api/goodreads/*` - Goodreads book data
  - `/api/yelp/*` - Yelp Fusion API
  - `/api/feedbin/*` - RSS feed integration
  - `/api/showz*` - k-shows concert clips (see below)
  - `/api/youtube/*` - YouTube API
  - `/api/github/*` - GitHub activity
  - `/api/admin/*` - Protected admin routes

### Database Schema (`/db/schema.ts`)
Main tables:
- `users` - Authentication with approval system
- `artists`, `songs`, `plays` - Music tracking itunes
- `books`, `authors`, `shelves` - Book tracking from Goodreads
- Many-to-many: `bookAuthors`, `bookShelves`
- `showz_nights`, `showz_clips`, `showz_meta` - k-shows (raw SQL in `server/lib/showz-store.ts`, not in the Drizzle schema)

### Key Features
1. **Donut Shop Explorer** - Interactive map-based search using Yelp API
2. **Phashboard** - Phish show analytics and venue statistics
3. **Music Tracking** - Last.fm integration with play history
4. **Book Management** - Goodreads integration with shelves
5. **k-shows** - concert phone clips: `/shows` and the home carousel
6. **Admin Panel** - one dark admin at `/admin` (Shows, Books, Music)

### Development Notes
- Environment variables required for all API integrations (see README)
- Authentication uses Express sessions with PostgreSQL store
- All API routes proxy external services to protect keys
- Frontend routes defined in `/client/src/App.tsx`
- Shared TypeScript types in `/types` directory
## Build Log (`/builds`)

The only section with **no database behind it**. Content lives as markdown +
committed images in a separate repo, https://github.com/kpow/kpow-buildlog, and is
baked in at build time.

```
kpow-buildlog (markdown + jpgs)
  -> scripts/sync-buildlog.mjs      (runs first in `npm run build`)
  -> client/public/builds.json      + client/public/buildlog/<slug>/media/
  -> React reads /builds.json
```

- `npm run buildlog` runs the sync on its own. It prefers `BUILDLOG_PATH`, then a
  local checkout beside this repo, then a shallow clone of `BUILDLOG_URL` — so
  production always takes the latest push and a content push republishes the site.
- Both outputs are generated and gitignored. Never hand-edit `builds.json`.
- Routes: `/builds`, `/builds/recently`, `/builds/:slug` (recently must stay
  ordered before `:slug` in `App.tsx` — wouter takes the first match).
- Styling is in `client/src/components/buildlog/buildlog.css`. The section's
  gemtone purple is **scoped** — every rule sits under `.buildlog`, so the rest of
  the site keeps its blue accent. Keep it that way.
- Design source of truth: `comps/design-b-light-photos.html` in the content repo.

## k-shows (`/shows`, `/admin/shows`)

Concert phone clips, a band tagged on every clip. Replaced the old Instagram
feed (Sep 2026). The data lives in Postgres; the video is made on the owner's
Mac by the **showz namer** (`~/projects/showz/namer`, not in this repo; its
README is the how-to).

```
iPhone -> namer on the Mac (import, name, publish)
            |  video: 720p + stills -> kfiles Space, showz/clips/<id>.{mp4,jpg,full.jpg}
            |  data:  PUT /api/showz/sync (Bearer SHOWZ_SYNC_TOKEN, rev-checked)
            v
          Postgres showz_nights / showz_clips  <- PATCH from /admin/shows
            -> GET /api/showz (public JSON, 60 s cache) -> /shows + home carousel
```

- `server/lib/showz-store.ts` owns the tables (created on first use with
  CREATE TABLE IF NOT EXISTS). **Never run `npm run db:push`**: it would offer
  to drop the session table, and these tables aren't in `db/schema.ts`.
- `server/routes/showz-routes.ts`: `GET /api/showz` (public; falls back to the
  Space's `showz/shows.json`, read from the *origin* not the CDN, whose edge
  caches for an hour), `GET/PATCH /api/admin/showz*` (logged-in approved
  user), `GET/PUT /api/showz/sync` (namer; 409 if `rev` moved, writes only
  changed rows). `server/index.ts` lets only that sync path take a 5 MB body.
- Public: a clip is shown only if `published` (its media is on the CDN), the
  night isn't `hidden`, and it has a band that isn't `(not a show)`. `notes` are
  private and never leave the admin.
- Client: `lib/showz.ts` (fetch + map a night to the old Instagram post shape),
  `lib/showz-stats.ts` (numbers, runs, records for `/shows`),
  `components/showz/` (ShowCard/ShowCarousel/ShowModal keep the Instagram look
  on purpose; `journal/` is the `/shows` page), `components/admin/shows/` (the
  admin; design comps in `~/projects/showz/comps/admin/option-c-stage.html`).
- `/admin` is a dark card: `Layout.tsx` skips its white card on `/admin/*`, and
  dark styles are scoped under `.admin-dark` in `index.css`. Add a section in
  `SECTIONS` in `pages/AdminPage.tsx`.
- Env: `SHOWZ_SYNC_TOKEN` (required for the namer), optional `SHOWZ_JSON_URL`,
  `SHOWZ_CDN_BASE`. Forgot the admin password? `node --env-file=.env scripts/set-password.mjs`.
- DigitalOcean replaces a 503 from the app with its own "failed to forward"
  504 page; a 504 on `/api/showz/sync` usually means the token isn't set.
