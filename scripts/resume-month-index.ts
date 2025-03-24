/**
 * Script to resume generation of the year-month-starred-article-index.json file
 * This will continue from the checkpoint file and ensures we don't have duplicates.
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const PER_PAGE = 20;
const OUTPUT_FILE = path.join('client', 'src', 'data', 'year-month-starred-article-index.json');
const CHECKPOINT_FILE = `${OUTPUT_FILE}.checkpoint`;
const TEMP_FILE = `${OUTPUT_FILE}.temp`;
const START_YEAR = 2013;
const CURRENT_DATE = new Date();
const END_YEAR = CURRENT_DATE.getFullYear();
const END_MONTH = CURRENT_DATE.getMonth() + 1; // Current month (1-12)
const MAX_PAGES_PER_RUN = 50; // Process this many pages per run to avoid timeouts

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
  processedMonthYears: Set<string>;
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
  
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
  console.log(`Checkpoint saved at page ${state.currentPage}`);
}

/**
 * Load a checkpoint if it exists
 */
function loadCheckpoint(): { lastPageProcessed: number; remainingMonths: Array<{ year: number; month: number }> } | null {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      const data = fs.readFileSync(CHECKPOINT_FILE, 'utf8');
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
 * Load temp file if it exists
 */
function loadTempIndexFile(): IndexFile | null {
  if (fs.existsSync(TEMP_FILE)) {
    try {
      const data = fs.readFileSync(TEMP_FILE, 'utf8');
      const tempIndex = JSON.parse(data);
      console.log(`Loaded temp index with ${tempIndex.entries.length} entries`);
      return tempIndex;
    } catch (error) {
      console.error('Error loading temp index:', error);
    }
  }
  
  return null;
}

/**
 * Main function to generate the index
 */
async function resumeMonthIndex() {
  try {
    // Load checkpoint
    const checkpoint = loadCheckpoint();
    if (!checkpoint) {
      console.log('No checkpoint found, nothing to resume.');
      return;
    }
    
    // Load temp index
    const tempIndex = loadTempIndexFile();
    
    // If no temp index, but we have an existing index, use that
    let existingEntries: IndexEntry[] = [];
    if (tempIndex) {
      existingEntries = tempIndex.entries;
    } else if (fs.existsSync(OUTPUT_FILE)) {
      try {
        const fileContent = fs.readFileSync(OUTPUT_FILE, 'utf8');
        const existingIndex = JSON.parse(fileContent);
        existingEntries = existingIndex.entries;
        console.log(`Loaded existing index with ${existingEntries.length} entries`);
      } catch (error) {
        console.error('Error loading existing index:', error);
      }
    }
    
    // Get total articles count and calculate total pages
    const totalArticles = await getTotalStarredArticlesCount();
    const totalPages = Math.ceil(totalArticles / PER_PAGE);
    
    console.log(`Resuming index generation from page ${checkpoint.lastPageProcessed} of ${totalPages} pages...`);
    
    // Create a set of already processed month-years to prevent duplicates
    const processedMonthYears = new Set<string>();
    
    // Add existing entries to processed set
    for (const entry of existingEntries) {
      processedMonthYears.add(`${entry.year}-${entry.month}`);
    }
    
    // Initialize state
    const state: IndexState = {
      currentPage: checkpoint.lastPageProcessed,
      processedPages: 0,
      totalPages,
      currentMonth: null,
      currentYear: null,
      entries: [...existingEntries],
      earliestYear: null,
      earliestMonth: null,
      checkpoint: checkpoint,
      processedMonthYears
    };
    
    // Process pages until we've either processed all pages or reached START_YEAR
    // or hit our max pages per run
    let currentStartPage = state.currentPage;
    let currentMonthYear = '';
    let pagesProcessedThisRun = 0;
    
    while (state.currentPage <= state.totalPages && pagesProcessedThisRun < MAX_PAGES_PER_RUN) {
      // Fetch articles for the current page
      const articles = await fetchStarredArticlesPage(state.currentPage);
      
      if (articles.length === 0) {
        console.log(`No articles found on page ${state.currentPage}, moving to next page`);
        state.currentPage++;
        pagesProcessedThisRun++;
        continue;
      }
      
      // Log information about articles on this page
      logPageInfo(articles, state.currentPage);
      
      // Detect month changes
      const { months, oldestMonth, oldestYear, newestMonth, newestYear } = detectMonthChange(articles);
      
      // Update state
      state.processedPages++;
      pagesProcessedThisRun++;
      
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
        if (!state.processedMonthYears.has(monthYearKey)) {
          console.log(`Found new month: ${monthYearKey} on page ${state.currentPage}`);
          
          // Add entry for the new month
          state.entries.push({
            month,
            year,
            startPage: state.currentPage
          });
          
          // Mark this month as processed
          state.processedMonthYears.add(monthYearKey);
          
          // Update current month tracking
          currentMonthYear = monthYearKey;
        }
      }
      
      // Save checkpoint periodically
      if (state.processedPages % 10 === 0 || pagesProcessedThisRun === MAX_PAGES_PER_RUN) {
        saveCheckpoint(state);
        
        // Also save a temp index file
        const tempIndex: IndexFile = {
          entries: [...state.entries],
          lastUpdated: new Date().toISOString(),
          totalArticles
        };
        
        // Sort entries by year and month (newest first)
        tempIndex.entries.sort((a, b) => {
          if (a.year !== b.year) {
            return b.year - a.year;
          }
          return b.month - a.month;
        });
        
        fs.writeFileSync(TEMP_FILE, JSON.stringify(tempIndex, null, 2));
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
    
    // If we've processed all pages or reached the target year, finalize the index
    if (state.currentPage > state.totalPages || 
        (state.earliestYear! <= START_YEAR && state.earliestMonth! <= 1)) {
      console.log(`Completed processing. Creating final index file...`);
      
      // Sort entries by year and month (newest first)
      state.entries.sort((a, b) => {
        if (a.year !== b.year) {
          return b.year - a.year;
        }
        return b.month - a.month;
      });
      
      // Remove duplicates (just in case)
      const uniqueEntries: IndexEntry[] = [];
      const seenMonthYears = new Set<string>();
      
      for (const entry of state.entries) {
        const key = `${entry.year}-${entry.month}`;
        if (!seenMonthYears.has(key)) {
          uniqueEntries.push(entry);
          seenMonthYears.add(key);
        }
      }
      
      // Create the final index file
      const indexFile: IndexFile = {
        entries: uniqueEntries,
        lastUpdated: new Date().toISOString(),
        totalArticles
      };
      
      // Save to file
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(indexFile, null, 2));
      console.log(`Final index file created with ${uniqueEntries.length} entries and saved to ${OUTPUT_FILE}`);
      
      // Clean up temporary files
      if (fs.existsSync(TEMP_FILE)) {
        fs.unlinkSync(TEMP_FILE);
      }
      if (fs.existsSync(CHECKPOINT_FILE)) {
        fs.unlinkSync(CHECKPOINT_FILE);
      }
    } else {
      console.log(`Processed ${pagesProcessedThisRun} pages in this run. Need to resume later.`);
      console.log(`Current page: ${state.currentPage} of ${state.totalPages}`);
    }
    
    return state.entries;
  } catch (error) {
    console.error('Error resuming month index:', error);
    throw error;
  }
}

// Run the generator
resumeMonthIndex()
  .then(() => {
    console.log('Index generation resumed and completed successfully for this batch.');
  })
  .catch((error) => {
    console.error('Failed to resume index generation:', error);
    process.exit(1);
  });