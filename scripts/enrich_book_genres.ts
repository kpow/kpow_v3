import axios from "axios";
import * as cheerio from "cheerio";
import { db } from "../db/index.js";
import { books, shelves, bookShelves } from "../db/schema.js";
import { eq, and, count, gt, sql, asc } from "drizzle-orm";
import * as fs from 'fs';
import * as path from 'path';
import { setTimeout } from "timers/promises";
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Interface for tracking the script's state
interface EnrichmentState {
  processedBooks: number;
  totalBooks: number;
  lastBookId: number | null;
  errors: Array<{ bookId: number, url: string, error: string }>;
}

// Initial state
const initialState: EnrichmentState = {
  processedBooks: 0,
  totalBooks: 0,
  lastBookId: null,
  errors: []
};

// Max number of books to process in one run (can be adjusted)
const BATCH_SIZE = 10;

/**
 * Main function to enrich book genres from Goodreads
 */
async function enrichBookGenres() {
  console.log("Starting book genre enrichment from Goodreads");
  
  try {
    // Load previous state or create new one
    let state = await loadState();
    
    // Get books that have Goodreads links
    const result = await getBooksWithLinks(state.lastBookId, BATCH_SIZE);
    const booksToProcess = result.rows || [];
    
    if (booksToProcess.length === 0) {
      console.log("No books found with Goodreads links to process");
      return;
    }
    
    // Update state with total count if this is a new run
    if (state.totalBooks === 0) {
      state.totalBooks = await getTotalBooksCount();
      await saveState(state);
    }
    
    console.log(`Found ${state.totalBooks} total books with Goodreads links`);
    console.log(`Processing batch of ${booksToProcess.length} books`);
    
    // Define interface for book record from query result
    interface BookRecord {
      id: number;
      title: string;
      link: string | null;
    }
    
    // Process each book
    for (const bookRecord of booksToProcess) {
      // Type checking and ensuring required fields
      if (!bookRecord || typeof bookRecord !== 'object') {
        console.error("Invalid book record:", bookRecord);
        continue;
      }
      
      const book: BookRecord = {
        id: Number(bookRecord.id || 0),
        title: String(bookRecord.title || ''),
        link: bookRecord.link ? String(bookRecord.link) : null
      };
      
      try {
        console.log(`Processing book ${book.id}: ${book.title}`);
        
        // Skip books without links (shouldn't happen due to our query, but just in case)
        if (!book.link) {
          console.log(`Book ${book.id} has no link, skipping`);
          continue;
        }
        
        // Extract Goodreads book ID from link
        const goodreadsId = extractGoodreadsIdFromUrl(book.link);
        
        if (!goodreadsId) {
          console.log(`Could not extract Goodreads ID from URL: ${book.link}`);
          state.errors.push({ 
            bookId: book.id, 
            url: book.link,
            error: "Could not extract Goodreads ID from URL" 
          });
          continue;
        }
        
        // Construct the book's page URL
        const bookUrl = `https://www.goodreads.com/book/show/${goodreadsId}`;
        console.log(`Fetching genres from ${bookUrl}`);
        
        // Get genres for the book
        const genres = await scrapeGenresFromGoodreads(bookUrl);
        console.log(`Found ${genres.length} genres: ${genres.join(', ')}`);
        
        // Process each genre and link to book
        if (genres.length > 0) {
          for (const genre of genres) {
            // Process the shelf/genre
            const shelfId = await processShelf(genre);
            
            // Link the shelf/genre to the book
            await linkShelfToBook(shelfId, book.id);
          }
        }
        
        // Update state
        state.processedBooks++;
        state.lastBookId = book.id;
        
        // Save state periodically
        await saveState(state);
        
        // Add a delay to avoid hitting rate limits
        await setTimeout(1000);
        
      } catch (error) {
        console.error(`Error processing book ${book.id}:`, error);
        state.errors.push({ 
          bookId: book.id, 
          url: book.link || "No URL",
          error: error instanceof Error ? error.message : "Unknown error" 
        });
        
        // Save state when an error occurs
        await saveState(state);
      }
    }
    
    console.log(`Completed processing ${state.processedBooks}/${state.totalBooks} books`);
    
    if (state.errors.length > 0) {
      console.log(`Encountered ${state.errors.length} errors. See state file for details.`);
    }
    
    // If we've processed all books, reset the lastBookId for future runs
    if (state.processedBooks >= state.totalBooks) {
      state.lastBookId = null;
      await saveState(state);
    }
    
  } catch (error) {
    console.error("Error in genre enrichment process:", error);
  }
}

/**
 * Get the total count of books with Goodreads links
 */
async function getTotalBooksCount(): Promise<number> {
  const result = await db.execute(sql`
    SELECT COUNT(*) AS count
    FROM books
    WHERE link IS NOT NULL AND link LIKE '%goodreads.com%'
  `);
  
  if (result.rows && result.rows.length > 0) {
    return Number(result.rows[0].count);
  }
  
  return 0;
}

