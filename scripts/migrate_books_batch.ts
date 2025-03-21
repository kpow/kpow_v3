import axios from "axios";
import { db } from "../db";
import { parseXMLAsync, GOODREADS_API_BASE, GOODREADS_USER_ID, GOODREADS_API_KEY } from "../server/utils/api-utils";
import { eq } from "drizzle-orm";
import { books, authors, shelves, bookAuthors, bookShelves } from "../db/schema";
import * as fs from 'fs';
import * as path from 'path';

// Type definitions for Goodreads XML response
interface GoodreadsResponse {
  GoodreadsResponse: {
    reviews: [{
      $: { total: string; start: string; end: string; };
      review: any[];
    }];
  };
}

interface MigrationState {
  lastProcessedPage: number;
  totalBooks: number;
  processedBooks: number;
}

const STATE_FILE = path.join(process.cwd(), 'migration_state.json');

/**
 * Migrate books from Goodreads to the database using a batched approach
 * to prevent timeouts
 */
async function migrateBooksBatch() {
  console.log("Starting migration of books from Goodreads to database");

  try {
    // Get or create migration state
    let state = await loadState();
    
    // If starting fresh, get the total count of books
    if (state.lastProcessedPage === 0) {
      state.totalBooks = await getTotalBooksCount();
      console.log(`Found ${state.totalBooks} books to migrate`);
      await saveState(state);
    } else {
      console.log(`Resuming migration from page ${state.lastProcessedPage + 1}`);
      console.log(`Processed ${state.processedBooks}/${state.totalBooks} books so far`);
    }

    // Process a small batch per run
    const batchSize = 5; // Limit per page
    const currentPage = state.lastProcessedPage + 1;
    
    console.log(`Processing page ${currentPage} with batch size ${batchSize}`);
    
    const booksData = await fetchGoodreadsPage(currentPage, batchSize);
    console.log("Successfully received data from Goodreads API");
    
    if (!booksData || !booksData.GoodreadsResponse || !booksData.GoodreadsResponse.reviews) {
      console.error("Unexpected API response format");
      return state.processedBooks;
    }
    
    const reviews = booksData.GoodreadsResponse.reviews[0].review;
    
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      console.warn(`No reviews found on page ${currentPage}, migration may be complete`);
      return state.processedBooks;
    }
    
    console.log(`Found ${reviews.length} books on page ${currentPage}, processing...`);
    
    // Process each book in the current batch
    for (const review of reviews) {
      try {
        console.log(`Processing book: ${review.book?.[0]?.title?.[0] || "Unknown Title"}`);
        await processBook(review);
        state.processedBooks++;
        console.log(`Successfully processed book ${state.processedBooks}/${state.totalBooks}`);
      } catch (err) {
        console.error("Error processing individual book:", err);
        // Continue with next book
      }
    }

    // Update state for the next batch
    state.lastProcessedPage = currentPage;
    await saveState(state);

    console.log(`✅ Batch migration completed successfully - ${state.processedBooks}/${state.totalBooks} books processed`);
    
    // Check if migration is complete
    if (state.processedBooks >= state.totalBooks) {
      console.log("🎉 Full migration completed!");
    } else {
      console.log(`📝 Migration in progress. Run again to process the next batch.`);
    }
    
    return state.processedBooks;
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  }
}

/**
 * Load the current migration state from file
 */
async function loadState(): Promise<MigrationState> {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn("Could not load migration state, starting fresh:", err);
  }
  
  return {
    lastProcessedPage: 0,
    totalBooks: 0,
    processedBooks: 0
  };
}

/**
 * Save the current migration state to file
 */
async function saveState(state: MigrationState): Promise<void> {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error("Error saving migration state:", err);
  }
}

/**
 * Get the total count of books from Goodreads
 */
async function getTotalBooksCount(): Promise<number> {
  try {
    const url = `${GOODREADS_API_BASE}/review/list/${GOODREADS_USER_ID}.xml`;
    const response = await axios.get(url, {
      params: {
        key: GOODREADS_API_KEY,
        v: "2",
        per_page: 1,
        page: 1,
        shelf: "read",
        sort: "date_read",
        order: "d",
      },
    });

    const result = await parseXMLAsync(response.data) as GoodreadsResponse;
    const total = parseInt(result.GoodreadsResponse.reviews[0].$.total);
    return total;
  } catch (error) {
    console.error("Error getting total book count:", error);
    throw error;
  }
}

/**
 * Fetch a page of books from Goodreads
 */
async function fetchGoodreadsPage(page: number, perPage: number): Promise<GoodreadsResponse> {
  try {
    const url = `${GOODREADS_API_BASE}/review/list/${GOODREADS_USER_ID}.xml`;
    const response = await axios.get(url, {
      params: {
        key: GOODREADS_API_KEY,
        v: "2",
        per_page: perPage,
        page: page,
        shelf: "read",
        sort: "date_read",
        order: "d",
      },
    });

    const result = await parseXMLAsync(response.data) as GoodreadsResponse;
    return result;
  } catch (error) {
    console.error(`Error fetching page ${page} from Goodreads:`, error);
    throw error;
  }
}

