import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchInstagramData } from '../utils/instagram.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_FILE = path.join(__dirname, '../../client/src/data/instagram-feed.json');

export async function updateInstagramCache() {
  try {
    const data = await fetchInstagramData();

    // Ensure the directory exists
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write the data to the cache file
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));

    return { success: true, message: 'Instagram cache updated successfully' };
  } catch (error: any) {
    console.error('Error updating Instagram cache:', error);
    return { success: false, message: error.message };
  }
}

export function getInstagramCache() {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      return [];
    }
    const data = fs.readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading Instagram cache:', error);
    return [];
  }
}