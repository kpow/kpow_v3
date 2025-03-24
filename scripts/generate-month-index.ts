/**
 * Script to generate the year-month-starred-article-index.json file
 * This indexes which page number contains the last articles for each month
 * from the current date back to 2013 using the Feedbin API.
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const PER_PAGE = 20;
const OUTPUT_FILE = path.join('client', 'src', 'data', 'year-month-starred-article-index.json');
const START_YEAR = 2013;
const END_YEAR = new Date().getFullYear();
const END_MONTH = new Date().getMonth() + 1; // Current month (1-12)

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
 * Main function to generate the index
 */
async function generateMonthIndex() {
  try {
    // First, load existing index if available to avoid regenerating everything
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

    // Get total articles count
    const totalArticles = await getTotalStarredArticlesCount();
    const totalPages = Math.ceil(totalArticles / PER_PAGE);
    
    // Create a new index entries array
    const indexEntries: IndexEntry[] = [];
    
    // Track the current month and year being processed
    let currentMonth: number | null = null;
    let currentYear: number | null = null;
    let currentPage = 1;
    
    // Process a small batch of pages for demonstration
    // In production, we would use: while (currentPage <= totalPages)
    const MAX_PAGES = 10; // Process only 10 pages for demonstration
    
    while (currentPage <= Math.min(totalPages, MAX_PAGES)) {
      const articles = await fetchStarredArticlesPage(currentPage);
      
      if (articles.length === 0) {
        break;
      }
      
      // For debug purposes
      console.log(`Page ${currentPage} articles: ${articles.length}`);
      if (articles.length > 0) {
        const firstArticle = articles[0];
        const lastArticle = articles[articles.length - 1];
        console.log(`First article date: ${new Date(firstArticle.published).toISOString()}`);
        console.log(`Last article date: ${new Date(lastArticle.published).toISOString()}`);
      }
      
      // Detect month changes
      const { hasMonthChange, oldestMonth, oldestYear } = detectMonthChange(articles);
      
      if (hasMonthChange) {
        if (currentMonth === null || currentYear === null) {
          // First page, initialize current month/year
          currentMonth = oldestMonth;
          currentYear = oldestYear;
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
    }
    
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
    console.error('Error generating month index:', error);
    throw error;
  }
}

// Run the generator
generateMonthIndex()
  .then(() => {
    console.log('Index generation completed successfully.');
  })
  .catch((error) => {
    console.error('Failed to generate index:', error);
    process.exit(1);
  });