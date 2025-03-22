#!/bin/bash

# Script to test genre extraction for a specific Goodreads book

BOOK_URL="https://www.goodreads.com/book/show/5107.The_Catcher_in_the_Rye"

if [ "$1" != "" ]; then
  BOOK_URL=$1
fi

echo "Testing genre extraction for URL: $BOOK_URL"
node --import tsx scripts/test_genre_scraper.ts "$BOOK_URL"