import { Router } from 'express';
import { db } from '@db';
import { artists } from '@db/schema';
import { sql } from 'drizzle-orm';
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
    const { page = 1, pageSize = 10, sortBy, sortOrder = 'asc' } = req.query as unknown as TableQueryParams;
    const offset = (page - 1) * pageSize;

    // Get total count
    const countResult = await db.select({ 
      count: sql<number>`count(*)`.mapWith(Number) 
    }).from(artists);

    const total = countResult[0].count;

    // Get paginated data
    const data = await db.query.artists.findMany({
      limit: pageSize,
      offset,
      orderBy: sortBy ? (sortOrder === 'asc' ? sql`${(artists as any)[sortBy]} asc` : sql`${(artists as any)[sortBy]} desc`) : undefined,
    });

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