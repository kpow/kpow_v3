# KPOW - Digital Content Platform

My coding playground and the begining of my post-singularity self.

## Tech Stack

- **Frontend**:
  - React with TypeScript
  - Tailwind CSS for styling
  - ShadcN UI components
  - React Query for data fetching
  - Wouter for routing
  - Date-fns for date formatting
  - Recharts for data visualizations

- **Backend**:
  - Express.js
  - Secure API integrations:
    - Phish.net API
    - Last.fm API
    - Goodreads API
    - Feedbin API
  - Drizzle ORM with PostgreSQL (optional)

## Features

### Show Statistics Dashboard
- Comprehensive show statistics
  - Total shows attended
  - Unique venues visited
  - Unique songs heard
- Interactive show cards with modal details
- Most visited venues tracking
- Responsive grid layout
- Modern UI with smooth animations

### Book Feed Integration
- Goodreads API integration
- Display of recently read books
- Book details including:
  - Cover images
  - Titles and authors
  - Ratings and reviews
  - Book descriptions
- Direct links to Goodreads pages
- Responsive book card layout
- Automatic HTML stripping from descriptions
- URL-based pagination:
  - Access specific pages via `/books/page/{number}`
  - Sharable page links
  - Browser history integration
  - Smooth page transitions

### Star Feed (Articles)
- Feedbin API integration
- Display of starred articles
- Article features:
  - Lead images
  - Titles and authors
  - Publication dates
  - Article excerpts
  - Source favicons
- Clickable cards linking to original articles
- Clean, modern card layout
- Responsive grid design
- URL-based pagination:
  - Access specific pages via `/starred-articles/page/{number}`
  - Sharable page links
  - Browser history integration
  - Smooth page transitions

### Recent Plays Integration
- Last.fm API integration
- Real-time music tracking
- Recently played tracks display
- Track information including:
  - Song titles
  - Artist names
  - Album artwork
  - Timestamps

### API Integrations
The application securely integrates with multiple APIs:
- Phish.net API v5 for show data and setlists
- Goodreads API for book tracking
- Feedbin API for article management
- Last.fm API for music tracking

Key features of the API integrations:
- Backend proxy for secure API key handling
- Proper date formatting using date-fns
- Efficient data transformation
- Error handling and fallbacks
- Rate limiting protection

## Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- PostgreSQL database (optional)
- API keys for:
  - Phish.net
  - Goodreads
  - Last.fm
  - Feedbin

## Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/kpow/kpow_v3.git
cd kpow
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your API keys:
   ```
   PHISH_API_KEY=your_phish_api_key
   LASTFM_API_KEY=your_lastfm_api_key
   GOODREADS_API_KEY=your_goodreads_api_key
   FEEDBIN_KEY=your_feedbin_key
   ```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`.

## Project Structure

```
├── client/                 # Frontend code
│   ├── public/            # Static assets
│   └── src/
│       ├── components/    # React components
│       │   ├── BookCard.tsx
│       │   ├── BookFeed.tsx
│       │   ├── ContentSection.tsx
│       │   ├── RecentPlays.tsx
│       │   └── ui/       # ShadcN UI components
│       ├── lib/
│       │   └── hooks/    # Custom hooks
│       └── pages/        # Page components
├── server/                # Backend code
│   ├── routes/           # API routes by integration
│   │   ├── phish-routes.ts      # Phish.net API routes
│   │   ├── lastfm-routes.ts     # Last.fm API routes
│   │   ├── goodreads-routes.ts  # Goodreads API routes
│   │   ├── feedbin-routes.ts    # Feedbin API routes
│   │   └── github-routes.ts     # GitHub API routes
│   ├── utils/            # Shared utilities
│   │   └── api-utils.ts  # Common API functions
│   ├── routes.ts         # Route registration
│   └── index.ts          # Server setup
└── theme.json            # Theme configuration
```

### API Integration Structure
The backend routes are organized by their respective API integrations:

- `phish-routes.ts`: Handles all Phish.net related endpoints
  - Show statistics
  - Setlist information
  - Venue data
  - Song occurrences

- `lastfm-routes.ts`: Last.fm integration
  - Recent tracks
  - Music listening data

- `goodreads-routes.ts`: Goodreads integration
  - Book listings
  - Reading progress
  - Book reviews

- `feedbin-routes.ts`: Feedbin RSS integration
  - Starred articles
  - Feed management

- `github-routes.ts`: GitHub integration
  - User profile data
  - Repository information


## Development Guidelines

- Use the existing shadcn + Tailwind CSS setup for styling
- Follow the component structure in `client/src/components`
- Maintain consistent styling using the theme configuration
- Use TypeScript for type safety
- Follow the established project structure
- Implement URL-based pagination for list views

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the production version
- `npm run check` - Run TypeScript type checking
- `npm start` - Start the production server
- `npm run db:push` - Push database schema changes (if using database)

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.