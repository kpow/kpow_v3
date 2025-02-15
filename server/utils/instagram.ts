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

export async function fetchInstagramData(): Promise<InstagramMedia[]> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("Instagram access token not found");
  }

  try {
    const url = `https://graph.instagram.com/me/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,children{id,media_type,media_url,thumbnail_url}&limit=100&access_token=${accessToken}`;

    const response = await axios.get(url);
    const data = response.data.data;

    // Ensure we properly format carousel albums
    return data.map((item: InstagramMedia) => {
      if (item.media_type === "CAROUSEL_ALBUM" && item.children?.data) {
        return {
          ...item,
          children: {
            data: item.children.data.map((child: InstagramMediaChild) => ({
              id: child.id,
              media_type: child.media_type,
              media_url: child.media_url,
              thumbnail_url: child.thumbnail_url,
            })),
          },
        };
      }
      return item;
    });
  } catch (error) {
    console.error("Error fetching Instagram data:", error);
    throw new Error("Failed to fetch Instagram data from API");
  }
}