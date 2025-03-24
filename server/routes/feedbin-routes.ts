import { Router } from "express";
import axios from "axios";
import { 
  findPageForMonth, 
  loadMonthIndex, 
  updateMonthIndex, 
  getAvailableMonths, 
  getMonthName
} from "../utils/feedbin-utils";

export function registerFeedbinRoutes(router: Router) {
  router.get("/api/starred-articles", async (req, res) => {
    try {
      // Parse query parameters
      const requestedPage = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.per_page as string) || 20;
      const month = req.query.month ? parseInt(req.query.month as string) : null;
      const year = req.query.year ? parseInt(req.query.year as string) : null;
      
      console.log(`Request params: month=${month}, year=${year}, page=${requestedPage}`);
      
      // Default to requested page
      let page = requestedPage;
      
      // Check if we need to use a date filter
      let since = null;
      let until = null;
      
      if (month !== null && year !== null) {
        // Create date range for the specified month/year
        // For the beginning of the month
        since = new Date(year, month - 1, 1).toISOString();
        // For the end of the month (first day of next month minus 1 millisecond)
        const nextMonth = month === 12 ? new Date(year + 1, 0, 1) : new Date(year, month, 1);
        nextMonth.setMilliseconds(-1);
        until = nextMonth.toISOString();
        
        console.log(`Date range for ${getMonthName(month)} ${year}:`);
        console.log(`  From: ${since}`);
        console.log(`  To:   ${until}`);
      }

      if (!process.env.FEEDBIN_KEY) {
        throw new Error("FEEDBIN_KEY environment variable is required");
      }

      // First, get total count from starred_entries endpoint
      console.log('Fetching total starred entries count...');
      const starredEntriesResponse = await axios.get('https://api.feedbin.com/v2/starred_entries.json', {
        headers: {
          Accept: 'application/json',
          Authorization: `Basic ${process.env.FEEDBIN_KEY}`
        }
      });

      const totalCount = Array.isArray(starredEntriesResponse.data) ? starredEntriesResponse.data.length : 0;
      console.log(`Total starred entries: ${totalCount}`);

      // Then get paginated data
      console.log(`Fetching page ${page} of starred articles...`);
      
      // Build params object with or without date filters
      const params: Record<string, any> = {
        starred: true,
        per_page: perPage,
        page: page,
        order: 'desc' // Ensure we're getting newest first
      };
      
      // Add date filters if available
      if (since) params.since = since;
      if (until) params.until = until;
      
      const response = await axios.get('https://api.feedbin.com/v2/entries.json', {
        params,
        headers: {
          Accept: 'application/json',
          Authorization: `Basic ${process.env.FEEDBIN_KEY}`
        }
      });

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
      
      // If month/year were requested and we got results, update our index
      if (month !== null && year !== null && articles.length > 0) {
        try {
          // Articles are sorted descending by published date, so first article is newest
          // Get the first and last article dates for the current page
          if (articles.length > 0) {
            const firstArticleDate = new Date(articles[0].published);
            const lastArticleDate = new Date(articles[articles.length - 1].published);
            
            console.log(`${getMonthName(month)} ${year} first article date: ${firstArticleDate.toISOString()}`);
            console.log(`${getMonthName(month)} ${year} last article date: ${lastArticleDate.toISOString()}`);
            
            // Print the articles in this month/year
            console.log(`${getMonthName(month)} ${year} articles:`);
            articles.forEach((article, index) => {
              console.log(`  ${index + 1}. ${article.title} - ${new Date(article.published).toISOString()}`);
            });
            
            // Update our index with this information
            updateMonthIndex(month, year, page, articles.length, totalCount);
            console.log(`Total entries for ${getMonthName(month)} ${year}: ${articles.length}`);
          }
        } catch (error) {
          console.error('Error updating month index:', error);
        }
      }

      // Add available months to the response
      const availableMonths = getAvailableMonths();
      
      res.json({
        articles,
        pagination: {
          current_page: page,
          per_page: perPage,
          total: totalCount,
          total_pages: totalPages
        },
        monthIndex: {
          availableMonths: availableMonths.map(entry => ({
            month: entry.month,
            year: entry.year,
            name: `${getMonthName(entry.month)} ${entry.year}`
          }))
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
        }
      });
    }
  });
  
  // Add an endpoint to get the available months
  router.get("/api/starred-articles/months", async (req, res) => {
    try {
      const availableMonths = getAvailableMonths();
      
      res.json({
        availableMonths: availableMonths.map(entry => ({
          month: entry.month,
          year: entry.year,
          name: `${getMonthName(entry.month)} ${entry.year}`
        }))
      });
    } catch (error) {
      console.error("Error fetching available months:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch available months",
        availableMonths: []
      });
    }
  });
  
  // Add an endpoint to build the month index
  router.post("/api/starred-articles/build-index", async (req, res) => {
    try {
      if (!process.env.FEEDBIN_KEY) {
        throw new Error("FEEDBIN_KEY environment variable is required");
      }
      
      // This will just be a placeholder for now - in a real implementation,
      // we'd scan through all articles and build a complete index
      const testMonths = [
        { month: 3, year: 2025, page: 1 },
        { month: 2, year: 2025, page: 3 },
        { month: 1, year: 2025, page: 5 },
        { month: 12, year: 2024, page: 8 },
        { month: 11, year: 2024, page: 12 },
        { month: 10, year: 2024, page: 16 },
        { month: 9, year: 2024, page: 20 },
        { month: 8, year: 2024, page: 24 },
        { month: 7, year: 2024, page: 28 },
        { month: 6, year: 2024, page: 32 },
      ];
      
      // Get total count to store with the index
      const starredEntriesResponse = await axios.get('https://api.feedbin.com/v2/starred_entries.json', {
        headers: {
          Accept: 'application/json',
          Authorization: `Basic ${process.env.FEEDBIN_KEY}`
        }
      });
      
      const totalCount = Array.isArray(starredEntriesResponse.data) ? starredEntriesResponse.data.length : 0;
      
      // Add each test month to our index
      testMonths.forEach(({ month, year, page }) => {
        // Each month has approximately 50 articles (this is just for testing)
        updateMonthIndex(month, year, page, 50, totalCount);
      });
      
      const availableMonths = getAvailableMonths();
      
      res.json({
        message: "Index built successfully",
        availableMonths: availableMonths.map(entry => ({
          month: entry.month,
          year: entry.year,
          name: `${getMonthName(entry.month)} ${entry.year}`
        }))
      });
    } catch (error) {
      console.error("Error building month index:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to build month index"
      });
    }
  });
}
