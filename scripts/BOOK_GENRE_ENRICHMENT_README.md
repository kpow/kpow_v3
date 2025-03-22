# Book Genre Enrichment Script

This script enriches the book database by scraping genre information from Goodreads book pages and adding them as "shelves" in the database.

## Overview

The script performs the following steps:
1. Retrieves books with Goodreads links from the database
2. Visits each book's Goodreads page
3. Extracts genre information from the page's HTML
4. Adds each genre as a "shelf" in the database if it doesn't already exist
5. Creates relationships between books and their genres

## Prerequisites

- Node.js 
- PostgreSQL database 
- The necessary npm packages are already installed

## Usage

### Running the Script

Use the provided shell script to run the enrichment process:

```bash
./run_book_genre_enrichment.sh [batch_size]
```

Where `[batch_size]` is an optional parameter to specify how many books to process in a single run. If not provided, the default batch size is 5.

Example:
```bash
./run_book_genre_enrichment.sh 10
```

### State Tracking

The script maintains state in a file called `genres_enrichment_state.json`, which allows it to:
- Resume from where it left off if interrupted
- Track progress on large collections
- Record errors for later review

The state file contains:
- `processedBooks`: Number of books processed so far
- `totalBooks`: Total number of books with Goodreads links
- `lastBookId`: ID of the last book processed
- `errors`: Array of errors encountered during processing

### Rate Limiting

The script includes a 1-second delay between processing books to avoid hitting Goodreads rate limits.

## Troubleshooting

If the script encounters errors, they will be recorded in the state file. Common issues include:

1. **Network errors**: Temporary connection issues with Goodreads
2. **HTML structure changes**: If Goodreads updates their page layout
3. **Rate limiting**: If too many requests are made in a short period

## Reset Process

To reset the enrichment process and start from the beginning:
- Delete the `genres_enrichment_state.json` file
- Run the script again

## Notes on Data Storage

- Genres are stored as "shelves" in the `shelves` table
- Book-genre relationships are stored in the `book_shelves` junction table
- Duplicate relationships are automatically handled (will not create duplicates)