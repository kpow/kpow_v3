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
    const after = req.query.after as string | undefined;

    if (!accessToken) {
      throw new Error('Instagram access token not found');
    }

    let url = `https://graph.instagram.com/me/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,location,children{media_type,media_url,thumbnail_url}&access_token=${accessToken}`;

    if (after) {
      url += `&after=${after}`;
    }

    const response = await axios.get(url);

    // Return both the posts and pagination info
    res.json({
      posts: response.data.data,
      paging: response.data.paging || null
    });
  } catch (error) {
    console.error('Error fetching Instagram feed:', error);
    res.status(500).json({ error: 'Failed to fetch Instagram feed' });
  }
});

export default router;