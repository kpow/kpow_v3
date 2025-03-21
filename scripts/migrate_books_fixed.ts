import axios from "axios";
import { db } from "../db";
import { parseXMLAsync, GOODREADS_API_BASE, GOODREADS_USER_ID, GOODREADS_API_KEY } from "../server/utils/api-utils";
import { eq } from "drizzle-orm";
import { books, authors, shelves, bookAuthors, bookShelves } from "../db/schema";

// Type definitions for Goodreads XML response
interface GoodreadsResponse {
  GoodreadsResponse: {
    reviews: [{
      $: { total: string; start: string; end: string; };
      review: any[];
    }];
  };
}

/**
 * Migrate all books from Goodreads to our database
 * This version uses a limited batch to prevent timeout
 */
async function migrateBooks() {
  console.log("Starting migration of books from Goodreads to database");

  try {
    // Get the total count of books
    const totalBooks = await getTotalBooksCount();
    console.log(`Found ${totalBooks} books to migrate`);

    // For testing, just process one page with a small batch
    const batchSize = 2;
    let processedBooks = 0;
    
    console.log(`Processing only first page with ${batchSize} books for testing`);
    
    const booksData = await fetchGoodreadsPage(1, batchSize);
    console.log("Successfully received data from Goodreads API");
    
    if (!booksData || !booksData.GoodreadsResponse || !booksData.GoodreadsResponse.reviews) {
      console.error("Unexpected API response format:", JSON.stringify(booksData));
      return 0;
    }
    
    const reviews = booksData.GoodreadsResponse.reviews[0].review;
    
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      console.warn("No reviews found on first page");
      return 0;
    }
    
    console.log(`Found ${reviews.length} books on page 1, processing...`);
    
    // Process each book in the current page
    for (const review of reviews) {
      try {
        console.log(`Processing book: ${review.book?.[0]?.title?.[0] || "Unknown Title"}`);
        await processBook(review);
        processedBooks++;
        console.log(`Successfully processed book ${processedBooks}`);
      } catch (err) {
        console.error("Error processing individual book:", err);
        // Continue with next book
      }
    }

    console.log("✅ Testing migration completed successfully");
    return processedBooks;
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
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
 * Using snake_case for all property names to match database column names
 */
async function processBook(
  review: any
): Promise<void> {
  try {
    const bookData = review.book[0];
    const goodreadsId = bookData.id?.[0] || null;
    
    // Check if the book already exists
    const existingBook = goodreadsId 
      ? await db.query.books.findFirst({
          where: eq(books.goodreads_id, goodreadsId)
        })
      : null;
    
    if (existingBook) {
      console.log(`Book with Goodreads ID ${goodreadsId} already exists, skipping`);
      return;
    }
    
    console.log("Inserting new book:", bookData.title?.[0]);
    
    // Insert book with snake_case property names
    const [insertedBook] = await db.insert(books).values({
      goodreads_id: goodreadsId,
      title: bookData.title?.[0] || "Untitled",
      title_without_series: bookData.title_without_series?.[0] || null,
      description: bookData.description?.[0] || null,
      image_url: bookData.image_url?.[0] || null,
      link: bookData.link?.[0] || null,
      average_rating: bookData.average_rating?.[0] || null,
      isbn: bookData.isbn?.[0] || null,
      isbn13: bookData.isbn13?.[0] || null,
      pages: bookData.num_pages?.[0] ? parseInt(bookData.num_pages[0]) : null,
      publication_year: bookData.publication_year?.[0] ? parseInt(bookData.publication_year[0]) : null,
      publisher: bookData.publisher?.[0] || null,
      language: bookData.language_code?.[0] || null,
      date_added: bookData.date_added?.[0] ? new Date(bookData.date_added[0]) : null,
      date_read: bookData.date_read?.[0] ? new Date(bookData.date_read[0]) : null,
      user_rating: review.rating?.[0] || "0"
    }).returning();
    
    console.log("Book inserted successfully with ID:", insertedBook.id);
    
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
 * Using snake_case for all property names to match database column names
 */
async function processAuthor(
  authorData: any
): Promise<number> {
  try {
    const goodreadsId = authorData.id?.[0] || null;
    
    // Check if author already exists
    let author = goodreadsId 
      ? await db.query.authors.findFirst({
          where: eq(authors.goodreads_id, goodreadsId)
        })
      : null;
    
    if (author) {
      return author.id;
    }
    
    console.log("Inserting new author:", authorData.name?.[0]);
    
    // Insert author with snake_case property names
    const [insertedAuthor] = await db.insert(authors).values({
      goodreads_id: goodreadsId,
      name: authorData.name?.[0] || "Unknown Author",
      image_url: authorData.image_url?.[0] || null,
      average_rating: authorData.average_rating?.[0] || null,
      ratings_count: authorData.ratings_count?.[0] ? parseInt(authorData.ratings_count[0]) : null,
      text_reviews_count: authorData.text_reviews_count?.[0] ? parseInt(authorData.text_reviews_count[0]) : null
    }).returning();
    
    console.log("Author inserted successfully with ID:", insertedAuthor.id);
    
    return insertedAuthor.id;
  } catch (error) {
    console.error("Error processing author:", error);
    throw error;
  }
}

/**
 * Process a shelf and insert or update in the database
 */
async function processShelf(
  shelfName: string
): Promise<number> {
  try {
    // Check if shelf already exists
    let shelf = await db.query.shelves.findFirst({
      where: eq(shelves.name, shelfName)
    });
    
    if (shelf) {
      return shelf.id;
    }
    
    console.log("Inserting new shelf:", shelfName);
    
    // Insert shelf
    const [insertedShelf] = await db.insert(shelves).values({
      name: shelfName
    }).returning();
    
    console.log("Shelf inserted successfully with ID:", insertedShelf.id);
    
    return insertedShelf.id;
  } catch (error) {
    console.error("Error processing shelf:", error);
    throw error;
  }
}

/**
 * Link an author to a book
 * Using snake_case for all property names to match database column names
 */
async function linkAuthorToBook(authorId: number, bookId: number): Promise<void> {
  try {
    console.log(`Linking author ${authorId} to book ${bookId}`);
    
    await db.insert(bookAuthors).values({
      book_id: bookId,
      author_id: authorId
    }).onConflictDoNothing();
    
    console.log("Author-book link created successfully");
  } catch (error) {
    console.error("Error linking author to book:", error);
    throw error;
  }
}

/**
 * Link a shelf to a book
 * Using snake_case for all property names to match database column names
 */
async function linkShelfToBook(shelfId: number, bookId: number): Promise<void> {
  try {
    console.log(`Linking shelf ${shelfId} to book ${bookId}`);
    
    await db.insert(bookShelves).values({
      book_id: bookId,
      shelf_id: shelfId
    }).onConflictDoNothing();
    
    console.log("Shelf-book link created successfully");
  } catch (error) {
    console.error("Error linking shelf to book:", error);
    throw error;
  }
}

// Always run when imported with tsx
console.log("Starting book migration script...");
migrateBooks()
  .then(count => {
    console.log(`Successfully migrated ${count} books from Goodreads`);
    process.exit(0);
  })
  .catch(error => {
    console.error("Migration failed:", error);
    process.exit(1);
  });

export { migrateBooks };