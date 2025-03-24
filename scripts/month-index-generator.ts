/**
 * Script to generate the complete year-month-starred-article-index.json file
 * This indexes which page number contains the last articles for each month
 * from the current date back to 2013 using the Feedbin API.
 * 
 * This version is configured to be production-ready.
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

// For tracking progress
interface ProgressState {
  processedPages: number;
  lastMonthYear: string;
  earliestYearMonth: { year: number; month: number } | null;
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

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
    return response.data;
  } catch (error) {
    console.error(`Error fetching page ${page}:`, error);
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      // Rate limited, wait longer and retry
      console.log('Rate limited, waiting 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      return fetchStarredArticlesPage(page);
    }
    // For other errors, return empty array and continue
    return [];
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
 * Log a summary of articles on a page for debugging
 */
function logPageSummary(page: number, articles: any[]) {
  if (articles.length === 0) {
    console.log(`Page ${page}: No articles found`);
    return;
  }
  
  // Get first and last article dates
  const firstDate = new Date(articles[0].published);
  const lastDate = new Date(articles[articles.length - 1].published);
  
  console.log(`Page ${page} articles: ${articles.length}`);
  console.log(`Date range: ${firstDate.toISOString()} to ${lastDate.toISOString()}`);
  
  // Get unique months on this page
  const months = getUniqueMonthsOnPage(articles);
  const monthsStr = months.map(m => `${m.year}-${m.month}`).join(', ');
  console.log(`Months on page: ${monthsStr}`);
}

/**
 * Main function to generate the month index
 */
async function generateMonthIndex() {
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
    
    console.log(`Starting index generation for up to ${totalPages} pages...`);
    
    // Create arrays to store our data
    const indexEntries: IndexEntry[] = [];
    
    // Track the current month and year being processed
    let currentMonth: number | null = null;
    let currentYear: number | null = null;
    let currentPage = 1;
    
    // For progress tracking
    const progress: ProgressState = {
      processedPages: 0,
      lastMonthYear: '',
      earliestYearMonth: null
    };
    
    // Process pages until we've either processed all pages or reached START_YEAR
    while (currentPage <= totalPages) {
      // Fetch articles for the current page
      const articles = await fetchStarredArticlesPage(currentPage);
      
      if (articles.length === 0) {
        console.log(`No articles found on page ${currentPage}, moving to next page`);
        currentPage++;
        continue;
      }
      
      // Log a summary of this page
      logPageSummary(currentPage, articles);
      
      // Get the oldest month on the page
      const oldestMonthYear = getOldestMonthYearOnPage(articles);
      if (!oldestMonthYear) {
        console.log(`Could not determine oldest month on page ${currentPage}`);
        currentPage++;
        continue;
      }
      
      // Update progress tracking
      progress.processedPages++;
      progress.lastMonthYear = `${oldestMonthYear.year}-${oldestMonthYear.month}`;
      
      if (!progress.earliestYearMonth || 
          oldestMonthYear.year < progress.earliestYearMonth.year || 
          (oldestMonthYear.year === progress.earliestYearMonth.year && 
           oldestMonthYear.month < progress.earliestYearMonth.month)) {
        progress.earliestYearMonth = oldestMonthYear;
      }
      
      // If this is the first page, initialize current month/year
      if (currentMonth === null || currentYear === null) {
        currentMonth = oldestMonthYear.month;
        currentYear = oldestMonthYear.year;
        console.log(`Initial month/year set to ${currentYear}-${currentMonth}`);
      } 
      // If the oldest month on this page is different than our current month
      else if (oldestMonthYear.month !== currentMonth || oldestMonthYear.year !== currentYear) {
        // Add the current month to our index (it ended on the previous page)
        indexEntries.push({
          month: currentMonth,
          year: currentYear,
          startPage: currentPage - 1
        });
        
        console.log(`Month transition detected: ${currentYear}-${currentMonth} ends on page ${currentPage - 1}`);
        
        // Update current month/year to the oldest one on this page
        currentMonth = oldestMonthYear.month;
        currentYear = oldestMonthYear.year;
      }
      
      // Periodically save the index to prevent loss in case of timeout
      if (progress.processedPages % 20 === 0) {
        console.log(`Progress checkpoint: Processed ${progress.processedPages} pages so far...`);
        console.log(`Current earliest year/month seen: ${progress.earliestYearMonth?.year}-${progress.earliestYearMonth?.month}`);
        
        // Create a temporary index file
        const tempIndexFile: IndexFile = {
          entries: [...indexEntries],
          lastUpdated: new Date().toISOString(),
          totalArticles
        };
        
        if (currentMonth !== null && currentYear !== null) {
          // Add the current month as in-progress
          tempIndexFile.entries.push({
            month: currentMonth,
            year: currentYear,
            startPage: currentPage
          });
        }
        
        // Sort entries
        tempIndexFile.entries.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        });
        
        // Save to a temporary file
        fs.writeFileSync(`${OUTPUT_FILE}.temp`, JSON.stringify(tempIndexFile, null, 2));
      }
      
      // Check if we've reached or gone beyond our target year
      if (progress.earliestYearMonth && 
          progress.earliestYearMonth.year <= START_YEAR && 
          progress.earliestYearMonth.month <= 1) {
        console.log(`Reached target year ${START_YEAR} month 1, stopping.`);
        break;
      }
      
      // Move to the next page
      currentPage++;
    }
    
    // Add the final month if we processed any pages and didn't already add it
    if (currentMonth !== null && currentYear !== null) {
      indexEntries.push({
        month: currentMonth,
        year: currentYear,
        startPage: currentPage - 1 // The last page we processed
      });
      
      console.log(`Added final month: ${currentYear}-${currentMonth} ends on page ${currentPage - 1}`);
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
    
    // Clean up temporary file if it exists
    if (fs.existsSync(`${OUTPUT_FILE}.temp`)) {
      fs.unlinkSync(`${OUTPUT_FILE}.temp`);
    }
    
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