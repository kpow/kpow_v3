/**
 * Test script to verify the year-month-starred-article-index file generation
 * This processes just a few pages to demonstrate the correct implementation
 * of finding the start page of each month.
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const PER_PAGE = 20;
const MAX_PAGES = 10; // Only process 10 pages for quick testing
const OUTPUT_FILE = path.join('client', 'src', 'data', 'test-month-index-fixed.json');

// Interface for index entries
interface IndexEntry {
  month: number;
  year: number;
  startPage: number;  // Page where this month STARTS
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
    return []; // Return empty array on error
  }
}

/**
 * Track which months appear on each page and identify where each month starts
 */
function trackMonthsOnPage(articles: any[]): Set<string> {
  const monthYears = new Set<string>();
  
  for (const article of articles) {
    if (!article.published) continue;
    
    const date = new Date(article.published);
    const month = date.getMonth() + 1; // 1-12
    const year = date.getFullYear();
    
    monthYears.add(`${year}-${month}`);
  }
  
  return monthYears;
}

/**
 * Main test function
 */
async function testMonthIndex() {
  try {
    // Get total articles count
    const totalArticles = await getTotalStarredArticlesCount();
    
    // Create a map to track which page each month first appears on
    const monthStartPages = new Map<string, number>();
    
    // Create an array to store month entries
    const indexEntries: IndexEntry[] = [];
    
    // Process up to MAX_PAGES
    for (let page = 1; page <= MAX_PAGES; page++) {
      const articles = await fetchStarredArticlesPage(page);
      
      if (articles.length === 0) {
        console.log(`No articles found on page ${page}, stopping.`);
        break;
      }
      
      // Get unique months on this page
      const monthsOnPage = trackMonthsOnPage(articles);
      console.log(`Page ${page} has months: ${[...monthsOnPage].join(', ')}`);
      
      // For each month on this page, record the first page it appears on
      for (const monthYear of monthsOnPage) {
        if (!monthStartPages.has(monthYear)) {
          console.log(`Month ${monthYear} first appears on page ${page}`);
          monthStartPages.set(monthYear, page);
          
          // Extract month and year from the string
          const [yearStr, monthStr] = monthYear.split('-');
          const year = parseInt(yearStr);
          const month = parseInt(monthStr);
          
          // Add to our entries
          indexEntries.push({
            month,
            year,
            startPage: page
          });
        }
      }
    }
    
    // Sort entries by year and month (newest first)
    indexEntries.sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year;
      }
      return b.month - a.month;
    });
    
    // Create the test index file
    const indexFile: IndexFile = {
      entries: indexEntries,
      lastUpdated: new Date().toISOString(),
      totalArticles
    };
    
    // Save to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(indexFile, null, 2));
    console.log(`Test index file created with ${indexEntries.length} entries and saved to ${OUTPUT_FILE}`);
    
    // Print for comparison with existing index
    console.log("\nCompare with existing index:");
    console.log(JSON.stringify(indexEntries, null, 2));
    
    return indexEntries;
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}

// Run the test
testMonthIndex()
  .then(() => {
    console.log('Test completed successfully.');
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });