import { Router } from "express";
import axios from "axios";

// Simple in-memory cache for API responses
const starredArticlesCache: Record<string, {
  timestamp: number,
  data: any[]
}> = {};

// Cache expiration time: 10 minutes
const CACHE_TTL = 10 * 60 * 1000;

export function registerFeedbinRoutes(router: Router) {
  router.get("/api/starred-articles", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.per_page as string) || 9; // Set to 9 to match UI grid
      const month = req.query.month as string || null;
      const year = req.query.year as string || null;

      if (!process.env.FEEDBIN_KEY) {
        throw new Error("FEEDBIN_KEY environment variable is required");
      }

      // Initialize variables with default values
      let articleEntries: any[] = [];
      let totalCount = 0;
      let sinceDate: string | null = null;
      let untilDate: string | null = null;
      
      // Create a cache key if filtering by date
      const isDateFiltered = month && year;
      const cacheKey = isDateFiltered ? `month-${month}-year-${year}` : 'recent';
      
      // Check if we have a recent cached response for this filter
      const cachedResponse = starredArticlesCache[cacheKey];
      const now = Date.now();
      
      if (cachedResponse && (now - cachedResponse.timestamp < CACHE_TTL)) {
        console.log(`Using cached data for ${cacheKey}, age: ${Math.floor((now - cachedResponse.timestamp) / 1000)} seconds`);
        articleEntries = cachedResponse.data;
        
        if (isDateFiltered) {
          // Calculate date range for response metadata
          const jsMonth = parseInt(month) - 1; // Convert to JS 0-based month
          const jsYear = parseInt(year);
          
          const firstDay = new Date(Date.UTC(jsYear, jsMonth, 1, 0, 0, 0));
          const lastDay = new Date(Date.UTC(jsYear, jsMonth + 1, 0, 23, 59, 59));
          
          sinceDate = firstDay.toISOString();
          untilDate = lastDay.toISOString();
        }
        
        totalCount = articleEntries.length;
      } else {
        // No cache hit, need to fetch from API
        console.log(`No valid cache for ${cacheKey}, fetching from API`);
        
        // First, get all starred entry IDs
        const starredEntriesResponse = await axios.get('https://api.feedbin.com/v2/starred_entries.json', {
          headers: {
            Accept: 'application/json',
            Authorization: `Basic ${process.env.FEEDBIN_KEY}`
          }
        });
        
        const allStarredIds = Array.isArray(starredEntriesResponse.data) 
          ? starredEntriesResponse.data 
          : [];
        
        console.log(`Total starred entries: ${allStarredIds.length}`);
        
        if (isDateFiltered) {
          // Calculate date range for the month/year
          const jsMonth = parseInt(month) - 1; // Convert to JS 0-based month
          const jsYear = parseInt(year);
          
          // First day of the month
          const firstDay = new Date(Date.UTC(jsYear, jsMonth, 1, 0, 0, 0));
          // Last day of the month (get day 0 of next month, which is the last day of current month)
          const lastDay = new Date(Date.UTC(jsYear, jsMonth + 1, 0, 23, 59, 59));
          
          sinceDate = firstDay.toISOString();
          untilDate = lastDay.toISOString();
          
          console.log(`Filtering by date range: ${sinceDate} to ${untilDate}`);
          
          // For date-filtered requests, we'll use a more optimized approach
          // Instead of processing all articles in batches (which is very slow),
          // we'll use the since/until parameters of the Feedbin API
          
          try {
            // Get entries directly filtered by date
            const entriesResponse = await axios.get('https://api.feedbin.com/v2/entries.json', {
              params: {
                starred: true,
                since: sinceDate,
                until: untilDate,
                per_page: 100, // Maximum allowed by API
                order: 'desc'  // Newest first
              },
              headers: {
                Accept: 'application/json',
                Authorization: `Basic ${process.env.FEEDBIN_KEY}`
              }
            });
            
            // Add to our collection
            articleEntries = entriesResponse.data;
            
            // If we got max results, we need to paginate through additional pages
            // (Feedbin API has a limit of 100 per page)
            if (articleEntries.length === 100) {
              let currentPage = 2;
              let hasMore = true;
              
              // Maximum of 10 pages (1000 articles) for performance reasons
              while (hasMore && currentPage <= 10) {
                try {
                  const nextPageResponse = await axios.get('https://api.feedbin.com/v2/entries.json', {
                    params: {
                      starred: true,
                      since: sinceDate,
                      until: untilDate,
                      page: currentPage,
                      per_page: 100,
                      order: 'desc'
                    },
                    headers: {
                      Accept: 'application/json',
                      Authorization: `Basic ${process.env.FEEDBIN_KEY}`
                    }
                  });
                  
                  const nextPageEntries = nextPageResponse.data;
                  if (nextPageEntries.length > 0) {
                    articleEntries = [...articleEntries, ...nextPageEntries];
                    currentPage++;
                  } else {
                    hasMore = false;
                  }
                } catch (error) {
                  console.error(`Error fetching page ${currentPage}:`, error);
                  hasMore = false;
                }
              }
            }
            
            totalCount = articleEntries.length;
            console.log(`Total entries for ${month}/${year}: ${totalCount}`);
            
            // Cache the results
            starredArticlesCache[cacheKey] = {
              timestamp: now,
              data: articleEntries
            };
            
          } catch (error) {
            console.error('Error fetching filtered entries:', error);
          }
        } else {
          // No date filtering - get the latest starred entries
          try {
            // Get entries directly from the API with pagination
            const entriesResponse = await axios.get('https://api.feedbin.com/v2/entries.json', {
              params: {
                starred: true,
                page: 1,
                per_page: 100, // Max per page
                order: 'desc'  // Newest first
              },
              headers: {
                Accept: 'application/json',
                Authorization: `Basic ${process.env.FEEDBIN_KEY}`
              }
            });
            
            articleEntries = entriesResponse.data;
            totalCount = allStarredIds.length;
            
            // Cache the results
            starredArticlesCache[cacheKey] = {
              timestamp: now,
              data: articleEntries
            };
            
          } catch (error) {
            console.error('Error fetching recent entries:', error);
          }
        }
      }
      
      // Apply pagination
      const startIndex = (page - 1) * perPage;
      const endIndex = Math.min(startIndex + perPage, articleEntries.length);
      const pageEntries = articleEntries.slice(startIndex, endIndex);

      // Fetch content details for each article
      const articlesWithDetails = await Promise.all(
        pageEntries.map(async (article: any) => {
          try {
            if (article.extracted_content_url) {
              const contentResponse = await axios.get(article.extracted_content_url);
              return {
                ...article,
                lead_image_url: contentResponse.data.lead_image_url,
                excerpt: contentResponse.data.excerpt
              };
            }
            return article;
          } catch (error) {
            console.error(`Error fetching content for article ${article.id}:`, error);
            return article;
          }
        })
      );

      const articles = articlesWithDetails.map((article: any) => ({
        id: article?.id ?? 0,
        title: article?.title ?? 'Untitled Article',
        author: article?.author ?? 'Unknown Author',
        summary: article?.excerpt ?? article?.summary ?? article?.content ?? 'No content available',
        url: article?.url ?? '#',
        lead_image_url: article?.lead_image_url ?? null,
        published: article?.published ?? new Date().toISOString(),
        feed: {
          title: article?.feed?.title ?? 'Unknown Feed',
          url: article?.feed?.feed_url ?? '#'
        }
      }));

      const totalPages = Math.ceil(totalCount / perPage);

      res.json({
        articles,
        pagination: {
          current_page: page,
          per_page: perPage,
          total: totalCount,
          total_pages: totalPages
        },
        dateFilter: {
          since: sinceDate,
          until: untilDate,
          month: month ? parseInt(month) : null,
          year: year ? parseInt(year) : null
        }
      });

    } catch (error) {
      console.error("Error fetching starred articles:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch starred articles",
        articles: [],
        pagination: {
          current_page: 1,
          per_page: 20,
          total: 0,
          total_pages: 0
        },
        dateFilter: {
          since: null,
          until: null,
          month: null,
          year: null
        }
      });
    }
  });
}
