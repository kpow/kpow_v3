git clone https://github.com/kpow/kpow_v3.git
cd kpow
npm install
```

2. Configure environment:
```bash
# API Keys
YELP_API_KEY=your_key
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