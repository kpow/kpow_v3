import { db } from "../db/index.js";
import { sql } from "drizzle-orm";

async function createBookTables() {
  console.log("Creating book-related tables...");

  try {
    // Create tables in the correct order to handle dependencies
    
    // 1. Create books table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        goodreads_id TEXT UNIQUE,
        title TEXT NOT NULL,
        title_without_series TEXT,
        description TEXT,
        image_url TEXT,
        link TEXT,
        average_rating TEXT,
        pages INTEGER,
        publication_year INTEGER,
        isbn TEXT,
        isbn13 TEXT,
        publisher TEXT,
        language TEXT,
        date_added TIMESTAMP,
        date_read TIMESTAMP,
        user_rating TEXT,
        date_created TIMESTAMP DEFAULT NOW(),
        last_updated TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Created books table");

    // 2. Create authors table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS authors (
        id SERIAL PRIMARY KEY,
        goodreads_id TEXT UNIQUE,
        name TEXT NOT NULL,
        image_url TEXT,
        average_rating TEXT,
        ratings_count INTEGER,
        text_reviews_count INTEGER,
        date_created TIMESTAMP DEFAULT NOW(),
        last_updated TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Created authors table");

    // 3. Create shelves table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS shelves (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        date_created TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Created shelves table");

    // 4. Create book_authors junction table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS book_authors (
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
        role TEXT,
        PRIMARY KEY (book_id, author_id)
      );
    `);
    console.log("✅ Created book_authors table");

    // 5. Create book_shelves junction table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS book_shelves (
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        shelf_id INTEGER NOT NULL REFERENCES shelves(id) ON DELETE CASCADE,
        date_added TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (book_id, shelf_id)
      );
    `);
    console.log("✅ Created book_shelves table");

    console.log("✅ Successfully created all book-related tables");
  } catch (error) {
    console.error("Error creating tables:", error);
    throw error;
  }
}

// Run the function
createBookTables()
  .then(() => {
    console.log("All tables created successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to create tables:", error);
    process.exit(1);
  });