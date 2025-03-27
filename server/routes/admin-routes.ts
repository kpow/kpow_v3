import { Router } from "express";
import axios from "axios";
import * as cheerio from 'cheerio';
import { db } from "@db";
import { 
  artists, 
  songs, 
  plays, 
  books, 
  authors as dbAuthors, 
  shelves as dbShelves, 
  bookAuthors, 
  bookShelves 
} from "@db/schema";
import { eq, isNull, inArray, desc, sql, and, like } from "drizzle-orm";

export function registerAdminRoutes(router: Router) {
  // iTunes search endpoint
  router.get("/api/admin/search-itunes", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!req.user?.approved) {
      return res.status(403).json({ error: "Account not approved" });
    }

    const term = req.query.term as string;
    if (!term) {
      return res.status(400).json({ error: "Search term is required" });
    }

    try {
      console.log(`[iTunes Search] Searching for term: ${term}`);
      const response = await axios.get(
        `https://itunes.apple.com/search?term=${encodeURIComponent(
          term
        )}&entity=album&limit=5`
      );

      console.log(`[iTunes Search] Found ${response.data.resultCount} results`);
      res.json(response.data);
    } catch (error) {
      console.error("iTunes API Error:", error);
      res.status(500).json({
        error: "Failed to fetch from iTunes",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Update artist image endpoint
  router.post("/api/admin/update-artist-image", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!req.user?.approved) {
      return res.status(403).json({ error: "Account not approved" });
    }

    const { artistName, imageUrl } = req.body;

    if (!artistName || !imageUrl) {
      return res.status(400).json({ error: "Artist name and image URL are required" });
    }

    try {
      console.log(`[Artist Update] Checking existence of artist: ${artistName}`);

      // First check if the artist exists
      const existingArtist = await db
        .select()
        .from(artists)
        .where(eq(artists.name, artistName))
        .limit(1);

      if (!existingArtist.length) {
        console.log(`[Artist Update] Artist not found: ${artistName}`);
        return res.status(404).json({ error: "Artist not found" });
      }

      console.log(`[Artist Update] Updating image for artist: ${artistName}`);

      // Process the image URL to ensure it's properly formatted
      const processedImageUrl = imageUrl.replace(/\d+x\d+/, '600x600');

      // Update only the imageUrl field
      const result = await db
        .update(artists)
        .set({ imageUrl: processedImageUrl })
        .where(eq(artists.name, artistName))
        .returning();

      console.log(`[Artist Update] Successfully updated image for artist: ${artistName}`);
      res.json({ 
        message: "Artist image updated successfully", 
        artist: result[0] 
      });
    } catch (error) {
      console.error("Database Error:", error);
      res.status(500).json({
        error: "Failed to update artist image",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get songs without plays
  router.get("/api/admin/songs-without-plays", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!req.user?.approved) {
      return res.status(403).json({ error: "Account not approved" });
    }

    try {
      console.log("[Songs] Fetching songs without plays");

      const songsWithoutPlays = await db
        .select({
          id: songs.id,
          name: songs.name,
          albumName: songs.albumName,
          artistName: artists.name,
        })
        .from(songs)
        .leftJoin(plays, eq(plays.songId, songs.id))
        .leftJoin(artists, eq(songs.artistId, artists.id))
        .where(isNull(plays.id));

      console.log(`[Songs] Found ${songsWithoutPlays.length} songs without plays`);
      res.json(songsWithoutPlays);
    } catch (error) {
      console.error("Database Error:", error);
      res.status(500).json({
        error: "Failed to fetch songs without plays",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Delete selected songs
  router.post("/api/admin/delete-songs", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!req.user?.approved) {
      return res.status(403).json({ error: "Account not approved" });
    }

    const { songIds } = req.body;
    if (!Array.isArray(songIds) || songIds.length === 0) {
      return res.status(400).json({ error: "Song IDs array is required" });
    }

    try {
      console.log(`[Songs] Deleting ${songIds.length} songs`);

      // Delete songs using inArray instead of in
      await db.delete(songs).where(inArray(songs.id, songIds));

      console.log(`[Songs] Successfully deleted ${songIds.length} songs`);
      res.json({ message: "Songs deleted successfully" });
    } catch (error) {
      console.error("Database Error:", error);
      res.status(500).json({
        error: "Failed to delete songs",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get artists without images
  router.get("/api/admin/artists-without-images", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!req.user?.approved) {
      return res.status(403).json({ error: "Account not approved" });
    }

    try {
      console.log("[Artists] Fetching artists without images");

      // Get artists without images and their first song (for album name)
      const artistsToUpdate = await db.query.artists.findMany({
        where: isNull(artists.imageUrl),
        with: {
          songs: {
            limit: 1,
          },
        },
        orderBy: [artists.name],
      });

      // Format the response to match the expected format
      const artistList = artistsToUpdate.map((artist) => ({
        id: artist.id,
        name: artist.name,
        albumName: artist.songs?.[0]?.albumName || null,
      }));

      console.log(`[Artists] Found ${artistList.length} artists without images`);
      res.json(artistList);
    } catch (error) {
      console.error("Database Error:", error);
      res.status(500).json({
        error: "Failed to fetch artists without images",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Book Management Routes

  // Get all books with pagination, sorting, and filtering
  router.get("/api/admin/books", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!req.user?.approved) {
      return res.status(403).json({ error: "Account not approved" });
    }

    try {
      const page = parseInt(req.query.page as string || "1");
      const limit = parseInt(req.query.limit as string || "10");
      const search = req.query.search as string || "";
      const sortField = req.query.sortField as string || "id";
      const sortDirection = req.query.sortDirection as string || "desc";
      
      // Calculate offset for pagination
      const offset = (page - 1) * limit;
      
      console.log(`[Books Admin] Fetching books with search: "${search}", page: ${page}, limit: ${limit}`);
      
      // Build where clause for search
      let whereClause = undefined;
      if (search) {
        whereClause = like(books.title, `%${search}%`);
      }
      
      // Get total count for pagination
      const [countResult] = await db.select({
        count: sql<number>`count(*)`
      })
      .from(books)
      .where(whereClause);
      
      const total = Number(countResult.count);
      
      // Special case for author sorting
      if (sortField === 'author') {
        // For author sorting, we need to get all books with their authors first
        // then sort them manually by the first author's name
        const allBooks = await db.query.books.findMany({
          where: whereClause,
          with: {
            bookAuthors: {
              with: {
                author: true
              }
            },
            bookShelves: {
              with: {
                shelf: true
              }
            }
          }
        });
        
        // Sort the books by author name
        const sortedBooks = allBooks.sort((a, b) => {
          // Get first author name for each book (or empty string if none)
          const authorA = a.bookAuthors[0]?.author?.name || '';
          const authorB = b.bookAuthors[0]?.author?.name || '';
          
          // Sort by author name
          if (sortDirection === 'asc') {
            return authorA.localeCompare(authorB);
          } else {
            return authorB.localeCompare(authorA);
          }
        });
        
        // Apply pagination
        const paginatedBooks = sortedBooks.slice(offset, offset + limit);
        
        console.log(`[Books Admin] Found ${paginatedBooks.length} books (total: ${total})`);
        
        // Transform the data to include nested relations in a more accessible format
        const transformedBooks = paginatedBooks.map(book => {
          return {
            ...book,
            authors: book.bookAuthors.map(ba => ba.author),
            shelves: book.bookShelves.map(bs => bs.shelf),
            // Remove the nested relation fields
            bookAuthors: undefined,
            bookShelves: undefined
          }
        });
        
        // Return with pagination metadata
        return res.json({
          books: transformedBooks,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
          }
        });
      }
      
      // For other fields, proceed with normal sorting
      let orderByField;
      if (sortField === 'title') {
        orderByField = books.title;
      } else if (sortField === 'dateAdded') {
        orderByField = books.dateAdded;
      } else if (sortField === 'dateRead') {
        orderByField = books.dateRead;
      } else if (sortField === 'userRating') {
        orderByField = books.userRating;
      } else {
        orderByField = books.id;
      }
      
      // Fetch books with relational data
      const booksData = await db.query.books.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: sortDirection === 'desc' ? [desc(orderByField)] : [orderByField],
        with: {
          bookAuthors: {
            with: {
              author: true
            }
          },
          bookShelves: {
            with: {
              shelf: true
            }
          }
        }
      });
      
      console.log(`[Books Admin] Found ${booksData.length} books (total: ${total})`);
      
      // Transform the data to include nested relations in a more accessible format
      const transformedBooks = booksData.map(book => {
        return {
          ...book,
          authors: book.bookAuthors.map(ba => ba.author),
          shelves: book.bookShelves.map(bs => bs.shelf),
          // Remove the nested relation fields
          bookAuthors: undefined,
          bookShelves: undefined
        }
      });
      
      // Return with pagination metadata
      res.json({
        books: transformedBooks,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
      
    } catch (error) {
      console.error("Database Error:", error);
      res.status(500).json({
        error: "Failed to fetch books",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get a single book by ID
  router.get("/api/admin/books/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!req.user?.approved) {
      return res.status(403).json({ error: "Account not approved" });
    }

    const bookId = parseInt(req.params.id);
    if (isNaN(bookId)) {
      return res.status(400).json({ error: "Invalid book ID" });
    }

    try {
      console.log(`[Books Admin] Fetching book with ID: ${bookId}`);
      
      const book = await db.query.books.findFirst({
        where: eq(books.id, bookId),
        with: {
          bookAuthors: {
            with: {
              author: true
            }
          },
          bookShelves: {
            with: {
              shelf: true
            }
          }
        }
      });
      
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }
      
      // Transform to include authors and shelves directly
      const transformedBook = {
        ...book,
        authors: book.bookAuthors?.map(ba => ba.author) || [],
        shelves: book.bookShelves?.map(bs => bs.shelf) || [],
        // Remove the nested relation fields
        bookAuthors: undefined,
        bookShelves: undefined
      };
      
      res.json(transformedBook);
      
    } catch (error) {
      console.error("Database Error:", error);
      res.status(500).json({
        error: "Failed to fetch book",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Create a new book
  router.post("/api/admin/books", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!req.user?.approved) {
      return res.status(403).json({ error: "Account not approved" });
    }

    const { title, description, imageUrl, authors, shelves, ...bookData } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Book title is required" });
    }

    try {
      console.log(`[Books Admin] Creating new book: ${title}`);
      
      // Start a transaction to ensure data consistency
      return await db.transaction(async (tx) => {
        // Insert the book
        const [insertedBook] = await tx.insert(books).values({
          title,
          description,
          imageUrl,
          ...bookData,
          dateCreated: new Date(),
          lastUpdated: new Date()
        }).returning();
        
        console.log(`[Books Admin] Book created with ID: ${insertedBook.id}`);
        
        // Process authors if provided
        if (authors && Array.isArray(authors) && authors.length > 0) {
          for (const authorData of authors) {
            let authorId;
            
            // Check if author exists by name
            const existingAuthor = authorData.id 
              ? await tx.query.authors.findFirst({
                  where: eq(dbAuthors.id, Number(authorData.id))
                }) 
              : await tx.query.authors.findFirst({
                  where: eq(dbAuthors.name, String(authorData.name))
                });
              
            if (existingAuthor) {
              authorId = existingAuthor.id;
            } else {
              // Create new author
              const [newAuthor] = await tx.insert(dbAuthors).values({
                name: authorData.name,
                imageUrl: authorData.imageUrl,
                dateCreated: new Date(),
                lastUpdated: new Date()
              }).returning();
              authorId = newAuthor.id;
            }
            
            // Link author to book
            await tx.insert(bookAuthors).values({
              bookId: insertedBook.id,
              authorId: authorId,
              role: authorData.role || 'Author'
            });
          }
        }
        
        // Process shelves if provided
        if (shelves && Array.isArray(shelves) && shelves.length > 0) {
          for (const shelfData of shelves) {
            let shelfId;
            
            // Check if shelf exists
            const existingShelf = shelfData.id
              ? await tx.query.shelves.findFirst({
                  where: eq(dbShelves.id, shelfData.id)
                })
              : await tx.query.shelves.findFirst({
                  where: eq(dbShelves.name, shelfData.name)
                });
                
            if (existingShelf) {
              shelfId = existingShelf.id;
            } else {
              // Create new shelf
              const [newShelf] = await tx.insert(dbShelves).values({
                name: shelfData.name,
                dateCreated: new Date()
              }).returning();
              shelfId = newShelf.id;
            }
            
            // Link shelf to book
            await tx.insert(bookShelves).values({
              bookId: insertedBook.id,
              shelfId: shelfId,
              dateAdded: new Date()
            });
          }
        }
        
        // Get the full book with relations
        const fullBook = await tx.query.books.findFirst({
          where: eq(books.id, insertedBook.id),
          with: {
            bookAuthors: {
              with: {
                author: true
              }
            },
            bookShelves: {
              with: {
                shelf: true
              }
            }
          }
        });
        
        // Transform for response
        const transformedBook = fullBook ? {
          ...fullBook,
          authors: fullBook.bookAuthors?.map(ba => ba.author) || [],
          shelves: fullBook.bookShelves?.map(bs => bs.shelf) || [],
          bookAuthors: undefined,
          bookShelves: undefined
        } : null;
        
        res.status(201).json(transformedBook);
      });
      
    } catch (error) {
      console.error("Database Error:", error);
      res.status(500).json({
        error: "Failed to create book",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Update an existing book
  router.put("/api/admin/books/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!req.user?.approved) {
      return res.status(403).json({ error: "Account not approved" });
    }

    const bookId = parseInt(req.params.id);
    if (isNaN(bookId)) {
      return res.status(400).json({ error: "Invalid book ID" });
    }

    const { title, description, imageUrl, authors, shelves, ...bookData } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Book title is required" });
    }

    try {
      console.log(`[Books Admin] Updating book with ID: ${bookId}`);
      
      // Check if book exists
      const existingBook = await db.query.books.findFirst({
        where: eq(books.id, bookId)
      });
      
      if (!existingBook) {
        return res.status(404).json({ error: "Book not found" });
      }
      
      // Process dates
      const processedData = { ...bookData };
      
      // Handle date fields properly
      if (processedData.dateRead) {
        processedData.dateRead = processedData.dateRead ? new Date(processedData.dateRead) : null;
      } else {
        // Don't modify the field if it's empty
        delete processedData.dateRead;
      }
      
      if (processedData.dateAdded) {
        processedData.dateAdded = processedData.dateAdded ? new Date(processedData.dateAdded) : null;
      } else {
        // Don't modify the field if it's empty
        delete processedData.dateAdded;
      }
      
      // Start a transaction to ensure data consistency
      return await db.transaction(async (tx) => {
        // Update the book
        const [updatedBook] = await tx.update(books)
          .set({
            title,
            description,
            imageUrl,
            ...processedData,
            lastUpdated: new Date()
          })
          .where(eq(books.id, bookId))
          .returning();
          
        console.log(`[Books Admin] Book updated: ${updatedBook.title}`);
        
        // Handle authors update if provided
        if (authors && Array.isArray(authors)) {
          // Remove existing book-author relationships
          await tx.delete(bookAuthors)
            .where(eq(bookAuthors.bookId, bookId));
            
          // Add new book-author relationships
          for (const authorData of authors) {
            let authorId;
            
            // Check if author exists
            const existingAuthor = authorData.id 
              ? await tx.query.authors.findFirst({
                  where: eq(dbAuthors.id, authorData.id)
                }) 
              : await tx.query.authors.findFirst({
                  where: eq(dbAuthors.name, authorData.name)
                });
                
            if (existingAuthor) {
              authorId = existingAuthor.id;
            } else {
              // Create new author
              const [newAuthor] = await tx.insert(dbAuthors).values({
                name: authorData.name,
                imageUrl: authorData.imageUrl,
                dateCreated: new Date(),
                lastUpdated: new Date()
              }).returning();
              authorId = newAuthor.id;
            }
            
            // Link author to book
            await tx.insert(bookAuthors).values({
              bookId: updatedBook.id,
              authorId: authorId,
              role: authorData.role || 'Author'
            });
          }
        }
        
        // Handle shelves update if provided
        if (shelves && Array.isArray(shelves)) {
          // Remove existing book-shelf relationships
          await tx.delete(bookShelves)
            .where(eq(bookShelves.bookId, bookId));
            
          // Add new book-shelf relationships
          for (const shelfData of shelves) {
            let shelfId;
            
            // Check if shelf exists
            const existingShelf = shelfData.id
              ? await tx.query.shelves.findFirst({
                  where: eq(dbShelves.id, shelfData.id)
                })
              : await tx.query.shelves.findFirst({
                  where: eq(dbShelves.name, shelfData.name)
                });
                
            if (existingShelf) {
              shelfId = existingShelf.id;
            } else {
              // Create new shelf
              const [newShelf] = await tx.insert(dbShelves).values({
                name: shelfData.name,
                dateCreated: new Date()
              }).returning();
              shelfId = newShelf.id;
            }
            
            // Link shelf to book
            await tx.insert(bookShelves).values({
              bookId: updatedBook.id,
              shelfId: shelfId,
              dateAdded: new Date()
            });
          }
        }
        
        // Get the full updated book with relations
        const fullBook = await tx.query.books.findFirst({
          where: eq(books.id, updatedBook.id),
          with: {
            bookAuthors: {
              with: {
                author: true
              }
            },
            bookShelves: {
              with: {
                shelf: true
              }
            }
          }
        });
        
        // Transform for response
        const transformedBook = fullBook ? {
          ...fullBook,
          authors: fullBook.bookAuthors?.map(ba => ba.author) || [],
          shelves: fullBook.bookShelves?.map(bs => bs.shelf) || [],
          bookAuthors: undefined,
          bookShelves: undefined
        } : null;
        
        res.json(transformedBook);
      });
      
    } catch (error) {
      console.error("Database Error:", error);
      res.status(500).json({
        error: "Failed to update book",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Refine book cover image
  router.post("/api/admin/books/refine-cover", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!req.user?.approved) {
      return res.status(403).json({ error: "Account not approved" });
    }

    const { bookUrl } = req.body;
    
    if (!bookUrl) {
      return res.status(400).json({ error: "Book URL is required" });
    }

    try {
      console.log(`[Books Admin] Refining book cover from URL: ${bookUrl}`);
      
      // Fetch the HTML content from the Goodreads book page
      const response = await axios.get(bookUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const html = response.data;
      const $ = cheerio.load(html);
      
      // Look for the BookCover__image div which contains the high quality image
      const bookCoverImage = $('.BookCover__image img');
      
      if (!bookCoverImage.length) {
        return res.status(404).json({ 
          error: "Book cover image not found on the page", 
          message: "Could not find the high-quality book cover image on the Goodreads page."
        });
      }
      
      // Extract the source URL of the image
      const refinedImageUrl = bookCoverImage.attr('src');
      
      if (!refinedImageUrl) {
        return res.status(404).json({ 
          error: "Image URL not found", 
          message: "Found the image element but could not extract the source URL."
        });
      }
      
      console.log(`[Books Admin] Found refined book cover image: ${refinedImageUrl}`);
      
      // Return the refined image URL
      res.json({ 
        success: true, 
        imageUrl: refinedImageUrl,
        message: "Successfully retrieved high-quality book cover image."
      });
      
    } catch (error) {
      console.error("Error refining book cover:", error);
      res.status(500).json({
        error: "Failed to refine book cover image",
        details: error instanceof Error ? error.message : "Unknown error",
        message: "An error occurred while trying to fetch and parse the Goodreads page."
      });
    }
  });

  // Delete a book
  router.delete("/api/admin/books/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!req.user?.approved) {
      return res.status(403).json({ error: "Account not approved" });
    }

    const bookId = parseInt(req.params.id);
    if (isNaN(bookId)) {
      return res.status(400).json({ error: "Invalid book ID" });
    }

    try {
      console.log(`[Books Admin] Deleting book with ID: ${bookId}`);
      
      // Start a transaction to ensure data consistency
      return await db.transaction(async (tx) => {
        // First, delete related book-author relationships
        await tx.delete(bookAuthors)
          .where(eq(bookAuthors.bookId, bookId));
        
        // Then, delete related book-shelf relationships
        await tx.delete(bookShelves)
          .where(eq(bookShelves.bookId, bookId));
        
        // Finally, delete the book
        const deletedBooks = await tx.delete(books)
          .where(eq(books.id, bookId))
          .returning();
          
        if (deletedBooks.length === 0) {
          return res.status(404).json({ error: "Book not found" });
        }
        
        console.log(`[Books Admin] Book deleted with ID: ${bookId}`);
        res.json({ message: "Book deleted successfully" });
      });
      
    } catch (error) {
      console.error("Database Error:", error);
      res.status(500).json({
        error: "Failed to delete book",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get all authors (for dropdown/selection)
  router.get("/api/admin/authors", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!req.user?.approved) {
      return res.status(403).json({ error: "Account not approved" });
    }

    try {
      console.log("[Books Admin] Fetching all authors");
      
      const authorsList = await db.query.authors.findMany({
        orderBy: [dbAuthors.name]
      });
      
      res.json(authorsList);
      
    } catch (error) {
      console.error("Database Error:", error);
      res.status(500).json({
        error: "Failed to fetch authors",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get all shelves (for dropdown/selection)
  router.get("/api/admin/shelves", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!req.user?.approved) {
      return res.status(403).json({ error: "Account not approved" });
    }

    try {
      console.log("[Books Admin] Fetching all shelves");
      
      const shelvesList = await db.query.shelves.findMany({
        orderBy: [dbShelves.name]
      });
      
      res.json(shelvesList);
      
    } catch (error) {
      console.error("Database Error:", error);
      res.status(500).json({
        error: "Failed to fetch shelves",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Book Importer from Goodreads URL
  router.post("/api/admin/books/import-from-goodreads", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!req.user?.approved) {
      return res.status(403).json({ error: "Account not approved" });
    }

    const { goodreadsUrl } = req.body;
    
    if (!goodreadsUrl) {
      return res.status(400).json({ error: "Goodreads URL is required" });
    }

    try {
      console.log(`[Books Admin] Importing book from Goodreads URL: ${goodreadsUrl}`);
      
      // Extract Goodreads ID from URL
      const goodreadsId = extractGoodreadsIdFromUrl(goodreadsUrl);
      
      if (!goodreadsId) {
        return res.status(400).json({ 
          error: "Invalid Goodreads URL", 
          message: "Could not extract Goodreads book ID from the provided URL."
        });
      }
      
      // Build the full URL
      const fullUrl = `https://www.goodreads.com/book/show/${goodreadsId}`;
      
      // Fetch the HTML content from the Goodreads book page
      const response = await axios.get(fullUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const html = response.data;
      const $ = cheerio.load(html);
      
      // Extract book details
      const bookData = extractBookDataFromHtml($, goodreadsId, fullUrl);
      
      // If no title was found, the scraping failed
      if (!bookData.title) {
        return res.status(404).json({ 
          error: "Book information not found", 
          message: "Could not extract book details from the Goodreads page."
        });
      }
      
      // Extract authors
      const authors = extractAuthorsFromHtml($);
      
      // Extract genres/shelves
      const shelves = extractGenresFromHtml($);
      
      console.log(`[Books Admin] Successfully scraped book: "${bookData.title}" with ${authors.length} authors and ${shelves.length} shelves`);
      
      // Return the extracted data
      res.json({
        success: true,
        book: bookData,
        authors,
        shelves,
        message: "Successfully extracted book data from Goodreads."
      });
      
    } catch (error) {
      console.error("Error importing book from Goodreads:", error);
      res.status(500).json({
        error: "Failed to import book from Goodreads",
        details: error instanceof Error ? error.message : "Unknown error",
        message: "An error occurred while trying to fetch and parse the Goodreads page."
      });
    }
  });
  
  // Helper function to extract Goodreads ID from URL
  function extractGoodreadsIdFromUrl(url: string): string | null {
    if (!url) return null;
    
    // Try to match patterns like:
    // https://www.goodreads.com/book/show/12345.Book_Title
    // https://www.goodreads.com/book/show/12345-book-title
    const matches = url.match(/goodreads\.com\/book\/show\/(\d+)(?:[.-]|$)/);
    
    return matches ? matches[1] : null;
  }
  
  // Helper function to extract book data from HTML
  function extractBookDataFromHtml($: cheerio.CheerioAPI, goodreadsId: string, url: string) {
    // Initialize book data object
    const bookData: any = {
      goodreadsId,
      link: url
    };
    
    // Extract title - multiple potential selectors
    const titleElement = $('h1[data-testid="bookTitle"]');
    if (titleElement.length) {
      bookData.title = titleElement.text().trim();
      
      // Try to extract title without series - this is a bit tricky as it depends on format
      const fullTitle = bookData.title;
      const seriesMatch = fullTitle.match(/(.*?)\s*(?:\(|:|#|\[)/);
      if (seriesMatch) {
        bookData.titleWithoutSeries = seriesMatch[1].trim();
      }
    }
    
    // Extract book cover image
    const bookCoverImage = $('.BookCover__image img');
    if (bookCoverImage.length) {
      bookData.imageUrl = bookCoverImage.attr('src');
    } else {
      // Fallback to other possible image selectors
      const altImage = $('#coverImage, .bookCover img, .cover img').first();
      if (altImage.length) {
        bookData.imageUrl = altImage.attr('src');
      }
    }
    
    // Extract description
    const descriptionElement = $('[data-testid="description"]');
    if (descriptionElement.length) {
      // Get HTML content, then remove all HTML tags to get clean text
      let description = descriptionElement.html() || descriptionElement.text().trim();
      
      // Remove all HTML tags to provide a clean description
      // This regex removes all HTML tags while preserving the text content
      description = description.replace(/<\/?[^>]+(>|$)/g, "");
      // Decode HTML entities
      description = description.replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&nbsp;/g, ' ');
      
      bookData.description = description;
    }
    
    // Extract average rating - first try the data-testid attribute
    const ratingElement = $('[data-testid="averageRating"]');
    if (ratingElement.length) {
      const ratingText = ratingElement.text().trim();
      const ratingMatch = ratingText.match(/(\d+\.\d+)/);
      if (ratingMatch && ratingMatch[1]) {
        bookData.averageRating = parseFloat(ratingMatch[1]);
      }
    }
    
    // If we still don't have a rating, try additional methods
    if (!bookData.averageRating) {
      // Look for star patterns in the text
      const starPattern = /(\d+\.\d+)\s*out of\s*5/i;
      const bodyText = $('body').text();
      const starMatch = bodyText.match(starPattern);
      
      if (starMatch && starMatch[1]) {
        bookData.averageRating = parseFloat(starMatch[1]);
      } else {
        // Try meta tags
        const ratingMeta = $('meta[property="books:rating:value"]');
        if (ratingMeta.length) {
          const ratingValue = ratingMeta.attr('content');
          if (ratingValue) {
            bookData.averageRating = parseFloat(ratingValue);
          }
        }
      }
    }
    
    // Extract pages and publication date from the main page format (as in screenshot 1)
    const mainPageFormat = $('body').text();
    
    // Look for page count pattern like "385 pages, Kindle Edition"
    const pagesPatterns = [
      /(\d+)\s*pages,\s*[^,]+\s*Edition/i,  // "385 pages, Kindle Edition"
      /Format\s+(\d+)\s+pages/i,             // "Format 385 pages"
      /(\d+)\s*pages/i                       // Simple "385 pages" pattern
    ];
    
    // Try each pattern in order
    let pagesFound = false;
    for (const pattern of pagesPatterns) {
      if (pagesFound) break;
      
      const pagesMatch = mainPageFormat.match(pattern);
      if (pagesMatch && pagesMatch[1]) {
        bookData.numPages = parseInt(pagesMatch[1], 10);
        pagesFound = true;
      }
    }
    
    // Special case for the format shown in the screenshot
    if (!pagesFound) {
      // Text like "385 pages, Kindle Edition" at the start of a line
      const pageLineMatch = mainPageFormat.match(/\n\s*(\d+)\s*pages/);
      if (pageLineMatch && pageLineMatch[1]) {
        bookData.numPages = parseInt(pageLineMatch[1], 10);
      }
    }
    
    // Look for publication date pattern like "First published January 1, 2019"
    const publishedDatePattern = /First published\s+([A-Za-z]+\s+\d+,\s+\d{4})/;
    const publishedMatch = mainPageFormat.match(publishedDatePattern);
    if (publishedMatch && publishedMatch[1]) {
      bookData.publicationDate = publishedMatch[1];
      
      // Extract just the year for publicationYear field
      const yearMatch = publishedMatch[1].match(/(\d{4})/);
      if (yearMatch) {
        bookData.publicationYear = parseInt(yearMatch[1], 10);
      }
    }
    
    // Check for "Book details & editions" section
    const bookDetailsButton = $('button:contains("Book details & editions")');
    if (bookDetailsButton.length) {
      // Try to find the details section that would be shown when this button is clicked
      const detailsSection = $('.BookDetails, [data-testid="bookEditionsPanel"]');
      
      // Look for ISBN in book editions section
      detailsSection.find('div').each((i, element) => {
        const text = $(element).text().trim();
        
        // Look for ISBN patterns
        if (text.includes('ISBN')) {
          const isbnMatch = text.match(/ISBN[^0-9]*([\dX]+)/i);
          const isbn13Match = text.match(/ISBN13[^0-9]*([\d]+)/i) || text.match(/ISBN[^0-9]*(97[\d]+)/i);
          
          if (isbn13Match && isbn13Match[1]) {
            bookData.isbn13 = isbn13Match[1].replace(/[^0-9]/g, '');
          }
          
          if (isbnMatch && isbnMatch[1]) {
            const isbn = isbnMatch[1].replace(/[^0-9X]/g, '');
            if (isbn.length === 10) {
              bookData.isbn = isbn;
            } else if (isbn.length === 13 && !bookData.isbn13) {
              bookData.isbn13 = isbn;
            }
          }
        }
        
        // Look for format/pages pattern
        const formatPagesMatch = text.match(/Format\s+(\d+)\s+pages/i);
        if (formatPagesMatch && formatPagesMatch[1] && !bookData.numPages) {
          bookData.numPages = parseInt(formatPagesMatch[1], 10);
        }
        
        // Look for published by pattern
        const publishedByMatch = text.match(/Published\s+([A-Za-z]+\s+\d+,\s+\d{4})\s+by\s+(.+)$/i);
        if (publishedByMatch) {
          if (!bookData.publicationDate) {
            bookData.publicationDate = publishedByMatch[1];
          }
          bookData.publisher = publishedByMatch[2].trim();
        }
      });
    }
    
    // Extract ISBN and other book data from BookDetails section (older Goodreads design)
    const oldDetailsSection = $('.BookDetails');
    oldDetailsSection.find('.BookDetails__row').each((i, element) => {
      const label = $(element).find('.BookDetails__label').text().trim().toLowerCase();
      const value = $(element).find('.BookDetails__value').text().trim();
      
      if (label.includes('isbn')) {
        if (label.includes('13')) {
          bookData.isbn13 = value.replace(/[^0-9]/g, '');
        } else {
          bookData.isbn = value.replace(/[^0-9X]/g, '');
        }
      } else if (label.includes('pages') && !bookData.numPages) {
        const pagesMatch = value.match(/(\d+)/);
        if (pagesMatch) {
          bookData.numPages = parseInt(pagesMatch[1], 10);
        }
      } else if ((label.includes('published') || label.includes('publication')) && !bookData.publicationYear) {
        bookData.publicationDate = value;
        const yearMatch = value.match(/(\d{4})/);
        if (yearMatch) {
          bookData.publicationYear = parseInt(yearMatch[1], 10);
        }
      } else if (label.includes('publisher') && !bookData.publisher) {
        bookData.publisher = value;
      } else if (label.includes('language')) {
        bookData.language = value;
      }
    });
    
    // Last resort - try meta tags for ISBN
    if (!bookData.isbn || !bookData.isbn13) {
      $('meta[property="books:isbn"]').each((i, element) => {
        const isbnValue = $(element).attr('content')?.trim();
        if (isbnValue) {
          if (isbnValue.length === 13) {
            bookData.isbn13 = isbnValue;
          } else if (isbnValue.length === 10) {
            bookData.isbn = isbnValue;
          }
        }
      });
    }
    
    // Look for ISBN in any text on the page if we haven't found it yet
    if (!bookData.isbn || !bookData.isbn13) {
      const pageText = $('body').text();
      const isbnPattern = /ISBN(?:10)?:?\s*([\dX]{10})/i;
      const isbn13Pattern = /ISBN(?:-?13)?:?\s*((?:978|979)[\d]{10})/i;
      
      const isbnMatch = pageText.match(isbnPattern);
      const isbn13Match = pageText.match(isbn13Pattern);
      
      if (isbnMatch && !bookData.isbn) {
        bookData.isbn = isbnMatch[1];
      }
      
      if (isbn13Match && !bookData.isbn13) {
        bookData.isbn13 = isbn13Match[1];
      }
    }
    
    return bookData;
  }
  
  // Helper function to extract authors from HTML
  function extractAuthorsFromHtml($: cheerio.CheerioAPI) {
    const authors: any[] = [];
    
    // Modern GR design author elements
    $('[data-testid="contributorLink"]').each((i, element) => {
      const authorElement = $(element);
      const name = authorElement.text().trim();
      const authorUrl = authorElement.attr('href');
      let goodreadsId = null;
      
      if (authorUrl) {
        const authorIdMatch = authorUrl.match(/author\/show\/(\d+)/);
        if (authorIdMatch) {
          goodreadsId = authorIdMatch[1];
        }
      }
      
      if (name && !authors.some(a => a.name === name)) {
        authors.push({
          name,
          goodreadsId,
          role: 'Author'
        });
      }
    });
    
    // Look for Book Series author line
    $('.BookPageHeader__authorLink').each((i, element) => {
      const authorElement = $(element);
      const name = authorElement.text().trim();
      const authorUrl = authorElement.attr('href');
      let goodreadsId = null;
      
      if (authorUrl) {
        const authorIdMatch = authorUrl.match(/author\/show\/(\d+)/);
        if (authorIdMatch) {
          goodreadsId = authorIdMatch[1];
        }
      }
      
      if (name && !authors.some(a => a.name === name)) {
        authors.push({
          name,
          goodreadsId,
          role: 'Author'
        });
      }
    });
    
    // Look for authors in the body text (by...)
    const byAuthorPattern = /by\s+([A-Za-z\s.'-]+)(?:,|\s*$)/;
    const bodyText = $('body').text();
    const authorMatch = bodyText.match(byAuthorPattern);
    
    if (authorMatch && authorMatch[1] && !authors.some(a => a.name === authorMatch[1].trim())) {
      authors.push({
        name: authorMatch[1].trim(),
        role: 'Author'
      });
    }
    
    // Fallback for older design
    if (authors.length === 0) {
      // Check for author name in meta tags
      $('meta[property="books:author"]').each((i, element) => {
        const name = $(element).attr('content')?.trim();
        if (name && !authors.some(a => a.name === name)) {
          authors.push({
            name,
            role: 'Author'
          });
        }
      });
      
      // Traditional author name selectors
      $('.authorName[itemprop="name"], .authorName span[itemprop="name"], .bookAuthor a.authorName').each((i, element) => {
        const name = $(element).text().trim();
        const authorUrl = $(element).closest('a').attr('href') || $(element).attr('href');
        let goodreadsId = null;
        
        if (authorUrl) {
          const authorIdMatch = authorUrl.match(/author\/show\/(\d+)/);
          if (authorIdMatch) {
            goodreadsId = authorIdMatch[1];
          }
        }
        
        if (name && !authors.some(a => a.name === name)) {
          authors.push({
            name,
            goodreadsId,
            role: 'Author'
          });
        }
      });
    }
    
    return authors;
  }
  
  // Helper function to extract genres/shelves from HTML
  function extractGenresFromHtml($: cheerio.CheerioAPI) {
    const genres: any[] = [];
    
    // First, look for the Genres section which is shown in the screenshot
    const genresText = $('body').text();
    const genresSection = genresText.match(/Genres\s+(.*?)(?=\s+\d+\s*pages|\s*First published|$)/);
    
    if (genresSection && genresSection[1]) {
      const genreList = genresSection[1].split(/\s+(?=[A-Z])/).filter(Boolean);
      
      for (const genre of genreList) {
        const cleanGenre = genre.trim();
        if (cleanGenre && !genres.some(g => g.name === cleanGenre)) {
          genres.push({
            name: cleanGenre
          });
        }
      }
    }
    
    // Method 1: Look for Button__labelItem spans within the genre buttons
    if (genres.length === 0) {
      $('.BookPageMetadataSection__genreButton .Button__labelItem').each((i, element) => {
        const genreText = $(element).text().trim();
        if (genreText && !genres.some(g => g.name === genreText)) {
          genres.push({
            name: genreText
          });
        }
      });
    }
    
    // Method 2: Find all links in the genres container that point to genre pages
    if (genres.length === 0) {
      $('div[data-testid="genresList"] a[href*="/genres/"]').each((i, element) => {
        const genreText = $(element).text().trim();
        if (genreText && !genres.some(g => g.name === genreText)) {
          genres.push({
            name: genreText
          });
        }
      });
    }
    
    // Method 3: Look for any anchors with href containing "/genres/"
    if (genres.length === 0) {
      $('a[href*="/genres/"]').each((i, element) => {
        const genreText = $(element).text().trim();
        if (genreText && !genres.some(g => g.name === genreText)) {
          genres.push({
            name: genreText
          });
        }
      });
    }
    
    // Method 4: Look for shelf assignment text
    if (genres.length === 0) {
      const shelfMatch = genresText.match(/Shelved by.+?(?:as|in)\s+([A-Za-z\s]+)/i);
      if (shelfMatch && shelfMatch[1]) {
        const shelfName = shelfMatch[1].trim();
        if (shelfName && !genres.some(g => g.name === shelfName)) {
          genres.push({
            name: shelfName
          });
        }
      }
    }
    
    return genres;
  }
  
  return router;
}