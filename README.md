# KPOW - Digital Content Platform

A comprehensive cross-domain media analytics platform featuring an advanced interactive Phish show exploration system with dynamic data retrieval and personalized music event tracking.

## Tech Stack

### Frontend
- React with TypeScript + Tailwind CSS
- ShadcN UI + Framer Motion
- React Query + Wouter
- Advanced data visualization with Recharts

### Backend
- Express.js with secure API integrations:
  - Phish.net API v5
  - Last.fm API
  - Goodreads API
  - Feedbin API
  - Instagram Graph API
- Drizzle ORM with PostgreSQL

## Core Features

### Advanced Show Analytics
- Comprehensive Phish show statistics dashboard
- Interactive venue exploration system
- Unique song tracking and analytics
- Dynamic setlist visualization
- Venue heat mapping and geographical insights

### Integrated Media Dashboard
- Real-time Last.fm music tracking
- Goodreads reading progress integration
- Feedbin article curation system
- Instagram feed integration
- Cross-platform content synchronization

### Interactive Features
- Modal-based content exploration
- Infinite scroll implementation
- Responsive carousel controls
- Horizontal media browsing
- Dynamic data retrieval system

### API Integration System
- Secure multi-API proxy system
- Rate limiting protection
- Efficient data transformation pipeline
- Comprehensive error handling
- Cross-platform data synchronization

## Quick Start

1. Clone and install:
```bash
git clone https://github.com/kpow/kpow_v3.git
cd kpow
npm install
```

2. Configure environment:
```bash
# API Keys
PHISH_API_KEY=your_key
LASTFM_API_KEY=your_key
GOODREADS_API_KEY=your_key
FEEDBIN_KEY=your_key
INSTAGRAM_ACCESS_TOKEN=your_token

# Database Configuration
DATABASE_URL=your_postgresql_url

# Optional Configuration
NODE_ENV=development
PORT=5000
```

3. Start development:
```bash
npm run dev
```

## Project Structure

```
├── client/                 # Frontend code
│   └── src/
│       ├── components/    # React components
│       ├── lib/          # Utilities
│       └── pages/        # Page components
├── server/                # Backend code
│   ├── routes/           # API routes
│   └── utils/            # Shared utilities
└── theme.json            # Theme configuration
```

## Available Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm start` - Production server
- `npm run db:push` - Database schema updates

## License

MIT License - see LICENSE file for details.