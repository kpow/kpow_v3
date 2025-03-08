import { Router } from "express";
import { db } from "../../db";
import { eq, desc, sql } from "drizzle-orm";
import { artists, plays, songs } from "../../db/schema";

export function registerMusicRoutes(router: Router) {
  // Get top artists by play count
  router.get("/api/music/top-artists", async (_req, res) => {
    try {
      const topArtists = await db
        .select({
          id: artists.id,
          name: artists.name,
          bio: artists.bio,
          imageUrl: artists.imageUrl,
          artistImageUrl: artists.artistImageUrl,
          listeners: artists.listeners,
          playcount: artists.playcount,
          lastUpdated: artists.lastUpdated,
          playCount: sql<number>`COUNT(${plays.id})`.as('play_count'),
          lastPlayed: sql<string>`MAX(${plays.startTimestamp})`.as('last_played')
        })
        .from(artists)
        .leftJoin(songs, eq(songs.artistId, artists.id))
        .leftJoin(plays, eq(plays.songId, songs.id))
        .groupBy(artists.id)
        .orderBy(desc(sql`play_count`))
        .limit(500);

      // Add ranking to each artist
      const rankedArtists = topArtists.map((artist, index) => ({
        ...artist,
        rank: index + 1
      }));

      res.json({ artists: rankedArtists });
    } catch (error) {
      console.error("Error fetching top artists:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch top artists" 
      });
    }
  });

  // Get single artist details with recent plays
  router.get("/api/music/artists/:id", async (req, res) => {
    try {
      const artistId = parseInt(req.params.id);

      const artistWithSongs = await db.query.artists.findFirst({
        where: eq(artists.id, artistId),
        with: {
          songs: {
            with: {
              plays: {
                limit: 10,
                orderBy: [desc(plays.startTimestamp)]
              }
            }
          }
        }
      });

      if (!artistWithSongs) {
        return res.status(404).json({ message: "Artist not found" });
      }

      // Transform the data to match the expected format
      const artist = {
        ...artistWithSongs,
        plays: artistWithSongs.songs.flatMap(song => 
          song.plays.map(play => ({
            id: play.id,
            startTimestamp: play.startTimestamp,
            songName: song.name
          }))
        ).sort((a, b) => 
          new Date(b.startTimestamp).getTime() - new Date(a.startTimestamp).getTime()
        ).slice(0, 10)
      };

      res.json({ artist });
    } catch (error) {
      console.error("Error fetching artist details:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch artist details" 
      });
    }
  });

  // Get top songs by year
  router.get("/api/music/top-songs-by-year", async (_req, res) => {
    try {
      const songsByYear = await db
        .select({
          year: sql<number>`EXTRACT(YEAR FROM ${plays.startTimestamp})::integer`,
          songId: songs.id,
          songName: songs.name,
          artistId: songs.artistId,
          artistName: artists.name,
          artistImageUrl: artists.artistImageUrl,
          playCount: sql<number>`COUNT(${plays.id})`.as('play_count'),
        })
        .from(plays)
        .innerJoin(songs, eq(plays.songId, songs.id))
        .innerJoin(artists, eq(songs.artistId, artists.id))
        .groupBy(sql`EXTRACT(YEAR FROM ${plays.startTimestamp})`, songs.id, artists.id)
        .orderBy(
          sql`EXTRACT(YEAR FROM ${plays.startTimestamp})`,
          desc(sql`play_count`),
        );

      // Group by year and take top 5 for each
      const topSongsByYear = songsByYear.reduce((acc, song) => {
        if (!acc[song.year]) {
          acc[song.year] = [];
        }
        if (acc[song.year].length < 5) {
          acc[song.year].push(song);
        }
        return acc;
      }, {} as Record<number, typeof songsByYear>);

      res.json({ songsByYear: topSongsByYear });
    } catch (error) {
      console.error("Error fetching top songs by year:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to fetch top songs by year"
      });
    }
  });
}