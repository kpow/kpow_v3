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

// Get Instagram feed with pagination
router.get('/feed', async (req, res) => {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const pageSize = parseInt(req.query.pageSize as string) || 9;
    const pageToken = req.query.pageToken as string;

    if (!accessToken) {
      throw new Error('Instagram access token not found');
    }

    // First, get total count of media items
    const countUrl = `https://graph.instagram.com/me/media?fields=id&limit=100&access_token=${accessToken}`;
    const countResponse = await axios.get(countUrl);
    const totalCount = countResponse.data.data.length;

    // Then get the actual page of data
    let url = `https://graph.instagram.com/me/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,children{media_type,media_url,thumbnail_url}&limit=${pageSize}&access_token=${accessToken}`;

    if (pageToken) {
      url += `&after=${pageToken}`;
    }

    const response = await axios.get(url);

    // Return both the posts and pagination info
    res.json({
      posts: response.data.data.slice(0, pageSize), // Ensure we only return pageSize items
      pagination: {
        next_token: response.data.paging?.cursors?.after || null,
        has_next_page: !!response.data.paging?.next,
        total_count: totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching Instagram feed:', error);
    res.status(500).json({ error: 'Failed to fetch Instagram feed' });
  }
});

export default router;