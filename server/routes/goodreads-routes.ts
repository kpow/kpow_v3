import { Router } from "express";
import axios from "axios";
import {
  parseXMLAsync,
  GOODREADS_API_BASE,
  GOODREADS_USER_ID,
  GOODREADS_API_KEY,
} from "../utils/api-utils";
import { db } from "../../db";
import { books, authors, shelves, bookAuthors, bookShelves } from "../../db/schema";
import { desc, asc, eq, sql, and, or, ilike } from "drizzle-orm";

export function registerGoodreadsRoutes(router: Router) {
  // Endpoint to get all shelves for filter dropdown
  router.get("/api/shelves", async (req, res) => {
    try {
      console.log("Fetching all shelves for filter dropdown");
      
      const shelvesList = await db.query.shelves.findMany({
        orderBy: asc(shelves.name)
      });
      
      res.json(shelvesList);
    } catch (error) {
      console.error("Error fetching shelves:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to fetch shelves"
      });
    }
  });
  // Enhanced endpoint to fetch books from database with search, sort, and filter
  router.get("/api/db-books", async (req, res) => {
    try {
      // Extract pagination parameters
      const page = parseInt(req.query.page as string || "1");
      const perPage = parseInt(req.query.per_page as string || "6");
      
      // Extract search parameters
      const titleAuthorSearch = req.query.search as string | undefined;
      const descriptionSearch = req.query.description_search as string | undefined;
      const shelfFilter = req.query.shelf as string | undefined;
      
      // Extract sorting parameters
      const sortBy = req.query.sort_by as string || "user_rating";
      const sortOrder = req.query.sort_order as "asc" | "desc" || "desc";
      
      console.log(`Fetching books page ${page} with ${perPage} items per page from database`);
      console.log(`Search params: title/author=${titleAuthorSearch}, description=${descriptionSearch}, shelf=${shelfFilter}`);
      console.log(`Sort: ${sortBy} ${sortOrder}`);
      
      // Calculate offset
      const offset = (page - 1) * perPage;
      
      // Build where conditions for filtering
      const whereConditions = [];
      
      // Title or author search
      if (titleAuthorSearch) {
        // We need to join with authors to search by author name
        const titleAuthorCondition = or(
          ilike(books.title, `%${titleAuthorSearch}%`),
          ilike(books.titleWithoutSeries || '', `%${titleAuthorSearch}%`)
        );
        whereConditions.push(titleAuthorCondition);
      }
      
      // Description search
      if (descriptionSearch) {
        whereConditions.push(
          sql`${books.description} IS NOT NULL`,
          ilike(books.description || '', `%${descriptionSearch}%`)
        );
      }
      
      // Build the where clause
      const whereClause = whereConditions.length > 0 
        ? and(...whereConditions) 
        : undefined;
      
      // Determine the orderBy based on sortBy and sortOrder
      let orderByClause;
      switch (sortBy) {
        case "title":
          orderByClause = sortOrder === "asc" ? asc(books.title) : desc(books.title);
          break;
        case "user_rating":
          orderByClause = sortOrder === "asc" ? asc(books.userRating) : desc(books.userRating);
          break;
        case "average_rating":
          orderByClause = sortOrder === "asc" ? asc(books.averageRating) : desc(books.averageRating);
          break;
        case "date_read":
          orderByClause = sortOrder === "asc" ? asc(books.dateRead) : desc(books.dateRead);
          break;
        case "date_added":
          orderByClause = sortOrder === "asc" ? asc(books.dateAdded) : desc(books.dateAdded);
          break;
        default:
          // Default sort by user rating desc, then date read desc
          orderByClause = [desc(books.userRating), desc(books.dateRead), desc(books.dateAdded), desc(books.id)];
      }
      
      // First, get the count of books matching filter conditions
      let countQuery = db.select({ count: sql<number>`count(*)` }).from(books);
      
      if (whereClause) {
        countQuery = countQuery.where(whereClause);
      }
      
      // If filtering by shelf, we need to join with book_shelves and shelves
      if (shelfFilter) {
        countQuery = db.select({ 
          count: sql<number>`count(distinct ${books.id})` 
        })
        .from(books)
        .leftJoin(bookShelves, eq(books.id, bookShelves.bookId))
        .leftJoin(shelves, eq(bookShelves.shelfId, shelves.id))
        .where(and(
          whereClause || sql`1=1`,
          eq(shelves.name, shelfFilter)
        ));
      }
      
      const [countResult] = await countQuery;
      const total = Number(countResult.count);
      const totalPages = Math.ceil(total / perPage);
      
      // Base query to fetch books with related data
      let booksQuery = db.query.books.findMany({
        limit: perPage,
        offset,
        where: whereClause,
        orderBy: Array.isArray(orderByClause) ? orderByClause : [orderByClause],
        with: {
          // Load related authors
          bookAuthors: {
            with: {
              author: true
            }
          },
          // Load related shelves
          bookShelves: {
            with: {
              shelf: true
            }
          }
        }
      });
      
      // If we have a shelf filter, we need a different approach
      let booksData: any[] = [];
      if (shelfFilter) {
        // For shelf filtering, we need a more complex query
        const bookIds = await db.select({ id: books.id })
          .from(books)
          .leftJoin(bookShelves, eq(books.id, bookShelves.bookId))
          .leftJoin(shelves, eq(bookShelves.shelfId, shelves.id))
          .where(and(
            whereClause || sql`1=1`,
            eq(shelves.name, shelfFilter)
          ))
          // Use individual orderBy elements instead of an array
          .orderBy(
            sortBy === "title" 
              ? sortOrder === "asc" ? asc(books.title) : desc(books.title)
              : sortBy === "user_rating"
                ? sortOrder === "asc" ? asc(books.userRating) : desc(books.userRating)
                : sortBy === "average_rating"
                  ? sortOrder === "asc" ? asc(books.averageRating) : desc(books.averageRating)
                  : sortBy === "date_read"
                    ? sortOrder === "asc" ? asc(books.dateRead) : desc(books.dateRead)
                    : sortBy === "date_added"
                      ? sortOrder === "asc" ? asc(books.dateAdded) : desc(books.dateAdded)
                      : desc(books.userRating)
          )
          .limit(perPage)
          .offset(offset);
        
        if (bookIds.length === 0) {
          booksData = [];
        } else {
          // Fetch full book data with relations for the filtered IDs
          const ids = bookIds.map(book => book.id);
          booksData = await db.query.books.findMany({
            where: (books, { inArray }) => inArray(books.id, ids),
            // Use same pattern for orderBy
            orderBy: sortBy === "title" 
              ? sortOrder === "asc" ? asc(books.title) : desc(books.title)
              : sortBy === "user_rating"
                ? sortOrder === "asc" ? asc(books.userRating) : desc(books.userRating)
                : sortBy === "average_rating"
                  ? sortOrder === "asc" ? asc(books.averageRating) : desc(books.averageRating)
                  : sortBy === "date_read"
                    ? sortOrder === "asc" ? asc(books.dateRead) : desc(books.dateRead)
                    : sortBy === "date_added"
                      ? sortOrder === "asc" ? asc(books.dateAdded) : desc(books.dateAdded)
                      : desc(books.userRating),
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
        }
      } else {
        // Standard query without shelf filtering
        booksData = await booksQuery;
      }
      
      // Transform data to match Goodreads API response format
      const transformedBooks = booksData.map((book: any) => {
        // Format data in the structure expected by the frontend
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
                  author: book.bookAuthors.map((ba: any) => ({
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
            shelf: book.bookShelves.map((bs: any) => ({
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
        }
      };
      
      res.json(responseData);
    } catch (error) {
      console.error("Error fetching books from database:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to fetch books from database"
      });
    }
  });
  router.get("/api/books", async (req, res) => {
    try {
      const page = req.query.page || "1";
      const perPage = req.query.per_page || "6";

      const url = `${GOODREADS_API_BASE}/review/list/${GOODREADS_USER_ID}.xml`;
      console.log(
        `Fetching books page ${page} with ${perPage} items per page from Goodreads`,
      );

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

      const result = await parseXMLAsync(response.data) as any;

      const reviews = result.GoodreadsResponse.reviews[0];

      // Extract pagination metadata
      const total = parseInt(reviews.$.total);
      const start = parseInt(reviews.$.start);
      const end = parseInt(reviews.$.end);
      const currentPage = parseInt(page as string);
      const totalPages = Math.ceil(total / parseInt(perPage as string));

      // Add ratings data to the response
      const reviewsWithRatings = reviews.review.map((review: any) => ({
        ...review,
        ratings: {
          user_rating: review.rating?.[0] ?? "0",
          average_rating: review.book?.[0]?.average_rating?.[0] ?? "0",
        },
      }));

      const responseData = {
        GoodreadsResponse: {
          ...result.GoodreadsResponse,
          reviews: [
            {
              ...reviews,
              review: reviewsWithRatings,
            },
          ],
        },
        pagination: {
          total,
          start,
          end,
          currentPage,
          totalPages,
          hasMore: currentPage < totalPages,
        },
      };

      res.json(responseData);
    } catch (error) {
      console.error("Error fetching books from Goodreads:", error);
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to fetch books",
      });
    }
  });
}
