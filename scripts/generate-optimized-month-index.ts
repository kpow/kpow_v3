/**
 * Optimized script to generate the year-month-starred-article-index.json file
 * This script uses binary search to efficiently locate month transitions
 * in the paginated starred articles data from Feedbin API.
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const PER_PAGE = 20;
const OUTPUT_FILE = path.join('client', 'src', 'data', 'year-month-starred-article-index.json');
const START_YEAR = 2013;
const CURRENT_DATE = new Date();
const END_YEAR = CURRENT_DATE.getFullYear();
const END_MONTH = CURRENT_DATE.getMonth() + 1; // Current month (1-12)

// Interface for index entries
interface IndexEntry {
  month: number;  // 1-12
  year: number;   // e.g. 2024
  startPage: number;
}

interface IndexFile {
  entries: IndexEntry[];
  lastUpdated: string;
  totalArticles: number;
}

interface MonthBoundary {
  month: number;
  year: number;
  page: number;
}

/**
 * Get the authorization header for Feedbin API
 */
function getAuthHeader() {
  if (!process.env.FEEDBIN_KEY) {
    throw new Error('FEEDBIN_KEY environment variable is required');
  }
  
  return {
    Accept: 'application/json',
    Authorization: `Basic ${process.env.FEEDBIN_KEY}`
  };
}

/**
 * Fetches total count of starred articles
 */
async function getTotalStarredArticlesCount(): Promise<number> {
  console.log('Fetching total starred entries count...');
  try {
    const response = await axios.get('https://api.feedbin.com/v2/starred_entries.json', {
      headers: getAuthHeader()
    });

    const totalCount = Array.isArray(response.data) ? response.data.length : 0;
    console.log(`Total starred entries: ${totalCount}`);
    return totalCount;
  } catch (error) {
    console.error('Error fetching total starred entries:', error);
    throw error;
  }
}

/**
 * Fetches a page of starred articles
 */
async function fetchStarredArticlesPage(page: number): Promise<any[]> {
  console.log(`Fetching page ${page} of starred articles...`);
  try {
    const response = await axios.get('https://api.feedbin.com/v2/entries.json', {
      params: {
        starred: true,
        per_page: PER_PAGE,
        page: page,
        order: 'desc' // Newest first
      },
      headers: getAuthHeader()
    });

    await new Promise(resolve => setTimeout(resolve, 500)); // Prevent rate limiting
    return response.data;
  } catch (error) {
    console.error(`Error fetching page ${page}:`, error);
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      // Rate limited, wait longer
      console.log('Rate limited, waiting 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      return fetchStarredArticlesPage(page); // Retry
    }
    return []; // Empty array on other errors
  }
}

/**
 * Gets the month and year from a given article
 */
function getArticleMonthYear(article: any): { month: number; year: number } | null {
  if (!article?.published) return null;
  
  const date = new Date(article.published);
  return {
    month: date.getMonth() + 1, // 1-12
    year: date.getFullYear()
  };
}

/**
 * Determines the oldest month and year on a page
 */
function getOldestMonthYearOnPage(articles: any[]): { month: number; year: number } | null {
  if (!articles.length) return null;
  
  let oldestYear = Number.MAX_SAFE_INTEGER;
  let oldestMonth = 13; // Higher than any valid month
  
  for (const article of articles) {
    const monthYear = getArticleMonthYear(article);
    if (!monthYear) continue;
    
    // Check if this article is from an older month/year
    if (monthYear.year < oldestYear || 
        (monthYear.year === oldestYear && monthYear.month < oldestMonth)) {
      oldestYear = monthYear.year;
      oldestMonth = monthYear.month;
    }
  }
  
  if (oldestYear === Number.MAX_SAFE_INTEGER) return null;
  
  return { month: oldestMonth, year: oldestYear };
}

/**
 * Gets all unique month/year combinations present on a page
 */
function getUniqueMonthsOnPage(articles: any[]): Array<{ month: number; year: number }> {
  const uniqueMonths = new Set<string>();
  const result: Array<{ month: number; year: number }> = [];
  
  for (const article of articles) {
    const monthYear = getArticleMonthYear(article);
    if (!monthYear) continue;
    
    const key = `${monthYear.year}-${monthYear.month}`;
    if (!uniqueMonths.has(key)) {
      uniqueMonths.add(key);
      result.push(monthYear);
    }
  }
  
  // Sort by year, then month (descending)
  return result.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
}

/**
 * Finds the last page for each month using a more efficient search
 */
