/**
 * Script to generate the complete year-month-starred-article-index.json file
 * This indexes which page number contains the last articles for each month
 * from the current date back to 2013 using the Feedbin API.
 * 
 * This is the full version meant for production use.
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

interface IndexState {
  currentPage: number;
  processedPages: number;
  totalPages: number;
  currentMonth: number | null;
  currentYear: number | null;
  entries: IndexEntry[];
  earliestYear: number | null;
  earliestMonth: number | null;
  checkpoint: {
    lastPageProcessed: number;
    remainingMonths: Array<{ year: number; month: number }>;
  };
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
    return []; // Empty array on other errors
  }
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
 * Log information about articles on a page for debugging
 */
function logPageInfo(articles: any[], page: number) {
  if (articles.length === 0) {
    console.log(`Page ${page}: No articles found`);
    return;
  }
  
  // Extract all dates for better visibility of transitions
  const dates: Date[] = [];
  for (const article of articles) {
    dates.push(new Date(article.published));
  }
  
  // Sort dates chronologically
  dates.sort((a: Date, b: Date) => a.getTime() - b.getTime());
  
  // Convert to month-year strings for easy viewing
  const monthYearStrings = dates.map((date: Date) => 
    `${date.getFullYear()}-${date.getMonth() + 1}`
  );
  
  // Count unique month-years
  const uniqueMonthYears = new Set(monthYearStrings);
  
  console.log(`Page ${page} has ${articles.length} articles spanning ${uniqueMonthYears.size} unique month(s)`);
  console.log(`Date range: ${dates[0].toISOString()} to ${dates[dates.length - 1].toISOString()}`);
  console.log(`Month-years on page: ${[...uniqueMonthYears].join(', ')}`);
}

/**
 * Processes articles to detect month changes
 */
function detectMonthChange(articles: any[]): {
  months: Set<string>;
  oldestMonth: number;
  oldestYear: number;
  newestMonth: number;
  newestYear: number;
} {
  const months = new Set<string>();
  let oldestMonth = 13; // Invalid month to start
  let oldestYear = 3000; // Future year to start
  let newestMonth = 0;
  let newestYear = 0;
  
  if (!articles.length) {
    return { 
      months, 
      oldestMonth, 
      oldestYear,
      newestMonth,
      newestYear
    };
  }

  // Process all articles to find month transitions
  for (const article of articles) {
    if (!article.published) continue;
    
    const date = new Date(article.published);
    const month = date.getMonth() + 1; // 1-12
    const year = date.getFullYear();
    
    months.add(`${year}-${month}`);
    
    // Update oldest
    if (year < oldestYear || (year === oldestYear && month < oldestMonth)) {
      oldestYear = year;
      oldestMonth = month;
    }
    
    // Update newest
    if (year > newestYear || (year === newestYear && month > newestMonth)) {
      newestYear = year;
      newestMonth = month;
    }
  }
  
  return { 
    months, 
    oldestMonth, 
    oldestYear,
    newestMonth,
    newestYear
  };
}

/**
 * Save a checkpoint to resume processing later
 */
function saveCheckpoint(state: IndexState): void {
  // Generate a list of remaining months to process
  const remainingMonths: Array<{ year: number; month: number }> = [];
  
  // Start from current month and go backwards until START_YEAR
  if (state.currentMonth !== null && state.currentYear !== null) {
    let year = state.currentYear;
    let month = state.currentMonth;
    
    while (year >= START_YEAR) {
      remainingMonths.push({ year, month });
      
      // Move to previous month
      month--;
      if (month < 1) {
        month = 12;
        year--;
      }
      
      // Stop once we've reached the start year and month 1
      if (year === START_YEAR && month < 1) break;
    }
  }
  
  // Save checkpoint data
  const checkpoint = {
    lastPageProcessed: state.currentPage,
    remainingMonths
  };
  
  fs.writeFileSync(`${OUTPUT_FILE}.checkpoint`, JSON.stringify(checkpoint, null, 2));
  console.log(`Checkpoint saved at page ${state.currentPage}`);
}

/**
 * Load a checkpoint if it exists
 */
function loadCheckpoint(): { lastPageProcessed: number; remainingMonths: Array<{ year: number; month: number }> } | null {
  const checkpointFile = `${OUTPUT_FILE}.checkpoint`;
  
  if (fs.existsSync(checkpointFile)) {
    try {
      const data = fs.readFileSync(checkpointFile, 'utf8');
      const checkpoint = JSON.parse(data);
      console.log(`Loaded checkpoint from page ${checkpoint.lastPageProcessed}`);
      return checkpoint;
    } catch (error) {
      console.error('Error loading checkpoint:', error);
    }
  }
  
  return null;
}

/**
 * Generate all months from START_YEAR to current
 */
