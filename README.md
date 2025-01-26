# KPOW - Digital Content Platform

A modern web application for digital content and experiences, featuring a responsive design with interactive cards and dynamic content sections.

## Tech Stack

- **Frontend**:
  - React with TypeScript
  - Tailwind CSS for styling
  - ShadcN UI components
  - React Query for data fetching
  - Wouter for routing

- **Backend**:
  - Express.js
  - Drizzle ORM with PostgreSQL (optional)

## Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- PostgreSQL database (optional, only if using database features)

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

3. Set up images:
   - Create a `public` directory in the `client` folder if it doesn't exist
   - Copy the following images to `client/public/`:
     - battle.jpg
     - tunes.jpg
     - pmonk.jpg

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
│       ├── hooks/         # Custom React hooks
│       ├── lib/           # Utility functions
│       └── pages/         # Page components
├── server/                # Backend code
│   ├── routes.ts         # API routes
│   └── vite.ts           # Vite server configuration
├── db/                    # Database schemas and configurations
└── theme.json            # Theme configuration
```

## Features

- Responsive grid layout
- Interactive card components with hover effects
- Dynamic content sections
- Image carousels and galleries
- Modern UI with smooth animations
- TypeScript for type safety
- Integrated backend API
- Database support (optional)

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