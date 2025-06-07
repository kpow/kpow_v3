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
- **Drizzle ORM** with PostgreSQL (Neon)
- **Passport.js** for session-based authentication
- Multiple API integrations organized by route:
  - `/api/phish/*` - Phish.net API v5
  - `/api/lastfm/*` - Last.fm music data
  - `/api/goodreads/*` - Goodreads book data
  - `/api/yelp/*` - Yelp Fusion API
  - `/api/feedbin/*` - RSS feed integration
  - `/api/instagram/*` - Instagram Graph API
  - `/api/youtube/*` - YouTube API
  - `/api/github/*` - GitHub activity
  - `/api/admin/*` - Protected admin routes

### Database Schema (`/db/schema.ts`)
Main tables:
- `users` - Authentication with approval system
- `artists`, `songs`, `plays` - Music tracking from Last.fm
- `books`, `authors`, `shelves` - Book tracking from Goodreads
- Many-to-many: `bookAuthors`, `bookShelves`

### Key Features
1. **Donut Shop Explorer** - Interactive map-based search using Yelp API
2. **Phashboard** - Phish show analytics and venue statistics
3. **Music Tracking** - Last.fm integration with play history
4. **Book Management** - Goodreads integration with shelves
5. **Admin Panel** - Protected content management at `/admin`

### Development Notes
- Environment variables required for all API integrations (see README)
- Authentication uses Express sessions with PostgreSQL store
- All API routes proxy external services to protect keys
- Frontend routes defined in `/client/src/App.tsx`
- Shared TypeScript types in `/types` directory