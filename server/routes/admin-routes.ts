import { Router } from "express";
import axios from "axios";
import { db } from "@db";
import { artists, songs, plays, books, authors, shelves, bookAuthors, bookShelves } from "@db/schema";
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
      
      // Dynamically build order by clause
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
        authors: book.bookAuthors.map(ba => ba.author),
        shelves: book.bookShelves.map(bs => bs.shelf),
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
                  where: eq(authors.id, Number(authorData.id))
                }) 
              : await tx.query.authors.findFirst({
                  where: eq(authors.name, String(authorData.name))
                });
              
            if (existingAuthor) {
              authorId = existingAuthor.id;
            } else {
              // Create new author
              const [newAuthor] = await tx.insert(authors).values({
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
                  where: eq(shelves.id, shelfData.id)
                })
              : await tx.query.shelves.findFirst({
                  where: eq(shelves.name, shelfData.name)
                });
                
            if (existingShelf) {
              shelfId = existingShelf.id;
            } else {
              // Create new shelf
              const [newShelf] = await tx.insert(shelves).values({
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
        const transformedBook = {
          ...fullBook,
          authors: fullBook.bookAuthors.map(ba => ba.author),
          shelves: fullBook.bookShelves.map(bs => bs.shelf),
          bookAuthors: undefined,
          bookShelves: undefined
        };
        
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
      
      // Start a transaction to ensure data consistency
      return await db.transaction(async (tx) => {
        // Update the book
        const [updatedBook] = await tx.update(books)
          .set({
            title,
            description,
            imageUrl,
            ...bookData,
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
                  where: eq(authors.id, authorData.id)
                }) 
              : await tx.query.authors.findFirst({
                  where: eq(authors.name, authorData.name)
                });
                
            if (existingAuthor) {
              authorId = existingAuthor.id;
            } else {
              // Create new author
              const [newAuthor] = await tx.insert(authors).values({
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
                  where: eq(shelves.id, shelfData.id)
                })
              : await tx.query.shelves.findFirst({
                  where: eq(shelves.name, shelfData.name)
                });
                
            if (existingShelf) {
              shelfId = existingShelf.id;
            } else {
              // Create new shelf
              const [newShelf] = await tx.insert(shelves).values({
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
        const transformedBook = {
          ...fullBook,
          authors: fullBook.bookAuthors.map(ba => ba.author),
          shelves: fullBook.bookShelves.map(bs => bs.shelf),
          bookAuthors: undefined,
          bookShelves: undefined
        };
        
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
        orderBy: [authors.name]
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
        orderBy: [shelves.name]
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
  
  return router;
}