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
  // New endpoint to fetch books from database
  router.get("/api/db-books", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string || "1");
      const perPage = parseInt(req.query.per_page as string || "6");
      
      console.log(`Fetching books page ${page} with ${perPage} items per page from database`);
      
      // Calculate offset
      const offset = (page - 1) * perPage;
      
      // Get total count
      const [countResult] = await db.select({ 
        count: sql<number>`count(*)` 
      }).from(books);
      
      const total = Number(countResult.count);
      const totalPages = Math.ceil(total / perPage);
      
      // Fetch books with pagination
      const booksData = await db.query.books.findMany({
        limit: perPage,
        offset,
        orderBy: [desc(books.dateRead), desc(books.dateAdded), desc(books.id)],
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
      
      // Transform data to match Goodreads API response format
      const transformedBooks = booksData.map(book => {
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

      const result = await parseXMLAsync(response.data);

      const reviews = result.GoodreadsResponse.reviews[0];

      // Extract pagination metadata
      const total = parseInt(reviews.$.total);
      const start = parseInt(reviews.$.start);
      const end = parseInt(reviews.$.end);
      const currentPage = parseInt(page as string);
      const totalPages = Math.ceil(total / parseInt(perPage as string));

      // Add ratings data to the response
      const reviewsWithRatings = reviews.review.map((review) => ({
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
