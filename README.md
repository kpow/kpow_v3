# KPOW - Digital Content Platform

A comprehensive Phish show statistics and analysis web application that provides deep insights into concert performances using the Phish.net API, enabling fans to explore and understand the band's live music history.

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
  - Drizzle ORM with PostgreSQL (optional)

- **APIs**:
  - Phish.net API v5 for show data and setlists
    - Show attendance information
    - Venue statistics
    - Setlist data
    - Song statistics

## Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- PostgreSQL database (optional, only if using database features)
- Phish.net API key (required for show data)

## Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/kpow.git
cd kpow
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add your Phish.net API key:
   ```
   VITE_PHISH_API_KEY=your_api_key_here
   ```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`.

## Features

- Comprehensive show statistics
  - Total shows attended
  - Unique venues visited
  - Unique songs heard
- Interactive show cards with modal details
- Most visited venues tracking
- Responsive grid layout
- Modern UI with smooth animations


## Project Structure

```
├── client/                 # Frontend code
│   ├── public/            # Static assets
│   └── src/
│       ├── components/    # React components
│       │   ├── show-card.tsx
│       │   ├── show-details-modal.tsx
│       │   └── ui/       # ShadcN UI components
│       ├── lib/
│       │   └── phish-api.ts  # Phish.net API integration
│       └── pages/         # Page components
├── server/                # Backend code
└── theme.json            # Theme configuration
```

## API Integration

The application uses the Phish.net API v5 to fetch:
- Show attendance data
- Venue information
- Setlist details
- Song statistics

API calls are handled through the `phish-api.ts` module, which provides:
- Pagination support for shows and venues
- Error handling and data validation
- Rate limiting protection
- Efficient batching of setlist requests

## Development Guidelines

- Use the existing shadcn + Tailwind CSS setup for styling
- Follow the component structure in `client/src/components`
- Maintain consistent styling using the theme configuration
- Use TypeScript for type safety
- Follow the established project structure

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