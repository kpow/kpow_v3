import fs from 'fs';
import path from 'path';

// Define the structure for our month index
export interface MonthIndexEntry {
  month: number;   // 1-12
  year: number;    // e.g., 2023, 2024
  startPage: number;
  articlesCount: number; // Count at the time the index was created
}

interface MonthIndex {
  entries: MonthIndexEntry[];
  lastUpdated: string;
  totalArticles: number; // Total articles count when last updated
}

const INDEX_FILE_PATH = path.join(process.cwd(), 'data', 'feedbin-month-index.json');

// Make sure the data directory exists
const ensureDataDir = () => {
  const dataDir = path.dirname(INDEX_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Load the month index from disk, or return a default empty one
export const loadMonthIndex = (): MonthIndex => {
  ensureDataDir();
  
  try {
    if (fs.existsSync(INDEX_FILE_PATH)) {
      const data = fs.readFileSync(INDEX_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading month index:', error);
  }

  // Default empty index
  return {
    entries: [],
    lastUpdated: new Date().toISOString(),
    totalArticles: 0
  };
};

// Save the month index to disk
export const saveMonthIndex = (index: MonthIndex): void => {
  ensureDataDir();
  
  try {
    fs.writeFileSync(
      INDEX_FILE_PATH, 
      JSON.stringify(index, null, 2), 
      'utf8'
    );
  } catch (error) {
    console.error('Error saving month index:', error);
  }
};

// Find the page number for a specific month and year
export const findPageForMonth = (month: number, year: number): number | null => {
  const index = loadMonthIndex();
  
  // Find the entry for this month/year
  const entry = index.entries.find(e => e.month === month && e.year === year);
  if (entry) {
    return entry.startPage;
  }
  
  return null;
};

// Update or add an entry to the month index
export const updateMonthIndex = (
  month: number, 
  year: number, 
  startPage: number, 
  articlesCount: number,
  totalArticles: number
): void => {
  const index = loadMonthIndex();
  
  // Find if this month/year already exists
  const existingEntryIndex = index.entries.findIndex(
    e => e.month === month && e.year === year
  );
  
  if (existingEntryIndex >= 0) {
    // Update existing entry
    index.entries[existingEntryIndex] = {
      month,
      year,
      startPage,
      articlesCount
    };
  } else {
    // Add new entry
    index.entries.push({
      month,
      year,
      startPage,
      articlesCount
    });
  }
  
  // Sort entries by year and month (newest first)
  index.entries.sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year;
    }
    return b.month - a.month;
  });
  
  // Update metadata
  index.lastUpdated = new Date().toISOString();
  index.totalArticles = totalArticles;
  
  // Save to disk
  saveMonthIndex(index);
};

// Get all available months in the index
export const getAvailableMonths = (): { month: number; year: number }[] => {
  const index = loadMonthIndex();
  return index.entries.map(entry => ({
    month: entry.month,
    year: entry.year
  }));
};

// Function to generate a month name (e.g., "January", "February")
export const getMonthName = (month: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || 'Unknown';
};