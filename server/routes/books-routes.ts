import { Router } from "express";
import { db } from "../../db";
import { books, authors, shelves, bookAuthors, bookShelves } from "../../db/schema";
import { desc, asc, eq, sql, and, or, ilike } from "drizzle-orm";

export function registerBooksRoutes(router: Router) {
  // Enhanced endpoint to fetch books from database with search, filter, and sort capabilities
  router.get("/api/books/search", async (req, res) => {
    try {
      // Pagination parameters
      const page = parseInt(req.query.page as string || "1");
      const perPage = parseInt(req.query.per_page as string || "6");
      
      // Search parameters
      const searchQuery = (req.query.search as string || "").trim();
      const searchInDescription = req.query.search_description === "true";
      
      // Filter parameters
      const shelfFilter = req.query.shelf as string;
      
      // Sort parameters
      const sortBy = req.query.sort_by as string || "userRating";
      const sortOrder = req.query.sort_order as string || "desc";
      
      console.log(`Enhanced Book Search - Page: ${page}, PerPage: ${perPage}, Search: "${searchQuery}", SearchDesc: ${searchInDescription}, Shelf: ${shelfFilter}, Sort: ${sortBy} ${sortOrder}`);
      
      // Calculate offset
      const offset = (page - 1) * perPage;
      
      // Fetch all books with their relations for filtering
      const allBooks = await db.query.books.findMany({
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
      
      // Apply filtering in memory
      let filteredBooks = allBooks;
      
      // Apply search and filter criteria
      if (searchQuery || shelfFilter) {
        filteredBooks = allBooks.filter(book => {
          let matchesSearch = true;
          let matchesShelf = true;
          
          if (searchQuery) {
            const titleMatch = book.title && book.title.toLowerCase().includes(searchQuery.toLowerCase());
            
            const descMatch = searchInDescription && book.description && 
              book.description.toLowerCase().includes(searchQuery.toLowerCase());
            
            const authorMatch = book.bookAuthors.some(ba => 
              ba.author.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            
            matchesSearch = titleMatch || descMatch || authorMatch;
          }
          
          if (shelfFilter) {
            matchesShelf = book.bookShelves.some(bs => 
              bs.shelf.name === shelfFilter
            );
          }
          
          return matchesSearch && matchesShelf;
        });
      }
      
      // Sort the filtered books
      filteredBooks = filteredBooks.sort((a, b) => {
        let valueA, valueB;
        
        switch (sortBy) {
          case "title":
            valueA = a.title || "";
            valueB = b.title || "";
            return sortOrder === "asc" 
              ? valueA.localeCompare(valueB) 
              : valueB.localeCompare(valueA);
          
          case "userRating":
            valueA = parseFloat(a.userRating || "0");
            valueB = parseFloat(b.userRating || "0");
            return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
          
          case "averageRating":
            valueA = parseFloat(a.averageRating || "0");
            valueB = parseFloat(b.averageRating || "0");
            return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
          
          case "dateRead":
            valueA = a.dateRead ? new Date(a.dateRead).getTime() : 0;
            valueB = b.dateRead ? new Date(b.dateRead).getTime() : 0;
            return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
          
          case "dateAdded":
            valueA = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
            valueB = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
            return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
          
          default:
            // Default sort by user rating desc
            valueA = parseFloat(a.userRating || "0");
            valueB = parseFloat(b.userRating || "0");
            return valueB - valueA;
        }
      });
      
      // Calculate pagination values
      const total = filteredBooks.length;
      const totalPages = Math.ceil(total / perPage);
      
      // Apply pagination
      const paginatedBooks = filteredBooks.slice(offset, offset + perPage);
      
      // Transform data to match expected API format
      const transformedBooks = paginatedBooks.map(book => {
        return {
          book: [
            {
              id: [book.goodreadsId],
              title: [book.title],
              title_without_series: [book.titleWithoutSeries],
              description: [book.description],
              image_url: [book.imageUrl],
              link: [book.link],
              average_rating: [book.averageRating],
              authors: [
                {
                  author: book.bookAuthors.map(ba => ({
                    id: [ba.author.goodreadsId],
                    name: [ba.author.name]
                  }))
                }
              ]
            }
          ],
          ratings: {
            user_rating: book.userRating,
            average_rating: book.averageRating
          },
          shelves: {
            shelf: book.bookShelves.map(bs => ({
              $: {
                name: bs.shelf.name
              }
            }))
          }
        };
      });
      
      // Create response
      const responseData = {
        GoodreadsResponse: {
          reviews: [
            {
              $: { 
                total: total.toString(), 
                start: (offset + 1).toString(), 
                end: Math.min(offset + perPage, total).toString() 
              },
              review: transformedBooks
            }
          ]
        },
        pagination: {
          total,
          start: offset + 1,
          end: Math.min(offset + perPage, total),
          currentPage: page,
          totalPages,
          hasMore: page < totalPages
        },
        filters: {
          search: searchQuery,
          searchInDescription,
          shelf: shelfFilter
        },
        sorting: {
          sortBy,
          sortOrder
        }
      };
      
      res.json(responseData);
    } catch (error) {
      console.error("Error in enhanced book search:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to search books"
      });
    }
  });

  // Endpoint to get all available shelves for filtering
  router.get("/api/books/shelves", async (req, res) => {
    try {
      const shelvesList = await db.query.shelves.findMany({
        orderBy: [asc(shelves.name)]
      });
      
      res.json({
        shelves: shelvesList
      });
    } catch (error) {
      console.error("Error fetching shelves list:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to fetch shelves"
      });
    }
  });
}