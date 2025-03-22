#!/bin/bash

# Script to run the book genre enrichment process

echo "Starting book genre enrichment..."

# Run the enrichment script with node and the proper ESM import flag
node --import tsx scripts/enrich_book_genres.ts

# Check if the script was successful
if [ $? -eq 0 ]; then
  echo "Book genre enrichment completed successfully!"
else
  echo "Book genre enrichment failed. Check the logs for details."
fi