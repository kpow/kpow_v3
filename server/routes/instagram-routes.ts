import { Router } from "express";
import axios from "axios";

interface InstagramMediaChild {
  id: string;
  media_type: "IMAGE" | "VIDEO";
  media_url: string;
  thumbnail_url?: string;
}

interface InstagramMedia {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  timestamp: string;
  children?: {
    data: InstagramMediaChild[];
  };
}

const router = Router();

router.get("/feed", async (req, res) => {
  try {
    // const accessToken = 'process.env.INSTAGRAM_ACCESS_TOKEN';
    const accessToken =
      "IGAAM8gJ7ZB7gRBZAE02Y3V5aUVnaTRBMWRSWVhMb0hWWVA5aENYZAzlzOFhTZAGlZASXFISXh1U01KQ3hJUUN1S29UTURDeGpqN3NkVFBraTBRMl83cjhBV3FaYzhSTTdoUEYwMWtpTDJwczZAVX1B2V01zc2J5THBDdU1QOG55VkNSNAZDZD";

    if (!accessToken) {
      throw new Error("Instagram access token not found");
    }

    const url = `https://graph.instagram.com/me/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,children{media_type,media_url,thumbnail_url}&limit=100&access_token=${accessToken}`;

    const response = await axios.get(url);
    const posts = response.data.data;

    res.json({
      posts,
    });
  } catch (error) {
    console.error("Error fetching Instagram feed:", error);
    res.status(500).json({
      error: "Failed to fetch Instagram feed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
