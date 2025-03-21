import axios from "axios";
import { parseXMLAsync, GOODREADS_API_BASE, GOODREADS_USER_ID, GOODREADS_API_KEY } from "../server/utils/api-utils";
import { db } from "../db";
import { books, authors, shelves, bookAuthors, bookShelves } from "../db/schema";
import { eq } from "drizzle-orm";

// We'll use 100 as the max per page to minimize API calls
// Goodreads might have a lower limit, so we'll need to handle that
const MAX_PER_PAGE = 100;

/**
 * Migrate all books from Goodreads to our database
 */
async function migrateBooks() {
  console.log("🔄 Starting Goodreads book migration...");
  
  try {
    // First, let's get the total count of books to determine pagination
    const totalCount = await getTotalBooksCount();
    console.log(`📚 Found ${totalCount} books on Goodreads`);
    
    const totalPages = Math.ceil(totalCount / MAX_PER_PAGE);
    console.log(`📄 Will fetch ${totalPages} pages (${MAX_PER_PAGE} books per page)`);
    
    // Create a map to store processed authors to avoid duplicates
    const processedAuthors = new Map();
    
    // Create a map to store processed shelves to avoid duplicates  
    const processedShelves = new Map();
    
    // Process each page
    for (let page = 1; page <= totalPages; page++) {
      console.log(`\n🔄 Processing page ${page} of ${totalPages}`);
      const goodreadsBooks = await fetchGoodreadsPage(page, MAX_PER_PAGE);
      
      // Process each book from the page
      for (let i = 0; i < goodreadsBooks.length; i++) {
        const goodreadsBook = goodreadsBooks[i];
        await processBook(goodreadsBook, processedAuthors, processedShelves);
      }
      
      console.log(`✅ Processed page ${page}`);
    }
    
    console.log("\n✅ Book migration completed successfully!");
    console.log(`📊 Statistics:`);
    console.log(`   - Total books processed: ${totalCount}`);
    console.log(`   - Unique authors: ${processedAuthors.size}`);
    console.log(`   - Unique shelves: ${processedShelves.size}`);

  } catch (error) {
    console.error("❌ Error during migration:", error);
    process.exit(1);
  }
}

/**
 * Get the total count of books from Goodreads
 */
async function getTotalBooksCount(): Promise<number> {
  const url = `${GOODREADS_API_BASE}/review/list/${GOODREADS_USER_ID}.xml`;
  
  const response = await axios.get(url, {
    params: {
      key: GOODREADS_API_KEY,
      v: "2",
      per_page: 1,
      page: 1,
      shelf: "read",
    },
  });
  
  const result = await parseXMLAsync(response.data);
  const reviews = result.GoodreadsResponse.reviews[0];
  
  return parseInt(reviews.$.total);
}

/**
 * Fetch a page of books from Goodreads
 */
async function fetchGoodreadsPage(page: number, perPage: number) {
  const url = `${GOODREADS_API_BASE}/review/list/${GOODREADS_USER_ID}.xml`;
  console.log(`📡 Fetching page ${page} from Goodreads`);
  
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
  
  const result = await parseXMLAsync(response.data);
  const reviews = result.GoodreadsResponse.reviews[0];
  
  // Add ratings data to the response
  const reviewsWithRatings = reviews.review.map((review: any) => ({
    ...review,
    ratings: {
      user_rating: review.rating?.[0] ?? "0",
      average_rating: review.book?.[0]?.average_rating?.[0] ?? "0",
    },
  }));
  
  return reviewsWithRatings;
}

/**
 * Process a single book and insert it into the database
 */
