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

  router.get("/api/lastfm/top-tracks", async (_req, res) => {
    try {
      const topTracksData = await fetchLastFmData("user.gettoptracks", {
        user: "krakap",
        limit: "20",
        period: "overall",
      });

      if (!topTracksData.toptracks?.track) {
        throw new Error("No top tracks found in Last.fm response");
      }

      const tracks = await Promise.all(
        topTracksData.toptracks.track.map(async (track: any) => {
          const trackInfo = await fetchLastFmData("track.getInfo", {
            track: track.name,
            artist: track.artist.name,
            username: "krakap",
          });

          const charts = await fetchLastFmData("user.getweeklychartlist", {
            user: "krakap",
          });

          const playHistory = await Promise.all(
            charts.weeklychartlist.chart
              .slice(-52)
              .map(async (week: any) => {
                const weeklyTrackChart = await fetchLastFmData("user.getweeklytrackchart", {
                  user: "krakap",
                  from: week.from,
                  to: week.to,
                });

                const trackPlays = weeklyTrackChart.weeklytrackchart?.track?.find(
                  (t: any) => t.name === track.name && t.artist["#text"] === track.artist.name
                );

                return {
                  from: new Date(Number(week.from) * 1000).toISOString(),
                  to: new Date(Number(week.to) * 1000).toISOString(),
                  playcount: trackPlays ? parseInt(trackPlays.playcount) : 0,
                };
              })
          );

          return {
            name: track.name,
            artist: track.artist.name,
            totalPlaycount: parseInt(track.playcount),
            rank: parseInt(track["@attr"].rank),
            url: track.url,
            firstPlayed: trackInfo.track?.userplaycount
              ? new Date(Number(trackInfo.track.userplaycount) * 1000).toISOString()
              : null,
            playHistory,
          };
        })
      );

      const sortedTracks = tracks.sort((a, b) => b.totalPlaycount - a.totalPlaycount);

      res.json({ tracks: sortedTracks });
    } catch (error) {
      console.error("Error in /api/lastfm/top-tracks:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });
}