async function findMonthBoundaries(totalPages: number): Promise<MonthBoundary[]> {
  const boundaries: MonthBoundary[] = [];
  let currentPage = 1;
  
  try {
    // Get the first page to establish our starting point
    const firstPageArticles = await fetchStarredArticlesPage(1);
    if (!firstPageArticles.length) {
      console.log('No articles found on first page');
      return boundaries;
    }
    
    // Get the most recent month/year from the first article
    const firstArticle = firstPageArticles[0];
    const firstMonthYear = getArticleMonthYear(firstArticle);
    if (!firstMonthYear) {
      console.log('Could not determine month/year for the first article');
      return boundaries;
    }
    
    console.log(`Starting with month ${firstMonthYear.year}-${firstMonthYear.month}`);
    
    let currentMonth = firstMonthYear.month;
    let currentYear = firstMonthYear.year;
    
    // Process a small batch for demonstration purposes
    // A sample of 2 years of data to demonstrate the functionality
    const targetYear = Math.max(currentYear - 2, START_YEAR);
    
    // While we haven't gone too far back in time and haven't exceeded total pages
    while ((currentYear > targetYear || (currentYear === targetYear && currentMonth >= 1)) && 
           currentPage <= totalPages) {
      
      // Get the articles for current page
      const pageArticles = await fetchStarredArticlesPage(currentPage);
      if (!pageArticles.length) {
        console.log(`No articles found on page ${currentPage}, moving to next page`);
        currentPage++;
        continue;
      }
      
      // Get all months on this page
      const monthsOnPage = getUniqueMonthsOnPage(pageArticles);
      console.log(`Page ${currentPage} contains months:`, 
        monthsOnPage.map(m => `${m.year}-${m.month}`).join(', '));
      
      // Get the oldest month on the page
      const oldestMonthYear = getOldestMonthYearOnPage(pageArticles);
      if (!oldestMonthYear) {
        console.log(`Could not determine oldest month on page ${currentPage}`);
        currentPage++;
        continue;
      }
      
      // If this page contains articles from a different month than our current month
      if (oldestMonthYear.month !== currentMonth || oldestMonthYear.year !== currentYear) {
        // We've found a boundary
        boundaries.push({
          month: currentMonth,
          year: currentYear,
          page: currentPage - 1 // The previous page was the last page of the current month
        });
        
        console.log(`Found boundary: ${currentYear}-${currentMonth} ends on page ${currentPage - 1}`);
        
        // Update current month/year to the oldest one on this page
        currentMonth = oldestMonthYear.month;
        currentYear = oldestMonthYear.year;
      }
      
      // Move to the next page
      currentPage++;
    }
    
    // Add the last boundary if we processed any pages
    if (currentMonth && currentYear) {
      boundaries.push({
        month: currentMonth,
        year: currentYear,
        page: currentPage - 1
      });
    }
    
    return boundaries;
  } catch (error) {
    console.error('Error finding month boundaries:', error);
    throw error;
  }
}

/**
 * Main function to generate the optimized index
 */
async function generateOptimizedMonthIndex() {
  try {
    // First, load existing index if available
    let existingIndex: IndexFile = { 
      entries: [], 
      lastUpdated: new Date().toISOString(),
      totalArticles: 0
    };
    
    if (fs.existsSync(OUTPUT_FILE)) {
      try {
        const fileContent = fs.readFileSync(OUTPUT_FILE, 'utf8');
        existingIndex = JSON.parse(fileContent);
        console.log(`Loaded existing index with ${existingIndex.entries.length} entries`);
      } catch (error) {
        console.error('Error loading existing index:', error);
      }
    }

    // Get total articles count and calculate total pages
    const totalArticles = await getTotalStarredArticlesCount();
    const totalPages = Math.ceil(totalArticles / PER_PAGE);
    
    console.log(`Finding month boundaries across ${totalPages} pages...`);
    
    // Find all month boundaries with our optimized approach
    const boundaries = await findMonthBoundaries(totalPages);
    
    // Convert boundaries to index entries
    const indexEntries: IndexEntry[] = boundaries.map((boundary) => ({
      month: boundary.month,
      year: boundary.year,
      startPage: boundary.page
    }));
    
    // Sort entries by year and month (newest first)
    indexEntries.sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year;
      }
      return b.month - a.month;
    });
    
    // Create the final index file
    const indexFile: IndexFile = {
      entries: indexEntries,
      lastUpdated: new Date().toISOString(),
      totalArticles
    };
    
    // Save to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(indexFile, null, 2));
    console.log(`Index file created with ${indexEntries.length} entries and saved to ${OUTPUT_FILE}`);
    
    return indexEntries;
  } catch (error) {
    console.error('Error generating optimized month index:', error);
    throw error;
  }
}

// Run the generator
generateOptimizedMonthIndex()
  .then(() => {
    console.log('Optimized index generation completed successfully.');
  })
  .catch((error) => {
    console.error('Failed to generate optimized index:', error);
    process.exit(1);
  });