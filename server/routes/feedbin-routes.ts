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

      // Build since date parameter if month and year are provided
      let sinceDate = since;
      if (!since && month && year) {
        // Convert to zero-based month (January is 0)
        const monthValue = parseInt(month) - 1;
        sinceDate = new Date(parseInt(year), monthValue, 1).toISOString();
      }

      // Build until date parameter if month and year are provided and no explicit until
      let untilDate = until;
      if (!until && month && year) {
        // Convert to zero-based month (January is 0)
        const monthValue = parseInt(month) - 1;
        // Get the last day of the month
        const lastDay = new Date(parseInt(year), monthValue + 1, 0).getDate();
        untilDate = new Date(parseInt(year), monthValue, lastDay, 23, 59, 59).toISOString();
      }

      if (!process.env.FEEDBIN_KEY) {
        throw new Error("FEEDBIN_KEY environment variable is required");
      }

      console.log(`Date filters applied - since: ${sinceDate || 'none'}, until: ${untilDate || 'none'}`);

      // First, get total count from starred_entries endpoint - with date filters if applicable
      console.log('Fetching total starred entries count...');
      const starredEntriesParams: Record<string, any> = {};
      if (sinceDate) {
        starredEntriesParams.since = sinceDate;
      }
      if (untilDate) {
        starredEntriesParams.until = untilDate;
      }

      const starredEntriesResponse = await axios.get('https://api.feedbin.com/v2/starred_entries.json', {
        params: starredEntriesParams,
        headers: {
          Accept: 'application/json',
          Authorization: `Basic ${process.env.FEEDBIN_KEY}`
        }
      });

      const totalCount = Array.isArray(starredEntriesResponse.data) ? starredEntriesResponse.data.length : 0;
      console.log(`Total starred entries: ${totalCount}`);

      // Then get paginated data
      console.log(`Fetching page ${page} of starred articles...`);
      const params: Record<string, any> = {
        starred: true,
        per_page: perPage,
        page: page,
        order: 'desc' // Ensure we're getting newest first
      };
      
      // Add date filters if applicable
      if (sinceDate) {
        params.since = sinceDate;
      }
      if (untilDate) {
        params.until = untilDate;
      }

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
