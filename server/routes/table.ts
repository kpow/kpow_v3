import { Router } from 'express';
import { db } from '@db';
import { artists, songs, plays } from '@db/schema';
import { sql, desc, asc, count } from 'drizzle-orm';
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
    let sortOrder = (req.query.sortOrder as string)?.toLowerCase() === 'desc' ? 'desc' : 'asc';

    const offset = (page - 1) * pageSize;

    // Get total count first
    const countResult = await db.select({ 
      count: sql<number>`count(*)`.mapWith(Number) 
    })
    .from(artists);

    const total = countResult[0].count;

    // Build the query with proper sorting
    let sortColumn;
    
    // Handle special cases for sorting
    if (sortBy === 'artist') {
      sortColumn = artists.name;
    } else if (sortBy === 'rank' || sortBy === 'personalPlayCount') {
      // For rank based on personal play count, we'll handle this using a subquery
      // We'll use a special orderBy clause below
      sortColumn = artists.id; // Placeholder, will be replaced
    } else {
      sortColumn = (artists as any)[sortBy] || artists.id;
    }
    
    // Before getting paginated data, first get all artists with their play counts using a subquery
    // This creates a CTE (Common Table Expression) for play counts per artist
    const artistsWithPlayCounts = db
      .select({
        artistId: artists.id,
        personalPlayCount: count(plays.id).as('personalPlayCount'),
      })
      .from(artists)
      .leftJoin(songs, sql`${artists.id} = ${songs.artistId}`)
      .leftJoin(plays, sql`${songs.id} = ${plays.songId}`)
      .groupBy(artists.id)
      .as('artist_play_counts');

    // Customize the order by clause for rank sorting
    let orderByClause = [];
    if (sortBy === 'rank' || sortBy === 'personalPlayCount') {
      // When sorting by rank/personalPlayCount, we want to sort by play count
      if (sortOrder === 'desc') {
        // For descending, higher play count = higher rank (lower number)
        orderByClause.push(sql`"artist_play_counts"."personalPlayCount" ASC`);
      } else {
        // For ascending, lower play count = lower rank (higher number)
        orderByClause.push(sql`"artist_play_counts"."personalPlayCount" DESC`);
      }
    } else {
      // For other columns, use the standard order by
      orderByClause.push(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));
    }

    // Get paginated data with explicit fields including ranking
    const data = await db.select({
      id: artists.id,
      name: artists.name,
      imageUrl: artists.imageUrl,
      artistImageUrl: artists.artistImageUrl,
      bio: artists.bio,
      listeners: artists.listeners,
      playcount: artists.playcount,
      lastUpdated: artists.lastUpdated,
      personalPlayCount: artistsWithPlayCounts.personalPlayCount,
      // Rank calculation - row_number over personal play count
      rank: sql<number>`row_number() over (order by "artist_play_counts"."personalPlayCount" desc)`.mapWith(Number),
    })
    .from(artists)
    .leftJoin(artistsWithPlayCounts, sql`${artists.id} = ${artistsWithPlayCounts.artistId}`)
    .limit(pageSize)
    .offset(offset)
    .orderBy(...orderByClause);

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