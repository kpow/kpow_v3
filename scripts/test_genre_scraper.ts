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
    
    // Fetch the page HTML
    const response = await axios.get(fullUrl);
    console.log("Page fetched successfully");
    
    // Load the HTML into cheerio
    const $ = cheerio.load(response.data);
    
    // Find the genres list element
    const genresList = $('ul[aria-label="Top genres for this book"]');
    
    // Check if the genres list was found
    if (genresList.length === 0) {
      console.log("No genres list found on the page");
      console.log("Searching for alternative elements that might contain genres...");
      
      // Try to find any elements that might have genre information
      const shelvesList = $('.elementList .left');
      if (shelvesList.length > 0) {
        console.log("Found potential alternative genre elements:");
        shelvesList.each((i, el) => {
          console.log(`  ${i+1}: ${$(el).text().trim()}`);
        });
      }
      
      return [];
    }
    
    // Extract genres from list items
    const genres: string[] = [];
    genresList.find('li').each((i, element) => {
      const genreText = $(element).text().trim();
      genres.push(genreText);
      console.log(`  Genre ${i+1}: ${genreText}`);
    });
    
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