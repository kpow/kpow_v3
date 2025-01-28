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
  - Secure Phish.net API integration
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
git clone https://github.com/kpow/kpow_v3.git
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
   PHISH_API_KEY=your_api_key_here
   ```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`.

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

### Backend API Integration
- Secure handling of Phish.net API calls
- Proper date formatting and validation
- Efficient data caching
- Rate limiting protection
- Error handling and validation

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
│       │   └── phish-api.ts  # API client
│       └── pages/         # Page components
├── server/                # Backend code
│   ├── routes.ts         # API routes
│   └── index.ts          # Server setup
└── theme.json            # Theme configuration
```

## API Integration

The application securely integrates with the Phish.net API v5 through a dedicated backend:
- Show attendance data
- Venue information
- Setlist details
- Song statistics

Key features of the API integration:
- Backend proxy for secure API key handling
- Proper date formatting using date-fns
- Efficient data transformation
- Error handling and fallbacks
- Rate limiting protection

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