async function processBook(
  goodreadsBook: any, 
  processedAuthors: Map<string, number>,
  processedShelves: Map<string, number>
) {
  // Extract book data, handling array wrappers
  const goodreadsId = goodreadsBook.id?.[0] || null;
  const bookData = goodreadsBook.book?.[0] || {};
  
  const title = bookData.title?.[0] || 'Unknown Title';
  const titleWithoutSeries = bookData.title_without_series?.[0] || title;
  const description = bookData.description?.[0] || null;
  const imageUrl = bookData.image_url?.[0] || null;
  const link = bookData.link?.[0] || null;
  const averageRating = bookData.average_rating?.[0] || null;
  const pages = bookData.num_pages?.[0] ? parseInt(bookData.num_pages[0]) : null;
  const publicationYear = bookData.publication_year?.[0] ? parseInt(bookData.publication_year[0]) : null;
  const isbn = bookData.isbn?.[0] || null;
  const isbn13 = bookData.isbn13?.[0] || null;
  const publisher = bookData.publisher?.[0] || null;
  const language = bookData.language_code?.[0] || null;
  const userRating = goodreadsBook.ratings?.user_rating || '0';
  
  // Date handling
  let dateAdded = null;
  let dateRead = null;
  
  if (goodreadsBook.date_added && goodreadsBook.date_added[0]) {
    dateAdded = new Date(goodreadsBook.date_added[0]);
  }
  
  if (goodreadsBook.read_at && goodreadsBook.read_at[0]) {
    dateRead = new Date(goodreadsBook.read_at[0]);
  }
  
  console.log(`📝 Processing book: ${title}`);
  
  // Check if the book already exists
  const existingBook = await db.query.books.findFirst({
    where: eq(books.goodreadsId, goodreadsId),
  });
  
  let bookId;
  
  if (existingBook) {
    console.log(`⏩ Book "${title}" already exists, updating...`);
    
    // Update the existing book
    await db.update(books)
      .set({
        title,
        titleWithoutSeries,
        description,
        imageUrl,
        link,
        averageRating,
        pages,
        publicationYear,
        isbn,
        isbn13,
        publisher,
        language,
        dateAdded,
        dateRead,
        userRating,
        lastUpdated: new Date(),
      })
      .where(eq(books.id, existingBook.id));
    
    bookId = existingBook.id;
  } else {
    console.log(`➕ Adding new book: "${title}"`);
    
    // Insert the new book
    const [newBook] = await db.insert(books)
      .values({
        goodreadsId,
        title,
        titleWithoutSeries,
        description,
        imageUrl,
        link,
        averageRating,
        pages,
        publicationYear,
        isbn,
        isbn13,
        publisher,
        language,
        dateAdded,
        dateRead,
        userRating,
      })
      .returning({ id: books.id });
    
    bookId = newBook.id;
  }
  
  // Process authors
  if (bookData.authors && bookData.authors[0] && bookData.authors[0].author) {
    const bookAuthors = bookData.authors[0].author;
    
    for (const authorData of bookAuthors) {
      const authorId = await processAuthor(authorData, processedAuthors);
      
      // Link author to book if not already linked
      await linkAuthorToBook(authorId, bookId);
    }
  }
  
  // Process shelves
  if (goodreadsBook.shelves && goodreadsBook.shelves[0] && goodreadsBook.shelves[0].shelf) {
    const bookShelvesList = goodreadsBook.shelves[0].shelf;
    
    for (const shelfData of bookShelvesList) {
      const shelfName = shelfData.$?.name;
      if (shelfName) {
        const shelfId = await processShelf(shelfName, processedShelves);
        
        // Link shelf to book if not already linked
        await linkShelfToBook(shelfId, bookId);
      }
    }
  }
  
  return bookId;
}

/**
 * Process an author and insert or update in the database
 */
async function processAuthor(
  authorData: any, 
  processedAuthors: Map<string, number>
): Promise<number> {
  // Extract author data
  const goodreadsId = authorData.id?.[0] || null;
  const name = authorData.name?.[0] || 'Unknown Author';
  const imageUrl = authorData.image_url?.[0] || null;
  
  // If we've already processed this author, return the ID
  if (processedAuthors.has(goodreadsId)) {
    return processedAuthors.get(goodreadsId)!;
  }
  
  // Check if the author already exists
  const existingAuthor = await db.query.authors.findFirst({
    where: eq(authors.goodreadsId, goodreadsId),
  });
  
  let authorId;
  
  if (existingAuthor) {
    // Update the existing author
    await db.update(authors)
      .set({
        name,
        imageUrl,
        lastUpdated: new Date(),
      })
      .where(eq(authors.id, existingAuthor.id));
    
    authorId = existingAuthor.id;
  } else {
    // Insert the new author
    const [newAuthor] = await db.insert(authors)
      .values({
        goodreadsId,
        name,
        imageUrl,
      })
      .returning({ id: authors.id });
    
    authorId = newAuthor.id;
  }
  
  // Store the processed author in the map
  processedAuthors.set(goodreadsId, authorId);
  
  return authorId;
}

/**
 * Process a shelf and insert or update in the database
 */
async function processShelf(
  shelfName: string,
  processedShelves: Map<string, number>
): Promise<number> {
  // If we've already processed this shelf, return the ID
  if (processedShelves.has(shelfName)) {
    return processedShelves.get(shelfName)!;
  }
  
  // Check if the shelf already exists
  const existingShelf = await db.query.shelves.findFirst({
    where: eq(shelves.name, shelfName),
  });
  
  let shelfId;
  
  if (existingShelf) {
    shelfId = existingShelf.id;
  } else {
    // Insert the new shelf
    const [newShelf] = await db.insert(shelves)
      .values({
        name: shelfName,
      })
      .returning({ id: shelves.id });
    
    shelfId = newShelf.id;
  }
  
  // Store the processed shelf in the map
  processedShelves.set(shelfName, shelfId);
  
  return shelfId;
}

/**
 * Link an author to a book
 */
async function linkAuthorToBook(authorId: number, bookId: number): Promise<void> {
  // Check if the relationship already exists
  const existingLink = await db.query.bookAuthors.findFirst({
    where: (fields) => {
      return eq(fields.authorId, authorId) && eq(fields.bookId, bookId);
    },
  });
  
  if (!existingLink) {
    // Create the relationship
    await db.insert(bookAuthors)
      .values({
        authorId,
        bookId,
      });
  }
}

/**
 * Link a shelf to a book
 */
async function linkShelfToBook(shelfId: number, bookId: number): Promise<void> {
  // Check if the relationship already exists
  const existingLink = await db.query.bookShelves.findFirst({
    where: (fields) => {
      return eq(fields.shelfId, shelfId) && eq(fields.bookId, bookId);
    },
  });
  
  if (!existingLink) {
    // Create the relationship
    await db.insert(bookShelves)
      .values({
        shelfId,
        bookId,
      });
  }
}

// If this script is run directly (not imported), run the migration
if (require.main === module) {
  migrateBooks()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Error:", error);
      process.exit(1);
    });
}

export { migrateBooks };