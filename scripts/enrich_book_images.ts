/**
 * Script to enrich book cover images from Goodreads
 * 
 * This script fetches high-quality cover images for books that:
 * 1. Have a Goodreads link
 * 2. Have a missing or low-quality image URL
 * 
 * It uses web scraping to extract the high-resolution cover image from the Goodreads page
 * and updates the database with the improved image URL.
 */

import axios from "axios";
import * as cheerio from 'cheerio';
import { db } from "../db";
import { books } from "../db/schema";
import { eq, sql, isNull, or, like, and } from "drizzle-orm";
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from "util";
import { fileURLToPath } from 'url';

// Get directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const STATE_FILE = path.join(__dirname, 'book_images_enrichment_state.json');
let BATCH_SIZE = 10; // Default number of books to process in one run
const DELAY_MS = 1000; // Delay between requests to avoid rate limiting

// Promise-based setTimeout
const setTimeout = promisify(global.setTimeout);

// Interface for tracking enrichment progress
interface EnrichmentState {
  processedBooks: number;
  totalBooks: number;
  lastBookId: number | null;
  errors: Array<{ bookId: number, url: string, error: string }>;
  successfulUpdates: number;
}

// Initial state
const initialState: EnrichmentState = {
  processedBooks: 0,
  totalBooks: 0,
  lastBookId: null,
  errors: [],
  successfulUpdates: 0
};

/**
 * Main function to enrich book cover images from Goodreads
 */
async function enrichBookImages() {
  console.log("Starting book cover image enrichment from Goodreads");
  
  try {
    // Load previous state or create new one
    let state = await loadState();
    
    // Get books that need image enrichment
    const result = await getBooksForImageEnrichment(state.lastBookId, BATCH_SIZE);
    const booksToProcess = result.rows || [];
    
    if (booksToProcess.length === 0) {
      console.log("No books found that need image enrichment");
      return;
    }
    
    // Update state with total count if this is a new run
    if (state.totalBooks === 0) {
      state.totalBooks = await getTotalBooksCount();
      await saveState(state);
    }
    
    console.log(`Found ${state.totalBooks} total books that need image enrichment`);
    console.log(`Processing batch of ${booksToProcess.length} books`);
    
    // Define interface for book record from query result
    interface BookRecord {
      id: number;
      title: string;
      link: string | null;
      imageUrl: string | null;
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
        link: bookRecord.link ? String(bookRecord.link) : null,
        imageUrl: bookRecord.image_url ? String(bookRecord.image_url) : null
      };
      
      console.log(`Processing book ${state.processedBooks + 1}/${state.totalBooks}: [${book.id}] ${book.title}`);
      
      try {
        // Skip if no Goodreads link
        if (!book.link || !book.link.includes('goodreads.com')) {
          console.log(`  - Skipping: No valid Goodreads link`);
          state.processedBooks++;
          state.lastBookId = book.id;
          await saveState(state);
          continue;
        }
        
        // Get high-quality image URL from Goodreads
        const refinedImageUrl = await scrapeBookCoverImage(book.link);
        
        if (!refinedImageUrl) {
          console.log(`  - No high-quality image found`);
          state.processedBooks++;
          state.lastBookId = book.id;
          await saveState(state);
          continue;
        }
        
        // Check if the image URL is different than what we already have
        if (book.imageUrl === refinedImageUrl) {
          console.log(`  - Already has the highest quality image`);
          state.processedBooks++;
          state.lastBookId = book.id;
          await saveState(state);
          continue;
        }
        
        // Update the book in the database with the refined image URL
        await db.update(books)
          .set({ 
            imageUrl: refinedImageUrl,
            lastUpdated: new Date()
          })
          .where(eq(books.id, book.id));
        
        console.log(`  - ✅ Successfully updated image`);
        state.successfulUpdates++;
        state.processedBooks++;
        state.lastBookId = book.id;
        
        // Save state periodically
        await saveState(state);
        
        // Add a delay to avoid hitting rate limits
        await setTimeout(DELAY_MS);
        
      } catch (error) {
        console.error(`Error processing book ${book.id}:`, error);
        state.errors.push({ 
          bookId: book.id, 
          url: book.link || "No URL",
          error: error instanceof Error ? error.message : "Unknown error" 
        });
        
        // Still count as processed
        state.processedBooks++;
        state.lastBookId = book.id;
        
        // Save state when an error occurs
        await saveState(state);
        
        // Continue with next book after a short delay
        await setTimeout(DELAY_MS);
      }
    }
    
    console.log(`Completed processing ${state.processedBooks}/${state.totalBooks} books`);
    console.log(`Successfully updated ${state.successfulUpdates} book images`);
    
    if (state.errors.length > 0) {
      console.log(`Encountered ${state.errors.length} errors. See state file for details.`);
    }
    
    // If we've processed all books, reset the lastBookId for future runs
    if (state.processedBooks >= state.totalBooks) {
      state.lastBookId = null;
      await saveState(state);
    }
    
  } catch (error) {
    console.error("Error in book image enrichment process:", error);
  }
}

