#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import { stringify } from 'csv-stringify';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the artist images from the JavaScript file
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
  "Artist Image"?: string;
}

function main() {
  // Define input and output paths relative to script location
  const inputCsv = path.join(__dirname, 'kpow-apple-music-plays-with-artists.csv');
  const outputCsv = path.join(__dirname, 'kpow-apple-music-plays-with-images.csv');

  // Verify input file exists
  if (!fs.existsSync(inputCsv)) {
    console.error(`Input file not found: ${inputCsv}`);
    process.exit(1);
  }

  // Build a lookup map for artist images (case-insensitive)
  console.log('Building artist image lookup map...');
  const imageMap: { [artist: string]: string } = {};
  for (const entry of artistImages) {
    imageMap[entry.key.toLowerCase()] = entry.url;
  }
  console.log(`Loaded ${Object.keys(imageMap).length} artist images`);

  // Set to collect artist names for which no image was found
  const missingArtists = new Set<string>();
  const rows: CSVRow[] = [];
  let processedCount = 0;

  // Read and process the CSV file
  console.log('Processing CSV file...');
  fs.createReadStream(inputCsv)
    .pipe(csvParser())
    .on('data', (data: CSVRow) => {
      const artistName = data["Artist Name"];
      if (artistName) {
        // Lookup the image URL using lowercase for case-insensitive matching
        const imageUrl = imageMap[artistName.toLowerCase()];
        if (imageUrl) {
          data["Artist Image"] = imageUrl;
        } else {
          data["Artist Image"] = "";
          missingArtists.add(artistName);
        }
      }
      rows.push(data);
      processedCount++;
      if (processedCount % 100 === 0) {
        console.log(`Processed ${processedCount} rows...`);
      }
    })
    .on('end', () => {
      // Write the updated rows to the output CSV file
      console.log('Writing output CSV file...');
      stringify(rows, { header: true }, (err, output) => {
        if (err) {
          console.error("Error writing CSV:", err);
          process.exit(1);
        }
        fs.writeFileSync(outputCsv, output);
        console.log(`CSV with artist images saved to ${outputCsv}`);

        // Report statistics
        console.log(`\nProcessing complete:`);
        console.log(`Total rows processed: ${processedCount}`);
        console.log(`Artists with images: ${processedCount - missingArtists.size}`);
        console.log(`Artists missing images: ${missingArtists.size}`);

        // Report missing artists if any
        if (missingArtists.size > 0) {
          console.log("\nArtists missing images:");
          const sortedMissing = Array.from(missingArtists).sort();
          sortedMissing.forEach(artist => console.log(`- ${artist}`));
        }
      });
    })
    .on('error', (error) => {
      console.error("Error processing CSV:", error);
      process.exit(1);
    });
}

main();