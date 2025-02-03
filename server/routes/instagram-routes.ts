import { Router } from 'express';
import axios from 'axios';

const router = Router();

interface InstagramMedia {
  id: string;
  media_type: string;
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  timestamp: string;
}

// Get Instagram feed
router.get('/feed', async (req, res) => {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('Instagram access token not found');
    }

    const response = await axios.get(
      `https://graph.instagram.com/me/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp&access_token=${accessToken}`
    );

    res.json(response.data.data);
  } catch (error) {
    console.error('Error fetching Instagram feed:', error);
    res.status(500).json({ error: 'Failed to fetch Instagram feed' });
  }
});

export default router;