/**
 * Get the total count of books that need image enrichment
 */
async function getTotalBooksCount(): Promise<number> {
  try {
    const [countResult] = await db.select({
      count: sql<number>`count(*)`
    })
    .from(books)
    .where(
      and(
        // Only include books with a Goodreads link
        like(books.link, '%goodreads.com%'),
        or(
          // Missing image URL
          isNull(books.imageUrl),
          // Has a default or low-quality image URL
          like(books.imageUrl, '%nophoto%'),
          like(books.imageUrl, '%nocover%'),
          like(books.imageUrl, '%s.gr-assets.com%')
        )
      )
    );
    
    return Number(countResult.count);
  } catch (error) {
    console.error("Error getting total book count:", error);
    throw error;
  }
}

/**
 * Get a batch of books that need image enrichment
 */
async function getBooksForImageEnrichment(lastBookId: number | null, limit: number) {
  try {
    // Using drizzle query API instead of raw SQL to avoid parameterization issues
    let baseQuery = db.select({
      id: books.id,
      title: books.title,
      link: books.link,
      image_url: books.imageUrl
    })
    .from(books)
    .where(
      and(
        like(books.link, '%goodreads.com%'),
        or(
          isNull(books.imageUrl),
          like(books.imageUrl, '%nophoto%'),
          like(books.imageUrl, '%nocover%'),
          like(books.imageUrl, '%s.gr-assets.com%')
        ),
        // Add the lastBookId condition if provided
        lastBookId !== null ? sql`${books.id} > ${lastBookId}` : undefined
      )
    );
    
    // Add order by and limit
    const query = baseQuery.limit(limit);
    
    // Run the query and format the result to match the expected structure
    const results = await query;
    
    return {
      rows: results
    };
  } catch (error) {
    console.error("Error fetching books for image enrichment:", error);
    throw error;
  }
}

/**
 * Scrape the book cover image from the Goodreads book page
 */
async function scrapeBookCoverImage(url: string): Promise<string | null> {
  try {
    // Fetch the HTML content from the Goodreads book page
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Look for the BookCover__image div which contains the high quality image
    const bookCoverImage = $('.BookCover__image img');
    
    if (!bookCoverImage.length) {
      // Alternative selectors based on Goodreads page structure
      const altImage = $('#coverImage, .bookCover img, .cover img').first();
      
      if (!altImage.length) {
        return null;
      }
      
      return altImage.attr('src') || null;
    }
    
    // Extract the source URL of the image
    return bookCoverImage.attr('src') || null;
  } catch (error) {
    console.error("Error scraping book cover image:", error);
    throw error;
  }
}

/**
 * Load the current enrichment state from file
 */
async function loadState(): Promise<EnrichmentState> {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const stateData = await fs.promises.readFile(STATE_FILE, 'utf8');
      return JSON.parse(stateData);
    }
  } catch (error) {
    console.error("Error loading state file, creating new state:", error);
  }
  
  return { ...initialState };
}

/**
 * Save the current enrichment state to file
 */
async function saveState(state: EnrichmentState): Promise<void> {
  try {
    await fs.promises.writeFile(
      STATE_FILE,
      JSON.stringify(state, null, 2),
      'utf8'
    );
  } catch (error) {
    console.error("Error saving state file:", error);
  }
}

// Run the function if this is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  // Check if a custom batch size was provided
  const customBatchSize = process.argv[2] ? parseInt(process.argv[2], 10) : null;
  
  // If a valid batch size was provided, override the default
  if (customBatchSize && !isNaN(customBatchSize) && customBatchSize > 0) {
    console.log(`Using custom batch size: ${customBatchSize}`);
    BATCH_SIZE = customBatchSize;
  }
  
  enrichBookImages()
    .then(() => {
      console.log("Book image enrichment process completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error in book image enrichment process:", error);
      process.exit(1);
    });
}

// Export for testing or importing in other modules
export { enrichBookImages };