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
      
      // If month and year are provided, look up the corresponding page from our index
      if (month !== null && year !== null) {
        // Find the page number for this month/year from our index
        const indexedPage = findPageForMonth(month, year);
        
        if (indexedPage !== null) {
          console.log(`Found indexed page ${indexedPage} for ${getMonthName(month)} ${year}`);
          page = indexedPage;
        } else {
          console.log(`No indexed page found for ${getMonthName(month)} ${year}, using requested page ${page}`);
        }
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
      
      // We only use page-based navigation, NOT date filters
      // The Feedbin API doesn't support proper date filtering for starred entries
      const params: Record<string, any> = {
        starred: true,
        per_page: perPage,
        page: page,
        order: 'desc' // Ensure we're getting newest first
      };
      
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
        filter: {
          month: month !== null ? month : undefined,
          year: year !== null ? year : undefined
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
        },
        filter: {
          month: undefined,
          year: undefined
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
      
      // Get total count to store with the index
      console.log('Getting total count of starred articles...');
      const starredEntriesResponse = await axios.get('https://api.feedbin.com/v2/starred_entries.json', {
        headers: {
          Accept: 'application/json',
          Authorization: `Basic ${process.env.FEEDBIN_KEY}`
        }
      });
      
      const totalCount = Array.isArray(starredEntriesResponse.data) ? starredEntriesResponse.data.length : 0;
      console.log(`Total count: ${totalCount} articles`);
      
      // Prevent too many network requests
      const MAX_PAGES_TO_SCAN = 50; // Adjust based on how many pages you want to scan
      const PER_PAGE = 50; // Get more articles per page to reduce number of requests
      
      // This will track the months we've seen and what page each month starts on
      interface MonthPageMapping {
        [key: string]: { month: number; year: number; page: number; articleCount: number };
      }
      
      const monthsFound: MonthPageMapping = {};
      
      // To track the current leading month/year as we scan through pages
      let leadingMonth: number | null = null;
      let leadingYear: number | null = null;
      
      console.log(`Beginning index build - scanning up to ${MAX_PAGES_TO_SCAN} pages...`);
      
      // Iterate through pages to find where each month/year starts
      let stop = false;
      for (let page = 1; page <= MAX_PAGES_TO_SCAN && !stop; page++) {
        console.log(`Scanning page ${page}...`);
        
        try {
          // Get articles for this page
          const apiResponse = await axios.get<any[]>('https://api.feedbin.com/v2/entries.json', {
            params: {
              starred: true,
              per_page: PER_PAGE,
              page: page,
              order: 'desc'
            },
            headers: {
              Accept: 'application/json',
              Authorization: `Basic ${process.env.FEEDBIN_KEY}`
            }
          });
          
          if (!apiResponse.data || !Array.isArray(apiResponse.data) || apiResponse.data.length === 0) {
            console.log(`No more articles found on page ${page}, stopping scan`);
            stop = true;
            continue;
          }
          
          console.log(`Found ${apiResponse.data.length} articles on page ${page}`);
          
          // Get the oldest and newest dates on this page for debugging
          if (apiResponse.data.length > 0) {
            const firstArticleDate = new Date(apiResponse.data[0].published as string);
            const lastArticleDate = new Date(apiResponse.data[apiResponse.data.length - 1].published as string);
            console.log(`Page ${page} date range: ${firstArticleDate.toISOString()} to ${lastArticleDate.toISOString()}`);
          }
          
          // Group articles on this page by month/year
          const pageMonths: Record<string, { month: number; year: number; count: number }> = {};
          
          // Process each article to extract month/year
          for (const article of apiResponse.data) {
            if (article.published) {
              const publishDate = new Date(article.published as string);
              const month = publishDate.getMonth() + 1; // Convert 0-indexed to 1-indexed
              const year = publishDate.getFullYear();
              const key = `${month}-${year}`;
              
              // Count articles by month/year on this page
              if (!pageMonths[key]) {
                pageMonths[key] = { month, year, count: 1 };
              } else {
                pageMonths[key].count++;
              }
              
              // Set the leading month/year if this is the first article we've seen
              if (leadingMonth === null || leadingYear === null) {
                leadingMonth = month;
                leadingYear = year;
                console.log(`Setting leading month/year to ${getMonthName(month)} ${year}`);
              }
            }
          }
          
          // Log all months found on this page
          console.log(`Months found on page ${page}:`);
          Object.entries(pageMonths).forEach(([key, { month, year, count }]) => {
            console.log(`  ${getMonthName(month)} ${year}: ${count} articles`);
          });
          
          // For each month found on this page, record it if it's the first time we've seen it
          // or if it's a different month than the leading month/year
          Object.entries(pageMonths).forEach(([key, { month, year, count }]) => {
            // If we haven't seen this month before, or if it's different from the leading month,
            // record this page as the starting page for this month/year
            if (!monthsFound[key]) {
              // Special case for leading month/year - always record it on page 1
              if (month === leadingMonth && year === leadingYear) {
                console.log(`Found leading month ${getMonthName(month)} ${year} on page ${page}`);
                monthsFound[key] = { month, year, page: 1, articleCount: count };
              } else {
                // For other months, record the page where we first find them
                console.log(`Found new month ${getMonthName(month)} ${year} on page ${page}`);
                monthsFound[key] = { month, year, page, articleCount: count };
              }
            } else {
              // Just update the article count for months we've already recorded
              monthsFound[key].articleCount += count;
            }
          });
          
          // Add a small delay to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.error(`Error scanning page ${page}:`, error);
          stop = true;
        }
      }
      
      console.log('Scan complete. Months found:');
      
      // Update our index with the months we found
      Object.values(monthsFound).forEach(({ month, year, page, articleCount }) => {
        console.log(`${getMonthName(month)} ${year}: Page ${page} (${articleCount} articles)`);
        updateMonthIndex(month, year, page, articleCount, totalCount);
      });
      
      const availableMonths = getAvailableMonths();
      
      res.json({
        message: "Index built successfully",
        monthsScanned: Object.keys(monthsFound).length,
        pagesScanned: Math.min(MAX_PAGES_TO_SCAN, totalCount / PER_PAGE),
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
