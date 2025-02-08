import { Router } from 'express';
import axios from 'axios';

const router = Router();

interface InstagramMediaChild {
  id: string;
  media_type: 'IMAGE' | 'VIDEO';
  media_url: string;
  thumbnail_url?: string;
}

interface InstagramMedia {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  timestamp: string;
  location?: {
    id: string;
    name: string;
  };
  children?: {
    data: InstagramMediaChild[];
  };
}

// Get Instagram feed with pagination
router.get('/feed', async (req, res) => {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 9;

    if (!accessToken) {
      throw new Error('Instagram access token not found');
    }

    // First, get total count of media items
    const countUrl = `https://graph.instagram.com/me/media?fields=id&limit=100&access_token=${accessToken}`;
    const countResponse = await axios.get(countUrl);
    const totalCount = countResponse.data.data.length;

    // Calculate pagination
    const offset = (page - 1) * pageSize;

    // Then get the actual page of data with location included in fields
    const url = `https://graph.instagram.com/me/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,location,children{media_type,media_url,thumbnail_url}&limit=${pageSize * page}&access_token=${accessToken}`;

    const response = await axios.get(url);
    const posts = response.data.data;

    // Get the current page's worth of posts
    const paginatedPosts = posts.slice(offset, offset + pageSize);

    // Return both the posts and pagination info
    res.json({
      posts: paginatedPosts,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(totalCount / pageSize),
        total_count: totalCount,
        has_next_page: offset + pageSize < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching Instagram feed:', error);
    res.status(500).json({ error: 'Failed to fetch Instagram feed' });
  }
});

export default router;