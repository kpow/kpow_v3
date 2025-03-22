#!/bin/bash

# Script to run the book genre enrichment process
# Usage: ./run_book_genre_enrichment.sh [batch_size]
# Example: ./run_book_genre_enrichment.sh 10

# Default batch size
BATCH_SIZE=${1:-5}

echo "Running book genre enrichment script with batch size: $BATCH_SIZE"

# Run the TypeScript script with appropriate node flags
# Use the correct path relative to the current directory
node --no-warnings --import tsx/esm enrich_book_genres.ts $BATCH_SIZE

echo "Genre enrichment process completed"