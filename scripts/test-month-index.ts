/**
 * Minimal test script for generating the month index file
 * This processes just a few pages to demonstrate the functionality.
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const PER_PAGE = 20;
const MAX_PAGES = 5; // Only process 5 pages for quick testing
const OUTPUT_FILE = path.join('client', 'src', 'data', 'test-month-index.json');

// Interface for index entries
interface IndexEntry {
  month: number;
  year: number;
  startPage: number;
}

interface IndexFile {
  entries: IndexEntry[];
  lastUpdated: string;
  totalArticles: number;
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
  const response = await axios.get('https://api.feedbin.com/v2/starred_entries.json', {
    headers: getAuthHeader()
  });

  const totalCount = Array.isArray(response.data) ? response.data.length : 0;
  console.log(`Total starred entries: ${totalCount}`);
  return totalCount;
}

/**
 * Fetches a page of starred articles
 */
async function fetchStarredArticlesPage(page: number): Promise<any[]> {
  console.log(`Fetching page ${page} of starred articles...`);
  const response = await axios.get('https://api.feedbin.com/v2/entries.json', {
    params: {
      starred: true,
      per_page: PER_PAGE,
      page: page,
      order: 'desc' // Newest first
    },
    headers: getAuthHeader()
  });

  return response.data;
}

/**
 * Gets the publication date of the oldest article on a page
 */
function getOldestArticleDate(articles: any[]): Date | null {
  if (!articles.length) return null;
  
  // Find the oldest article on the page
  let oldestDate: Date | null = null;
  
  for (const article of articles) {
    const pubDate = new Date(article.published);
    if (!oldestDate || pubDate < oldestDate) {
      oldestDate = pubDate;
    }
  }
  
  return oldestDate;
}

/**
 * Logs date information for a set of articles
 */
function logArticleDates(articles: any[], page: number) {
  if (articles.length === 0) {
    console.log(`Page ${page}: No articles found`);
    return;
  }
  
  // Log first and last article dates
  const firstArticle = articles[0];
  const lastArticle = articles[articles.length - 1];
  
  console.log(`Page ${page} has ${articles.length} articles`);
  console.log(`First article date: ${new Date(firstArticle.published).toISOString()}`);
  console.log(`Last article date: ${new Date(lastArticle.published).toISOString()}`);
  
  // Log all article dates for detailed inspection
  console.log(`All article dates on page ${page}:`);
  articles.forEach((article, index) => {
    const date = new Date(article.published);
    console.log(`  ${index + 1}. ${article.title.substring(0, 30)}... - ${date.toISOString()}`);
  });
}

/**
 * Processes articles to detect month changes
 */
function detectMonthChange(articles: any[]): {
  hasMonthChange: boolean,
  oldestMonth: number,
  oldestYear: number
} {
  if (!articles.length) {
    return { hasMonthChange: false, oldestMonth: 0, oldestYear: 0 };
  }

  // Get the oldest article's date
  const oldestDate = getOldestArticleDate(articles);
  if (!oldestDate) {
    return { hasMonthChange: false, oldestMonth: 0, oldestYear: 0 };
  }

  // Return the month and year of the oldest article
  return {
    hasMonthChange: true,
    oldestMonth: oldestDate.getMonth() + 1, // 1-12
    oldestYear: oldestDate.getFullYear()
  };
}

/**
 * Main function to test the month indexing
 */
async function testMonthIndexing() {
  try {
    // Get total articles count
    const totalArticles = await getTotalStarredArticlesCount();
    
    // Create a new index entries array
    const indexEntries: IndexEntry[] = [];
    
    // Track the current month and year being processed
    let currentMonth: number | null = null;
    let currentYear: number | null = null;
    let currentPage = 1;
    
    // Process just a few pages for testing
    while (currentPage <= MAX_PAGES) {
      const articles = await fetchStarredArticlesPage(currentPage);
      
      if (articles.length === 0) {
        console.log(`No articles found on page ${currentPage}, stopping.`);
        break;
      }
      
      // Log detailed information about articles on this page
      logArticleDates(articles, currentPage);
      
      // Detect month changes
      const { hasMonthChange, oldestMonth, oldestYear } = detectMonthChange(articles);
      
      if (hasMonthChange) {
        if (currentMonth === null || currentYear === null) {
          // First page, initialize current month/year
          currentMonth = oldestMonth;
          currentYear = oldestYear;
          console.log(`Initial month/year set to ${currentYear}-${currentMonth}`);
        } else if (oldestMonth !== currentMonth || oldestYear !== currentYear) {
          // Month changed - the previous page was the last page of the previous month
          indexEntries.push({
            month: currentMonth,
            year: currentYear,
            startPage: currentPage - 1
          });
          
          console.log(`Month transition detected: ${currentYear}-${currentMonth} ends on page ${currentPage - 1}`);
          
          // Update current month/year
          currentMonth = oldestMonth;
          currentYear = oldestYear;
        }
      }
      
      // Move to next page
      currentPage++;
      
      // Add a small delay to avoid API rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Add the current month if we processed any pages
    if (currentMonth !== null && currentYear !== null) {
      indexEntries.push({
        month: currentMonth,
        year: currentYear,
        startPage: currentPage - 1
      });
      
      console.log(`Added final month: ${currentYear}-${currentMonth} ends on page ${currentPage - 1}`);
    }
    
    // Create the final index file
    const indexFile: IndexFile = {
      entries: indexEntries,
      lastUpdated: new Date().toISOString(),
      totalArticles
    };
    
    // Save to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(indexFile, null, 2));
    console.log(`Test index file created with ${indexEntries.length} entries and saved to ${OUTPUT_FILE}`);
    
    return indexEntries;
  } catch (error) {
    console.error('Error during test:', error);
    throw error;
  }
}

// Run the test
testMonthIndexing()
  .then(() => {
    console.log('Test completed successfully.');
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });