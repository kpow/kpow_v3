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
    
    // Find the genres list element using multiple possible selectors
    // Option 1: Original selector
    let genresList = $('ul[aria-label="Top genres for this book"]');
    
    // Option 2: Look for genre containers
    if (genresList.length === 0) {
      genresList = $('.bookGenreListRootContainer');
    }
    
    // Option 3: Look for genre links
    if (genresList.length === 0) {
      genresList = $('.bookPageGenreLink');
    }
    
    // Option 4: Try to find shelves section
    const shelvesList = $('.bookShelf');
    
    // Log the page structure to help diagnose
    console.log("Page structure analysis:");
    console.log(`- Number of elements with class 'bookGenreListRootContainer': ${$('.bookGenreListRootContainer').length}`);
    console.log(`- Number of elements with class 'bookPageGenreLink': ${$('.bookPageGenreLink').length}`);
    console.log(`- Number of elements with class 'bookShelf': ${$('.bookShelf').length}`);
    
    // Check if the genres list was found using original selector
    if (genresList.length === 0) {
      console.log("No genres list found with primary selectors");
      console.log("Searching for alternative elements that might contain genres...");
      
      // Search for any elements containing text like "genre" or "shelves"
      console.log("Searching for elements with text related to genres or shelves:");
      $('*:contains("Genre"), *:contains("genre"), *:contains("Shelve"), *:contains("shelve")').each((i, el) => {
        // Only log if the element itself has this text, not just its children
        const ownText = $(el).clone().children().remove().end().text().trim();
        if (ownText.match(/genre|Genre|shelve|Shelve/)) {
          console.log(`  Potential element ${i+1}: ${$(el).prop('tagName')} with text: "${ownText}"`);
          console.log(`    Classes: ${$(el).attr('class') || 'none'}`);
        }
      });
      
      // Try to find any links that might be genres
      console.log("Looking for links that might be genres:");
      $('a[href*="/genres/"]').each((i, el) => {
        console.log(`  Genre link ${i+1}: ${$(el).text().trim()}`);
      });
      
      // Extract and return any genres we found from links
      const genres: string[] = [];
      $('a[href*="/genres/"]').each((i, el) => {
        const genreText = $(el).text().trim();
        if (genreText && !genres.includes(genreText)) {
          genres.push(genreText);
        }
      });
      
      if (genres.length > 0) {
        console.log(`Found ${genres.length} genres from links:`);
        genres.forEach((genre, i) => console.log(`  Genre ${i+1}: ${genre}`));
        return genres;
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