import { Router } from "express";
import { google } from "googleapis";

const router = Router();
const youtube = google.youtube("v3");

router.get("/playlist/:playlistId", async (req, res) => {
  try {
    const playlistId = req.params.playlistId;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 9;
    const pageToken = req.query.pageToken as string;

    const response = await youtube.playlistItems.list({
      key: process.env.YOUTUBE_API_KEY,
      part: ["snippet", "contentDetails"],
      playlistId,
      maxResults: pageSize,
      pageToken,
    });

    const videoIds = response.data.items?.map(
      (item) => item.contentDetails?.videoId
    ).filter(Boolean) as string[];

    const videosResponse = await youtube.videos.list({
      key: process.env.YOUTUBE_API_KEY,
      part: ["contentDetails"],
      id: videoIds,
    });

    const items = response.data.items?.map((item, index) => ({
      id: item.contentDetails?.videoId,
      title: item.snippet?.title,
      description: item.snippet?.description,
      thumbnail: item.snippet?.thumbnails?.high?.url,
      duration: videosResponse.data.items?.[index]?.contentDetails?.duration,
    }));

    res.json({
      items,
      hasNextPage: !!response.data.nextPageToken,
      nextPageToken: response.data.nextPageToken,
    });
  } catch (error) {
    console.error("YouTube API Error:", error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

export default router;
