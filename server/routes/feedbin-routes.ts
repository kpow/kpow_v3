import { Router } from "express";
import axios from "axios";

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
      
      // Check if filtering by date
      const isDateFiltered = month && year;
      
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
        
        // Get entries in batches (Feedbin API limits)
        const BATCH_SIZE = 100;
        const batches = Math.ceil(allStarredIds.length / BATCH_SIZE);
        
        // For each batch of IDs
        for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
          const start = batchIndex * BATCH_SIZE;
          const end = Math.min(start + BATCH_SIZE, allStarredIds.length);
          const batchIds = allStarredIds.slice(start, end);
          
          if (batchIds.length === 0) continue;
          
          try {
            // Fetch entry data
            const entriesResponse = await axios.get('https://api.feedbin.com/v2/entries.json', {
              params: { ids: batchIds.join(',') },
              headers: {
                Accept: 'application/json',
                Authorization: `Basic ${process.env.FEEDBIN_KEY}`
              }
            });
            
            // Filter by date
            const entries = entriesResponse.data;
            
            // Filter entries from the specific month/year
            const filteredEntries = entries.filter((entry: any) => {
              if (!entry.published) return false;
              
              const publishDate = new Date(entry.published);
              return publishDate >= firstDay && publishDate <= lastDay;
            });
            
            // Add to our collection
            articleEntries = [...articleEntries, ...filteredEntries];
            console.log(`Batch ${batchIndex + 1}/${batches}: Found ${filteredEntries.length} entries from ${month}/${year}`);
          } catch (error) {
            console.error(`Error processing batch ${batchIndex + 1}:`, error);
          }
        }
        
        // Sort in reverse chronological order (newest first)
        articleEntries.sort((a, b) => {
          return new Date(b.published).getTime() - new Date(a.published).getTime();
        });
        
        totalCount = articleEntries.length;
        console.log(`Total entries for ${month}/${year}: ${totalCount}`);
      } else {
        // No date filtering - get the latest starred entries
        
        // We'll use a different approach for the non-filtered case
        // Get a page of the most recent entries directly from the API
        const ENTRIES_PER_REQUEST = 100; // Maximum allowed by API
        const pagesToFetch = Math.ceil(perPage / ENTRIES_PER_REQUEST);
        
        for (let i = 0; i < pagesToFetch; i++) {
          try {
            // Get entries in descending order (newest first)
            const entriesResponse = await axios.get('https://api.feedbin.com/v2/entries.json', {
              params: {
                starred: true,
                page: i + 1,
                per_page: ENTRIES_PER_REQUEST,
                order: 'desc' // Newest first
              },
              headers: {
                Accept: 'application/json',
                Authorization: `Basic ${process.env.FEEDBIN_KEY}`
              }
            });
            
            // Add to our collection
            articleEntries = [...articleEntries, ...entriesResponse.data];
            
            // If we have enough entries, stop fetching
            if (articleEntries.length >= perPage) {
              articleEntries = articleEntries.slice(0, perPage);
              break;
            }
          } catch (error) {
            console.error(`Error fetching entries page ${i + 1}:`, error);
          }
        }
        
        // Set total count to total starred entries
        totalCount = allStarredIds.length;
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
