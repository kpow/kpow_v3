import axios from "axios";
import * as cheerio from "cheerio";
import { fileURLToPath } from 'url';

/**
 * Test script to verify Goodreads genre scraping functionality
 */
async function testGenreScraper(url: string) {
  console.log(`Testing genre scraping with URL: ${url}`);
  
  try {
    // Extract the Goodreads ID if a full URL is provided
    const goodreadsId = extractGoodreadsIdFromUrl(url);
    
    // Build the full URL if needed
    const fullUrl = goodreadsId 
      ? `https://www.goodreads.com/book/show/${goodreadsId}`
      : url;
    
    console.log(`Fetching page: ${fullUrl}`);
    
    // Fetch the page HTML with a user agent to ensure we get the full page
    const response = await axios.get(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });
    console.log("Page fetched successfully");
    
    // Load the HTML into cheerio
    const $ = cheerio.load(response.data);
    
    // Based on the screenshots provided, look for div with data-testid="genresList"
    const genresContainer = $('div[data-testid="genresList"]');
    console.log(`Found genresList container: ${genresContainer.length > 0 ? 'Yes' : 'No'}`);
    
    // Try to find the specific ul with aria-label="Top genres for this book"
    const genresList = $('ul.CollapsableList[aria-label="Top genres for this book"]');
    console.log(`Found genres list: ${genresList.length > 0 ? 'Yes' : 'No'}`);
    
    // Look for genre buttons inside the container
    const genreButtons = $('.BookPageMetadataSection__genreButton');
    console.log(`Found genre buttons: ${genreButtons.length}`);
    
    // Extract genres from the genre buttons
    const genres: string[] = [];
    
    // Method 1: Look for Button__labelItem spans within the genre buttons
    genreButtons.find('.Button__labelItem').each((i, element) => {
      const genreText = $(element).text().trim();
      if (genreText && !genres.includes(genreText)) {
        genres.push(genreText);
        console.log(`  Genre ${genres.length}: ${genreText}`);
      }
    });
    
    // If we didn't find genres with the first method, try method 2
    if (genres.length === 0) {
      // Method 2: Find all links in the genres container that point to genre pages
      genresContainer.find('a[href*="/genres/"]').each((i, element) => {
        const genreText = $(element).text().trim();
        if (genreText && !genres.includes(genreText)) {
          genres.push(genreText);
          console.log(`  Genre ${genres.length}: ${genreText}`);
        }
      });
    }
    
    // If we still didn't find genres, try a more general approach
    if (genres.length === 0) {
      // Method 3: Look for any anchors with href containing "/genres/"
      $('a[href*="/genres/"]').each((i, element) => {
        const genreText = $(element).text().trim();
        if (genreText && !genres.includes(genreText)) {
          genres.push(genreText);
          console.log(`  Genre ${genres.length}: ${genreText} (fallback method)`);
        }
      });
    }
    
    console.log(`Found ${genres.length} genres`);
    return genres;
    
  } catch (error) {
    console.error("Error scraping genres:", error);
    throw error;
  }
}

/**
 * Extract the Goodreads book ID from a URL
 */
function extractGoodreadsIdFromUrl(url: string): string | null {
  if (!url) return null;
  
  // Try to match patterns like:
  // https://www.goodreads.com/book/show/12345.Book_Title
  // https://www.goodreads.com/book/show/12345-book-title
  const matches = url.match(/goodreads\.com\/book\/show\/(\d+)(?:[.-]|$)/);
  
  return matches ? matches[1] : null;
}

// Check if this file is being run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  // Check if URL is provided as a command line argument
  const testUrl = process.argv[2] || 'https://www.goodreads.com/book/show/5107.The_Catcher_in_the_Rye';
  
  testGenreScraper(testUrl)
    .then((genres) => {
      console.log("Test completed successfully");
      if (genres.length > 0) {
        console.log("Found genres:", genres.join(", "));
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error("Test failed:", error);
      process.exit(1);
    });
}

// Export for testing or importing in other modules
export { testGenreScraper };