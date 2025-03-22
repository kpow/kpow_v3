#!/bin/bash

# Script to run genre scraper tests

echo "Running test for direct genre scraper..."
node --import tsx scripts/test_genre_scraper.ts

echo -e "\nRunning test for database book genre scraper..."
node --import tsx scripts/test_book_genre_scraper.ts