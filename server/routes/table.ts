import { Router } from 'express';
import { db } from '@db';
import { artists } from '@db/schema';
import { sql, desc, asc } from 'drizzle-orm';
import type { PaginatedResponse, TableQueryParams } from '../../types/database';

const router = Router();

// GET /api/table/test endpoint for initial testing
router.get('/test', async (req, res) => {
  try {
    res.json({ 
      message: 'Table API is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/table/artists endpoint with pagination 
router.get('/artists', async (req, res) => {
  try {
    // Parse and validate query parameters
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 10));
    const sortBy = (req.query.sortBy as string) || 'id';
    const sortOrder = (req.query.sortOrder as string)?.toLowerCase() === 'desc' ? 'desc' : 'asc';

    const offset = (page - 1) * pageSize;

    // Get total count first
    const countResult = await db.select({ 
      count: sql<number>`count(*)`.mapWith(Number) 
    })
    .from(artists);

    const total = countResult[0].count;

    // Build the query with proper sorting
    let sortColumn;
    
    // Handle special case for 'artist' column which should sort by name
    if (sortBy === 'artist') {
      sortColumn = artists.name;
    } else {
      sortColumn = (artists as any)[sortBy] || artists.id;
    }
    
    const orderBy = sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn);

    // Get paginated data with explicit fields
    const data = await db.select({
      id: artists.id,
      name: artists.name,
      imageUrl: artists.imageUrl,
      artistImageUrl: artists.artistImageUrl,
      bio: artists.bio,
      listeners: artists.listeners,
      playcount: artists.playcount,
      lastUpdated: artists.lastUpdated,
    })
    .from(artists)
    .limit(pageSize)
    .offset(offset)
    .orderBy(orderBy);

    // Construct the response
    const response: PaginatedResponse<typeof data[0]> = {
      data,
      pagination: {
        page,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching artists:', error);
    res.status(500).json({ error: 'Failed to fetch artists' });
  }
});

export default router;