import { Router } from "express";
import axios from "axios";
import { parseXMLAsync, GOODREADS_API_BASE, GOODREADS_USER_ID, GOODREADS_API_KEY } from "../utils/api-utils";

export function registerGoodreadsRoutes(router: Router) {
  router.get("/api/books", async (req, res) => {
    try {
      const page = req.query.page || "1";
      const perPage = req.query.per_page || "6"; 

      const url = `${GOODREADS_API_BASE}/review/list/${GOODREADS_USER_ID}.xml`;
      console.log(`Fetching books page ${page} with ${perPage} items per page from Goodreads`);

      const response = await axios.get(url, {
        params: {
          key: GOODREADS_API_KEY,
          v: "2",
          per_page: perPage,
          page: page,
          shelf: "read",
          sort: "date_read",
          order: "d"
        }
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
      const reviewsWithRatings = reviews.review.map(review => ({
        ...review,
        ratings: {
          user_rating: review.rating?.[0] ?? "0",
          average_rating: review.book?.[0]?.average_rating?.[0] ?? "0"
        }
      }));

      const responseData = {
        GoodreadsResponse: {
          ...result.GoodreadsResponse,
          reviews: [{
            ...reviews,
            review: reviewsWithRatings
          }]
        },
        pagination: {
          total,
          start,
          end,
          currentPage,
          totalPages,
          hasMore: currentPage < totalPages
        }
      };

      res.json(responseData);
    } catch (error) {
      console.error("Error fetching books from Goodreads:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch books"
      });
    }
  });
}
