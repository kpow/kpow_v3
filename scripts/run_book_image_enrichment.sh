#!/bin/bash

# Script to run the book cover image enrichment process
# Usage: ./run_book_image_enrichment.sh [batch_size]
# Example: ./run_book_image_enrichment.sh 10

# Default batch size
BATCH_SIZE=${1:-5}

echo "Running book cover image enrichment script with batch size: $BATCH_SIZE"

# Run the TypeScript script with appropriate node flags
# Use the correct path relative to the current directory
node --no-warnings --import tsx/esm scripts/enrich_book_images.ts $BATCH_SIZE

echo "Image enrichment process completed"