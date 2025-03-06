import fs from "fs";
import axios from "axios";

interface ArtistImage {
  key: string;
  url: string;
}

// Exponential backoff delay
const getBackoffDelay = (retryCount: number): number => {
  const baseDelay = 60000; // Start with 60 seconds
  return Math.min(baseDelay * Math.pow(2, retryCount), 300000); // Max 5 minute delay
};

// Add delay function
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Clean artist name
const cleanArtistName = (name: string): string => {
  return name.replace(/["\[\]{}]/g, '').trim();
};

async function fetchArtistImage(artist: string, retryCount = 0): Promise<string | null> {
  const cleanedArtist = cleanArtistName(artist);
  if (!cleanedArtist) {
    console.log(`Skipping invalid artist name: "${artist}"`);
    return null;
  }

  // Construct the iTunes API URL
  const query = encodeURIComponent(cleanedArtist);
  const apiUrl = `https://itunes.apple.com/search?term=${query}&entity=musicArtist&limit=1`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (data.resultCount > 0) {
      let artworkUrl = data.results[0].artworkUrl100 || "";
      artworkUrl = artworkUrl.replace('100x100bb', '300x300bb');
      return artworkUrl;
    }
    return null;
  } catch (error: any) {
    if (error.response?.status === 403) {
      if (retryCount >= 5) {
        console.error(`Max retries reached for artist "${cleanedArtist}"`);
        return null;
      }
      const backoffDelay = getBackoffDelay(retryCount);
      console.log(`Rate limit hit for "${cleanedArtist}". Waiting ${backoffDelay/1000}s before retry ${retryCount + 1}/5`);
      await delay(backoffDelay);
      return fetchArtistImage(artist, retryCount + 1);
    }
    console.error(`Error fetching image for artist "${cleanedArtist}":`, error.message);
    return null;
  }
}

async function loadProgress(): Promise<Set<string>> {
  try {
    const data = fs.readFileSync('processed_artists.json', 'utf-8');
    return new Set(JSON.parse(data));
  } catch {
    return new Set();
  }
}

async function saveProgress(processed: Set<string>) {
  fs.writeFileSync('processed_artists.json', JSON.stringify(Array.from(processed)));
}

async function loadArtists(inputFile: string): Promise<string[]> {
  try {
    const fileContent = fs.readFileSync(inputFile, 'utf-8');
    try {
      // Try parsing as JSON array
      const parsed = JSON.parse(fileContent);
      if (Array.isArray(parsed)) {
        return parsed.filter(item => typeof item === 'string');
      }
      throw new Error('Input file must contain an array of strings');
    } catch (jsonError) {
      // If not JSON, treat as line-separated text
      return fileContent
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);
    }
  } catch (error) {
    console.error('Error reading input file:', error);
    return [];
  }
}

// Handle graceful shutdown
let isShuttingDown = false;
process.on('SIGINT', () => {
  console.log('\nGraceful shutdown initiated...');
  isShuttingDown = true;
});

async function main() {
  const isTestMode = process.argv.includes('--test');
  const inputFile = isTestMode ? "client/src/data/test-artists.json" : "missingArtistImages.json";
  const outputFile = isTestMode ? "test-artist-images.json" : "ArtistImages.json";
  const existingResults: ArtistImage[] = [];

  // Load existing results if any
  try {
    if (fs.existsSync(outputFile)) {
      const existingData = fs.readFileSync(outputFile, 'utf-8');
      existingResults.push(...JSON.parse(existingData));
      console.log(`Loaded ${existingResults.length} existing results`);
    }
  } catch (error) {
    console.warn('No existing results found or error loading them:', error);
  }

  const artists = await loadArtists(inputFile);
  if (!artists.length) {
    console.error('No artists found in input file');
    process.exit(1);
  }

  console.log(`Found ${artists.length} artists to process`);
  const processed = await loadProgress();

  // Process each artist
  let processedCount = 0;
  const totalArtists = artists.length;

  for (const artist of artists) {
    if (isShuttingDown) {
      console.log('Shutting down gracefully...');
      break;
    }

    if (processed.has(artist)) {
      console.log(`Skipping already processed artist: ${artist}`);
      processedCount++;
      continue;
    }

    const progress = ((processedCount / totalArtists) * 100).toFixed(2);
    console.log(`\nProgress: ${progress}% (${processedCount}/${totalArtists})`);
    console.log(`Processing artist: ${artist}`);

    const imageUrl = await fetchArtistImage(artist);

    if (imageUrl) {
      existingResults.push({ key: artist, url: imageUrl });
      fs.writeFileSync(outputFile, JSON.stringify(existingResults, null, 2));
      console.log(`Saved image URL for ${artist}`);
    }

    processed.add(artist);
    await saveProgress(processed);
    processedCount++;

    // Base delay between requests (3 seconds)
    const waitTime = 3000;
    console.log(`Waiting ${waitTime/1000} seconds before next request...`);
    await delay(waitTime);
  }

  console.log(`\nCompleted processing. Total results: ${existingResults.length}`);
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});