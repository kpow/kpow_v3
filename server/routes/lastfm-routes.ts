import { Router } from "express";
import { fetchLastFmData } from "../utils/api-utils";

export function registerLastFmRoutes(router: Router) {
  router.get("/api/lastfm/recent-tracks", async (_req, res) => {
    try {
      const data = await fetchLastFmData("user.getrecenttracks", {
        user: "krakap",
        limit: "100",
        page: "1",
      });

      if (!data.recenttracks?.track) {
        throw new Error("No tracks found in Last.fm response");
      }

      const tracks = data.recenttracks.track.map((track: any) => ({
        name: track.name,
        artist: track.artist["#text"],
        album: track.album["#text"],
        image: track.image.find((img: any) => img.size === "large")["#text"],
        url: track.url,
        date: track.date?.uts
          ? new Date(Number(track.date.uts) * 1000).toISOString()
          : null,
        nowPlaying: !!track["@attr"]?.nowplaying,
      }));

      res.json({ tracks });
    } catch (error) {
      console.error("Error in /api/lastfm/recent-tracks:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // New endpoint for artist album lookup
  router.get("/api/lastfm/artist-albums", async (req, res) => {
    try {
      const artist = req.query.artist as string;
      if (!artist) {
        return res.status(400).json({ error: "Artist parameter is required" });
      }

      const data = await fetchLastFmData("artist.gettopalbums", {
        artist: artist,
        limit: "50"
      });

      console.log("Last.fm API Response:", data);

      if (data.error) {
        throw new Error(data.message);
      }

      res.json(data);
    } catch (error) {
      console.error("Error in /api/lastfm/artist-albums:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });
}