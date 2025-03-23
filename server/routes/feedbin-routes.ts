import { Router } from "express";
import axios from "axios";

export function registerFeedbinRoutes(router: Router) {
  router.get("/api/starred-articles", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.per_page as string) || 20;
      const since = req.query.since as string || null;
      const until = req.query.until as string || null;
      const month = req.query.month as string || null;
      const year = req.query.year as string || null;

      if (!process.env.FEEDBIN_KEY) {
        throw new Error("FEEDBIN_KEY environment variable is required");
      }

      // First determine if we need date filtering
      const isDateFiltered = month && year;
      
      // Initialize variables with default values
      let response: { data: any[] } = { data: [] };
      let totalCount = 0;
      let sinceDate: string | null = null;
      let untilDate: string | null = null;
      
      if (isDateFiltered) {
        console.log(`Filtering by date: Month ${month}, Year ${year}`);
        
        // Convert month to a JS month (0-based)
        const jsMonth = parseInt(month) - 1;
        const jsYear = parseInt(year);
        
        // First day of the month
        const firstDay = new Date(jsYear, jsMonth, 1);
        // Last day of the month (get day 0 of next month, which is the last day of current month)
        const lastDay = new Date(jsYear, jsMonth + 1, 0, 23, 59, 59);
        
        // Format dates for Feedbin API
        sinceDate = firstDay.toISOString();
        untilDate = lastDay.toISOString();
        
        console.log(`Date range: ${sinceDate} to ${untilDate}`);
        
        // First find the exact entry IDs from the time period
        const starredEntriesResponse = await axios.get('https://api.feedbin.com/v2/starred_entries.json', {
          headers: {
            Accept: 'application/json',
            Authorization: `Basic ${process.env.FEEDBIN_KEY}`
          }
        });
        
        // Get the array of all starred entry IDs
        const starredEntryIds = Array.isArray(starredEntriesResponse.data) ? starredEntriesResponse.data : [];
        console.log(`Got ${starredEntryIds.length} total starred entries`);
        
        // Now we need to get the actual entry data for these IDs to filter by date
        // We'll get them in batches to avoid overwhelming the API
        const BATCH_SIZE = 100;
        let allFilteredEntries: any[] = [];
        
        // Process starred entries in batches to filter by date
        for (let i = 0; i < starredEntryIds.length; i += BATCH_SIZE) {
          const batchIds = starredEntryIds.slice(i, i + BATCH_SIZE);
          
          try {
            const batchResponse = await axios.get('https://api.feedbin.com/v2/entries.json', {
              params: {
                ids: batchIds.join(','),
              },
              headers: {
                Accept: 'application/json',
                Authorization: `Basic ${process.env.FEEDBIN_KEY}`
              }
            });
            
            // Filter entries by publication date
            const batchEntries = batchResponse.data;
            const filteredBatch = batchEntries.filter((entry: any) => {
              const publishDate = new Date(entry.published);
              const sinceDateObj = sinceDate ? new Date(sinceDate) : null;
              const untilDateObj = untilDate ? new Date(untilDate) : null;
              
              return (
                (!sinceDateObj || publishDate >= sinceDateObj) && 
                (!untilDateObj || publishDate <= untilDateObj)
              );
            });
            
            allFilteredEntries = [...allFilteredEntries, ...filteredBatch];
            console.log(`Processed batch ${i/BATCH_SIZE + 1}, found ${filteredBatch.length} matching entries`);
          } catch (error) {
            console.error(`Error processing batch ${i/BATCH_SIZE + 1}:`, error);
          }
        }
        
        // Sort by published date descending (newest first)
        allFilteredEntries.sort((a: any, b: any) => {
          return new Date(b.published).getTime() - new Date(a.published).getTime();
        });
        
        // Calculate total and pagination
        totalCount = allFilteredEntries.length;
        console.log(`Found ${totalCount} articles for ${month}/${year}`);
        
        // Calculate pagination manually
        const startIndex = (page - 1) * perPage;
        const endIndex = Math.min(startIndex + perPage, totalCount);
        
        // Get the page slice
        const pageEntries = allFilteredEntries.slice(startIndex, endIndex);
        
        // Construct response for processing
        response = { data: pageEntries };
      
      } else {
        // No date filtering - get all starred entries
        console.log('No date filtering, getting all starred entries');
        
        // Step 1: First, get all starred entry IDs
        const starredEntriesResponse = await axios.get('https://api.feedbin.com/v2/starred_entries.json', {
          headers: {
            Accept: 'application/json',
            Authorization: `Basic ${process.env.FEEDBIN_KEY}`
          }
        });
        
        // Get the array of starred entry IDs
        const starredEntryIds = Array.isArray(starredEntriesResponse.data) ? starredEntriesResponse.data : [];
        totalCount = starredEntryIds.length;
        console.log(`Total starred entries: ${totalCount}`);
        
        // Calculate pagination for the entry IDs - we want to fetch a bit more than needed
        // to ensure we can sort them properly
        const batchSize = Math.min(perPage * 2, 100); // Limit batch size to avoid API limits
        const startIndex = (page - 1) * perPage;
        const endIndex = Math.min(startIndex + batchSize, totalCount);
        
        // Get the subset of IDs for the current page plus some extra for sorting
        const pageEntryIds = starredEntryIds.slice(startIndex, endIndex);
        
        // Fetch entries for the current page
        const entriesResponse = await axios.get('https://api.feedbin.com/v2/entries.json', {
          params: {
            ids: pageEntryIds.join(',')
          },
          headers: {
            Accept: 'application/json',
            Authorization: `Basic ${process.env.FEEDBIN_KEY}`
          }
        });
        
        // Sort entries by published date (newest first)
        const sortedEntries = entriesResponse.data.sort((a: any, b: any) => {
          return new Date(b.published).getTime() - new Date(a.published).getTime();
        });
        
        // Take only the entries we need for this page
        const pageEntries = sortedEntries.slice(0, perPage);
        
        // Create the response object for further processing
        response = { data: pageEntries };
      }

      // Fetch content details for each article
      const articlesWithDetails = await Promise.all(
        response.data.map(async (article: any) => {
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
