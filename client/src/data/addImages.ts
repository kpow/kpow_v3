#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import { stringify } from 'csv-stringify';

// Import the artist images from the JavaScript file.
// Ensure the file path is correct relative to this script.
import artistImages from './ArtistImagesCache.js';

interface CSVRow {
  "Song Name": string;
  "Album Name": string;
  "Container Album Name": string;
  "Container Type": string;
  "End Position In Milliseconds": string;
  "End Reason Type": string;
  "Event End Timestamp": string;
  "Event Start Timestamp": string;
  "Event Type": string;
  "Feature Name": string;
  "Media Duration In Milliseconds": string;
  "Play Duration Milliseconds": string;
  "Artist Name": string;
  // New column to store the image URL.
  "Artist Image"?: string;
}

function main() {
  // Hard-coded input and output file names.
  const inputCsv = './kpow-apple-music-plays-with-artists.csv';
  const outputCsv = './output.csv';

  // Build a lookup map for artist images (case-insensitive).
  const imageMap: { [artist: string]: string } = {};
  for (const entry of artistImages) {
    imageMap[entry.key.toLowerCase()] = entry.url;
  }

  // Set to collect artist names for which no image was found.
  const missingArtists = new Set<string>();
  const rows: CSVRow[] = [];

  // Read the CSV file.
  fs.createReadStream(inputCsv)
    .pipe(csvParser())
    .on('data', (data: CSVRow) => {
      const artistName = data["Artist Name"];
      if (artistName) {
        // Lookup the image URL using lowercase for case-insensitive matching.
        const imageUrl = imageMap[artistName.toLowerCase()];
        if (imageUrl) {
          data["Artist Image"] = imageUrl;
        } else {
          data["Artist Image"] = "";
          missingArtists.add(artistName);
        }
      }
      rows.push(data);
    })
    .on('end', () => {
      // Write the updated rows to the output CSV file.
      stringify(rows, { header: true }, (err, output) => {
        if (err) {
          console.error("Error writing CSV:", err);
          return;
        }
        fs.writeFileSync(outputCsv, output);
        console.log(`CSV with artist images saved to ${outputCsv}`);

        // Report any artists missing images.
        if (missingArtists.size > 0) {
          console.log("\nArtists missing images:");
          missingArtists.forEach(artist => console.log(artist));
        } else {
          console.log("\nAll artists have corresponding images.");
        }
      });
    })
    .on('error', (error) => {
      console.error("Error processing CSV:", error);
    });
}

main();
