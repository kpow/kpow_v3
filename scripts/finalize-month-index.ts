/**
 * Script to finalize the year-month-starred-article-index.json file by removing duplicates
 * and ensuring we have the correct format.
 */

import * as fs from 'fs';
import * as path from 'path';

// Configuration
const OUTPUT_FILE = path.join('client', 'src', 'data', 'year-month-starred-article-index.json');
const TEMP_FILE = `${OUTPUT_FILE}.temp`;

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
 * Main function to clean up and finalize the index
 */
async function finalizeMonthIndex() {
  try {
    // Check if temp file exists
    if (!fs.existsSync(TEMP_FILE)) {
      console.log('No temporary index file found. Nothing to finalize.');
      return;
    }
    
    // Load the temp file
    const tempFileContent = fs.readFileSync(TEMP_FILE, 'utf8');
    const tempIndex: IndexFile = JSON.parse(tempFileContent);
    
    console.log(`Loaded temp index with ${tempIndex.entries.length} entries`);
    
    // Build a map of month-year to startPage
    const monthYearMap = new Map<string, number>();
    
    // For each month-year, keep the entry with the earliest startPage
    for (const entry of tempIndex.entries) {
      const key = `${entry.year}-${entry.month}`;
      
      if (!monthYearMap.has(key) || entry.startPage < monthYearMap.get(key)!) {
        monthYearMap.set(key, entry.startPage);
      }
    }
    
    console.log(`Found ${monthYearMap.size} unique month-year entries`);
    
    // Convert back to array of entries
    const uniqueEntries: IndexEntry[] = [];
    
    for (const [key, startPage] of monthYearMap.entries()) {
      const [yearStr, monthStr] = key.split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);
      
      uniqueEntries.push({
        month,
        year,
        startPage
      });
    }
    
    // Sort entries by year and month (newest first)
    uniqueEntries.sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year;
      }
      return b.month - a.month;
    });
    
    // Create the final index file
    const finalIndex: IndexFile = {
      entries: uniqueEntries,
      lastUpdated: new Date().toISOString(),
      totalArticles: tempIndex.totalArticles
    };
    
    // Save to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalIndex, null, 2));
    console.log(`Finalized index created with ${uniqueEntries.length} entries and saved to ${OUTPUT_FILE}`);
    
    // Print a sample of the entries
    console.log('Sample of entries:');
    uniqueEntries.slice(0, 10).forEach(entry => {
      console.log(`${entry.year}-${entry.month}: Page ${entry.startPage}`);
    });
    
    return uniqueEntries;
  } catch (error) {
    console.error('Error finalizing index:', error);
    throw error;
  }
}

// Run the finalizer
finalizeMonthIndex()
  .then(() => {
    console.log('Index finalization completed successfully.');
  })
  .catch((error) => {
    console.error('Failed to finalize index:', error);
    process.exit(1);
  });