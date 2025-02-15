import { Router } from "express";
import { getInstagramCache, updateInstagramCache } from "../utils/instagram-cache";

const router = Router();

// Get Instagram feed from cache
router.get("/feed", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 100;

    // Get cached data
    const allPosts = getInstagramCache();

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
        has_next_page: end < allPosts.length,
      },
    });
  } catch (error) {
    console.error("Error fetching Instagram feed from cache:", error);
    res.status(500).json({
      error: "Failed to fetch Instagram feed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Manual trigger to update the Instagram cache
router.post("/update-cache", async (req, res) => {
  try {
    const result = await updateInstagramCache();
    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(500).json({ error: result.message });
    }
  } catch (error) {
    console.error("Error updating Instagram cache:", error);
    res.status(500).json({
      error: "Failed to update Instagram cache",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;