function generateAllMonths(): Array<{ year: number; month: number }> {
  const months: Array<{ year: number; month: number }> = [];
  
  // Start from current month and go backwards to START_YEAR
  for (let year = END_YEAR; year >= START_YEAR; year--) {
    // For current year, only go up to current month
    const endMonth = year === END_YEAR ? END_MONTH : 12;
    
    for (let month = endMonth; month >= 1; month--) {
      months.push({ year, month });
    }
  }
  
  return months;
}

/**
 * Main function to generate the index
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
    
    // Initialize state
    const state: IndexState = {
      currentPage: 1,
      processedPages: 0,
      totalPages,
      currentMonth: null,
      currentYear: null,
      entries: [...existingIndex.entries],
      earliestYear: null,
      earliestMonth: null,
      checkpoint: {
        lastPageProcessed: 0,
        remainingMonths: []
      }
    };
    
    // Load checkpoint if it exists
    const checkpoint = loadCheckpoint();
    if (checkpoint) {
      state.currentPage = checkpoint.lastPageProcessed;
      state.checkpoint = checkpoint;
      console.log(`Resuming from page ${state.currentPage}`);
    }
    
    // Process pages until we've either processed all pages or reached START_YEAR
    let currentStartPage = 1;  // This will track the page where each month starts
    let currentMonthYear = '';  // This will track the current month-year being processed
    
    while (state.currentPage <= state.totalPages) {
      // Fetch articles for the current page
      const articles = await fetchStarredArticlesPage(state.currentPage);
      
      if (articles.length === 0) {
        console.log(`No articles found on page ${state.currentPage}, moving to next page`);
        state.currentPage++;
        continue;
      }
      
      // Log information about articles on this page
      logPageInfo(articles, state.currentPage);
      
      // Detect month changes
      const { months, oldestMonth, oldestYear, newestMonth, newestYear } = detectMonthChange(articles);
      
      // Update state
      state.processedPages++;
      
      // Update earliest year/month seen
      if (state.earliestYear === null || 
          oldestYear < state.earliestYear || 
          (oldestYear === state.earliestYear && oldestMonth < state.earliestMonth!)) {
        state.earliestYear = oldestYear;
        state.earliestMonth = oldestMonth;
      }
      
      // Initialize current month/year if not set
      if (state.currentMonth === null || state.currentYear === null) {
        state.currentMonth = newestMonth;
        state.currentYear = newestYear;
        currentMonthYear = `${newestYear}-${newestMonth}`;
        console.log(`Initial month/year set to ${currentMonthYear}`);
      }
      
      // Check for month transitions on this page
      for (const monthStr of months) {
        const [yearStr, monthStr2] = monthStr.split('-');
        const year = parseInt(yearStr);
        const month = parseInt(monthStr2);
        
        // If this is a new month we haven't seen before
        const monthYearKey = `${year}-${month}`;
        if (monthYearKey !== currentMonthYear) {
          console.log(`Found new month: ${monthYearKey} on page ${state.currentPage}`);
          
          // Add entry for the new month
          state.entries.push({
            month,
            year,
            startPage: state.currentPage
          });
          
          // Update current month tracking
          currentMonthYear = monthYearKey;
        }
      }
      
      // Save checkpoint periodically
      if (state.processedPages % 10 === 0) {
        saveCheckpoint(state);
        
        // Also save a temp index file
        const tempIndex: IndexFile = {
          entries: [...state.entries],
          lastUpdated: new Date().toISOString(),
          totalArticles
        };
        
        fs.writeFileSync(`${OUTPUT_FILE}.temp`, JSON.stringify(tempIndex, null, 2));
        console.log(`Saved temporary index with ${state.entries.length} entries`);
      }
      
      // Check if we've reached the target year
      if (state.earliestYear! <= START_YEAR && state.earliestMonth! <= 1) {
        console.log(`Reached or passed start year ${START_YEAR}, month 1`);
        break;
      }
      
      // Move to next page
      state.currentPage++;
    }
    
    // Sort entries by year and month (newest first)
    state.entries.sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year;
      }
      return b.month - a.month;
    });
    
    // Create the final index file
    const indexFile: IndexFile = {
      entries: state.entries,
      lastUpdated: new Date().toISOString(),
      totalArticles
    };
    
    // Save to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(indexFile, null, 2));
    console.log(`Index file created with ${state.entries.length} entries and saved to ${OUTPUT_FILE}`);
    
    // Clean up temporary files
    if (fs.existsSync(`${OUTPUT_FILE}.temp`)) {
      fs.unlinkSync(`${OUTPUT_FILE}.temp`);
    }
    if (fs.existsSync(`${OUTPUT_FILE}.checkpoint`)) {
      fs.unlinkSync(`${OUTPUT_FILE}.checkpoint`);
    }
    
    return state.entries;
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