import { db } from "../db/index.js";
import { sql } from "drizzle-orm";
import { testGenreScraper } from "./test_genre_scraper.js";

/**
 * Test the genre scraper with a book from the database
 */
async function testWithDatabaseBook() {
  try {
    // Find a book with a Goodreads link using raw SQL
    const result = await db.execute(sql`
      SELECT id, title, link
      FROM books
      WHERE link IS NOT NULL AND link LIKE '%goodreads.com%'
      LIMIT 1
    `);
    
    // Get rows from the query result
    const rows = result.rows || [];
    
    if (rows.length === 0) {
      console.log("No books with Goodreads links found in the database");
      return;
    }
    
    // Define interface for book record
    interface BookRecord {
      id: number;
      title: string;
      link: string | null;
    }
    
    // Extract and validate the book data
    const bookData = rows[0];
    
    // Type safety checks and conversion
    const testBook: BookRecord = {
      id: Number(bookData.id || 0),
      title: String(bookData.title || ''),
      link: bookData.link ? String(bookData.link) : null
    };
    
    console.log(`Testing with book: ${testBook.title} (ID: ${testBook.id})`);
    console.log(`Link: ${testBook.link}`);
    
    // Test scraping genres for this book
    if (!testBook.link) {
      console.log("Book has no link, cannot test");
      return;
    }
    
    const genres = await testGenreScraper(testBook.link);
    
    console.log("\nSummary:");
    console.log(`Book: ${testBook.title}`);
    console.log(`Genres: ${genres.join(", ")}`);
    
  } catch (error) {
    console.error("Error testing with database book:", error);
  }
}

// Check if this file is being run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  testWithDatabaseBook()
    .then(() => {
      console.log("Test completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Test failed:", error);
      process.exit(1);
    });
}