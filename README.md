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
  - Framer Motion for animations

- **Backend**:
  - Express.js
  - Secure API integrations:
    - Phish.net API
    - Last.fm API
    - Goodreads API
    - Feedbin API
  - Drizzle ORM with PostgreSQL (optional)

## Features

### Hero Battle Game
- Interactive hero battle system featuring characters from various universes
- Two game modes:
  - Random Battle: Automatically selects random heroes
  - Manual Selection: Choose specific heroes to battle
- Comprehensive hero information display:
  - Collapsible sections for Power Stats, Biography, Appearance, Work, and Connections
  - Power Stats section expanded by default for quick reference
  - Dynamic image loading with battle outcome visualization
- Betting system:
  - Persistent betting stash using localStorage
  - Place bets on your chosen hero
  - Win/lose system based on hero power calculations
- Battle mechanics:
  - Intelligent power level calculations
  - Random factor for unpredictable outcomes
  - Clear winner display with visual feedback

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