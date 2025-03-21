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

async function testMigration() {
  console.log("Starting test migration of books from Goodreads");

  try {
    // Test with just 1 book
    const batchSize = 1;
    
    console.log(`Testing with ${batchSize} book`);
    
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
    
    console.log(`Found ${reviews.length} books on page 1`);
    
    // Process just the first book
    const review = reviews[0];
    const bookData = review.book?.[0];
    
    if (!bookData) {
      console.error("No book data found in review");
      return 0;
    }
    
    console.log("Book data:", JSON.stringify(bookData.title, null, 2));
    
    // Use camelCase property names as defined in schema.ts
    const bookValues = {
      goodreadsId: bookData.id?.[0] || null,
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
    };
    
    console.log("Prepared book values:", bookValues);
    
    // Insert book with camelCase property names
    const [insertedBook] = await db.insert(books).values(bookValues).returning();
    
    console.log("Book inserted successfully:", insertedBook);
    
    return 1;
  } catch (error) {
    console.error("Error during test migration:", error);
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

// Run the script
console.log("Starting test migration script...");
testMigration()
  .then(count => {
    console.log(`Successfully migrated ${count} book in test`);
    process.exit(0);
  })
  .catch(error => {
    console.error("Test migration failed:", error);
    process.exit(1);
  });