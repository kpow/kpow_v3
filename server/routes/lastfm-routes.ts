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

  // New endpoint for artist albums
  router.get("/api/lastfm/artist-albums/:artist", async (req, res) => {
    try {
      const artistName = req.params.artist;
      console.log("Fetching albums for artist:", artistName);

      const data = await fetchLastFmData("artist.getTopAlbums", {
        artist: artistName,
        autocorrect: "1",
        limit: "10"  // Get top 10 albums
      });

      if (!data.topalbums?.album) {
        throw new Error("No albums found in Last.fm response");
      }

      // Transform the response to include only what we need
      const albums = data.topalbums.album.map((album: any) => ({
        name: album.name,
        artist: album.artist.name,
        image: album.image.find((img: any) => img.size === "large")["#text"],
        playcount: album.playcount
      }));

      console.log("Last.fm albums response:", JSON.stringify(albums, null, 2));

      res.json({ albums });
    } catch (error) {
      console.error("Error in /api/lastfm/artist-albums:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch artist albums" 
      });
    }
  });
  // New endpoint for artist.getInfo
  router.get("/api/lastfm/artist-info/:artist", async (req, res) => {
    try {
      const artistName = req.params.artist;
      console.log("Fetching artist info for:", artistName);

      const data = await fetchLastFmData("artist.getInfo", {
        artist: artistName,
        autocorrect: "1",
      });

      if (!data.artist) {
        throw new Error("No artist found in Last.fm response");
      }

      // Log the response to check the structure
      console.log("Last.fm artist info response:", JSON.stringify(data, null, 2));

      res.json(data);
    } catch (error) {
      console.error("Error in /api/lastfm/artist-info:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch artist info" 
      });
    }
  });
}