/**
 * Get a batch of books with Goodreads links to process
 */
async function getBooksWithLinks(lastBookId: number | null, limit: number) {
  // Create the SQL query with parameters depending on whether we have a last ID
  let query;
  if (lastBookId) {
    query = sql`
      SELECT id, title, link
      FROM books
      WHERE link IS NOT NULL 
        AND link LIKE '%goodreads.com%'
        AND id > ${lastBookId}
      ORDER BY id ASC
      LIMIT ${limit}
    `;
  } else {
    query = sql`
      SELECT id, title, link
      FROM books
      WHERE link IS NOT NULL 
        AND link LIKE '%goodreads.com%'
      ORDER BY id ASC
      LIMIT ${limit}
    `;
  }
  
  // Execute the query
  return db.execute(query);
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

/**
 * Scrape genres from a Goodreads book page
 */
async function scrapeGenresFromGoodreads(url: string): Promise<string[]> {
  try {
    // Fetch the page with a user agent to ensure we get the full page
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });
    const html = response.data;
    
    // Load HTML into cheerio
    const $ = cheerio.load(html);
    
    // Based on the screenshots provided, look for div with data-testid="genresList"
    const genresContainer = $('div[data-testid="genresList"]');
    
    // Try to find the specific ul with aria-label="Top genres for this book"
    const genresList = $('ul.CollapsableList[aria-label="Top genres for this book"]');
    
    // Look for genre buttons inside the container
    const genreButtons = $('.BookPageMetadataSection__genreButton');
    
    // Extract genres from the genre buttons
    const genres: string[] = [];
    
    // Method 1: Look for Button__labelItem spans within the genre buttons
    genreButtons.find('.Button__labelItem').each((_, element) => {
      const genreText = $(element).text().trim();
      if (genreText && !genres.includes(genreText)) {
        genres.push(genreText);
      }
    });
    
    // If we didn't find genres with the first method, try method 2
    if (genres.length === 0 && genresContainer.length > 0) {
      // Method 2: Find all links in the genres container that point to genre pages
      genresContainer.find('a[href*="/genres/"]').each((_, element) => {
        const genreText = $(element).text().trim();
        if (genreText && !genres.includes(genreText)) {
          genres.push(genreText);
        }
      });
    }
    
    // If we still didn't find genres, try a more general approach
    if (genres.length === 0) {
      // Method 3: Look for any anchors with href containing "/genres/"
      $('a[href*="/genres/"]').each((_, element) => {
        const genreText = $(element).text().trim();
        if (genreText && !genres.includes(genreText)) {
          genres.push(genreText);
        }
      });
    }
    
    return genres;
  } catch (error) {
    console.error("Error scraping genres:", error);
    throw error;
  }
}

/**
 * Process a shelf/genre and return its ID
 */
async function processShelf(shelfName: string): Promise<number> {
  try {
    // Check if shelf already exists
    let shelf = await db.query.shelves.findFirst({
      where: eq(shelves.name, shelfName)
    });
    
    if (shelf) {
      return shelf.id;
    }
    
    console.log("Inserting new shelf/genre:", shelfName);
    
    // Insert shelf
    const [insertedShelf] = await db.insert(shelves).values({
      name: shelfName
    }).returning();
    
    return insertedShelf.id;
  } catch (error) {
    console.error("Error processing shelf:", error);
    throw error;
  }
}

/**
 * Link a shelf/genre to a book
 */
async function linkShelfToBook(shelfId: number, bookId: number): Promise<void> {
  try {
    // Instead of checking if the link exists first, use onConflictDoNothing
    await db.insert(bookShelves).values({
      bookId: bookId,
      shelfId: shelfId
    }).onConflictDoNothing();
    
  } catch (error) {
    console.error("Error linking shelf to book:", error);
    throw error;
  }
}

/**
 * Load the current enrichment state from file
 */
async function loadState(): Promise<EnrichmentState> {
  const stateFile = path.join(__dirname, 'genres_enrichment_state.json');
  
  try {
    if (fs.existsSync(stateFile)) {
      const data = await fs.promises.readFile(stateFile, 'utf8');
      return JSON.parse(data) as EnrichmentState;
    }
  } catch (error) {
    console.error("Error loading state, starting fresh:", error);
  }
  
  return { ...initialState };
}

/**
 * Save the current enrichment state to file
 */
async function saveState(state: EnrichmentState): Promise<void> {
  const stateFile = path.join(__dirname, 'genres_enrichment_state.json');
  
  try {
    await fs.promises.writeFile(
      stateFile,
      JSON.stringify(state, null, 2),
      'utf8'
    );
  } catch (error) {
    console.error("Error saving state:", error);
  }
}

// Check if this file is being run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  enrichBookGenres()
    .then(() => {
      console.log("Book genre enrichment process completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error in book genre enrichment process:", error);
      process.exit(1);
    });
}

// Export for testing or importing in other modules
export { enrichBookGenres };