/**
 * Process a single book and insert it into the database
 * Using camelCase property names to match the schema
 */
async function processBook(review: any): Promise<void> {
  try {
    const bookData = review.book[0];
    const goodreadsId = bookData.id?.[0] || null;
    
    // Check if the book already exists
    const existingBook = goodreadsId 
      ? await db.query.books.findFirst({
          where: eq(books.goodreadsId, goodreadsId)
        })
      : null;
    
    if (existingBook) {
      console.log(`Book with Goodreads ID ${goodreadsId} already exists, skipping`);
      return;
    }
    
    // Insert book with camelCase property names
    const [insertedBook] = await db.insert(books).values({
      goodreadsId: goodreadsId,
      title: bookData.title?.[0] || "Untitled",
      titleWithoutSeries: bookData.title_without_series?.[0] || null,
      description: bookData.description?.[0] || null,
      imageUrl: bookData.image_url?.[0] || null,
      link: bookData.link?.[0] || null,
      averageRating: bookData.average_rating?.[0] || null,
      isbn: bookData.isbn?.[0] || null,
      isbn13: bookData.isbn13?.[0] || null,
      pages: bookData.num_pages?.[0] ? parseInt(bookData.num_pages[0]) : null,
      publicationYear: bookData.publication_year?.[0] ? parseInt(bookData.publication_year[0]) : null,
      publisher: bookData.publisher?.[0] || null,
      language: bookData.language_code?.[0] || null,
      dateAdded: bookData.date_added?.[0] ? new Date(bookData.date_added[0]) : null,
      dateRead: bookData.date_read?.[0] ? new Date(bookData.date_read[0]) : null,
      userRating: review.rating?.[0] || "0"
    }).returning();
    
    // Process authors
    if (bookData.authors && bookData.authors[0] && bookData.authors[0].author) {
      for (const authorData of bookData.authors[0].author) {
        const authorId = await processAuthor(authorData);
        await linkAuthorToBook(authorId, insertedBook.id);
      }
    }
    
    // Process shelves
    if (review.shelves && review.shelves[0] && review.shelves[0].shelf) {
      for (const shelfData of review.shelves[0].shelf) {
        const shelfName = shelfData.$.name;
        const shelfId = await processShelf(shelfName);
        await linkShelfToBook(shelfId, insertedBook.id);
      }
    }
    
    console.log(`✅ Successfully processed book: ${bookData.title?.[0] || "Untitled"}`);
  } catch (error) {
    console.error("Error processing book:", error);
    throw error;
  }
}

/**
 * Process an author and insert or update in the database
 * Using camelCase property names to match the schema
 */
async function processAuthor(authorData: any): Promise<number> {
  try {
    const goodreadsId = authorData.id?.[0] || null;
    
    // Check if author already exists
    let author = goodreadsId 
      ? await db.query.authors.findFirst({
          where: eq(authors.goodreadsId, goodreadsId)
        })
      : null;
    
    if (author) {
      return author.id;
    }
    
    // Insert author with camelCase property names
    const [insertedAuthor] = await db.insert(authors).values({
      goodreadsId: goodreadsId,
      name: authorData.name?.[0] || "Unknown Author",
      imageUrl: authorData.image_url?.[0] || null,
      averageRating: authorData.average_rating?.[0] || null,
      ratingsCount: authorData.ratings_count?.[0] ? parseInt(authorData.ratings_count[0]) : null,
      textReviewsCount: authorData.text_reviews_count?.[0] ? parseInt(authorData.text_reviews_count[0]) : null
    }).returning();
    
    return insertedAuthor.id;
  } catch (error) {
    console.error("Error processing author:", error);
    throw error;
  }
}

/**
 * Process a shelf and insert or update in the database
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
 * Link an author to a book
 * Using camelCase property names to match the schema
 */
async function linkAuthorToBook(authorId: number, bookId: number): Promise<void> {
  try {
    await db.insert(bookAuthors).values({
      bookId: bookId,
      authorId: authorId
    }).onConflictDoNothing();
  } catch (error) {
    console.error("Error linking author to book:", error);
    throw error;
  }
}

/**
 * Link a shelf to a book
 * Using camelCase property names to match the schema
 */
async function linkShelfToBook(shelfId: number, bookId: number): Promise<void> {
  try {
    await db.insert(bookShelves).values({
      bookId: bookId,
      shelfId: shelfId
    }).onConflictDoNothing();
  } catch (error) {
    console.error("Error linking shelf to book:", error);
    throw error;
  }
}

// Always run when imported with tsx
console.log("Starting book migration script...");
migrateBooksBatch()
  .then(count => {
    console.log(`Successfully migrated ${count} books from Goodreads`);
    process.exit(0);
  })
  .catch(error => {
    console.error("Migration failed:", error);
    process.exit(1);
  });

export { migrateBooksBatch };