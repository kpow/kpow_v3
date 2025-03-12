import { Router } from 'express';
import { db } from '@db';
import { songs, artists } from '@db/schema';
import { sql } from 'drizzle-orm';
import type { PaginatedResponse, TableQueryParams } from '@/types/database';

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

// GET /api/table/songs endpoint with pagination 
router.get('/songs', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, sortBy, sortOrder = 'asc' } = req.query as unknown as TableQueryParams;
    const offset = (page - 1) * pageSize;

    // Get total count
    const countResult = await db.select({ 
      count: sql<number>`count(*)`.mapWith(Number) 
    }).from(songs);

    const total = countResult[0].count;

    // Get paginated data
    const data = await db.query.songs.findMany({
      limit: pageSize,
      offset,
      with: {
        artist: true,
      },
      orderBy: sortBy ? (sortOrder === 'asc' ? sql`${songs[sortBy]} asc` : sql`${songs[sortBy]} desc`) : undefined,
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
    console.error('Error fetching songs:', error);
    res.status(500).json({ error: 'Failed to fetch songs' });
  }
});

export default router;