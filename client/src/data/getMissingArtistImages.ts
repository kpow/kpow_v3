
#!/usr/bin/env ts-node
import fs from "fs";
import axios from "axios";

interface ArtistImage {
  key: string;
  url: string;
}

// Add delay function
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchArtistImage(artist: string): Promise<string> {
  // Construct the iTunes API URL
  const query = encodeURIComponent(artist);
  const apiUrl = `https://itunes.apple.com/search?term=${query}&entity=musicArtist&limit=1`;
  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    if (data.resultCount > 0) {
      // Return artworkUrl100 if available; otherwise an empty string
      return data.results[0].artworkUrl100 || "";
    }
  } catch (error) {
    console.error(`Error fetching image for artist "${artist}":`, error);
  }
  return "";
}

async function main() {
  // Updated input and output file names
  const inputFile = "missingArtistImages.json";
  const outputFile = "ArtistImages.json";

  // Read the input file and create an array of artist names (one per line)
  const fileContent = fs.readFileSync(inputFile, "utf-8");
  const artists = fileContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const results: ArtistImage[] = [];

  // Process each artist sequentially with delay
  for (const artist of artists) {
    console.log(`Fetching image for artist: ${artist}`);
    const imageUrl = await fetchArtistImage(artist);
    results.push({ key: artist, url: imageUrl });

    // Update delay to 1000ms between requests
    await delay(100);
  }

  // Write the resulting JSON array to the output file
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`Artist images cache saved to ${outputFile}`);
}

main().catch((error) => console.error(error));
