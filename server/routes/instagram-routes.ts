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
  children?: {
    data: InstagramMediaChild[];
  };
}

router.get('/feed', async (req, res) => {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 100; 

    if (!accessToken) {
      throw new Error('Instagram access token not found');
    }

    // Get maximum allowed items (100) in one request
    const url = `https://graph.instagram.com/me/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,children{media_type,media_url,thumbnail_url}&limit=100&access_token=${accessToken}`;

    const response = await axios.get(url);
    const allPosts = response.data.data;

    // Get the requested page of data
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedPosts = allPosts.slice(start, end);

    res.json({
      posts: paginatedPosts,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(allPosts.length / pageSize),
        total_count: allPosts.length,
        has_next_page: end < allPosts.length
      }
    });
  } catch (error) {
    console.error('Error fetching Instagram feed:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Instagram feed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;