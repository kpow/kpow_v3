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

// Get Instagram feed
router.get('/feed', async (req, res) => {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('Instagram access token not found');
    }

    const response = await axios.get(
      `https://graph.instagram.com/me/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,children{media_type,media_url,thumbnail_url}&access_token=${accessToken}`
    );

    // Process the response to handle carousel albums
    const processedData = response.data.data.map((item: InstagramMedia) => {
      if (item.media_type === 'CAROUSEL_ALBUM' && item.children) {
        return {
          ...item,
          carousel_media: item.children.data
        };
      }
      return item;
    });

    res.json(processedData);
  } catch (error) {
    console.error('Error fetching Instagram feed:', error);
    res.status(500).json({ error: 'Failed to fetch Instagram feed' });
  }
});

export default router;