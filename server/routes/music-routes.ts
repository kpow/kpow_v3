import { Router } from "express";
import { db } from "../../db";
import { eq, desc, sql, and, asc } from "drizzle-orm";
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
        .groupBy(artists.id, artists.name, artists.bio, artists.imageUrl, artists.artistImageUrl, artists.listeners, artists.playcount, artists.lastUpdated)
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
          artistId: artists.id,
          artistName: artists.name,
          imageUrl: artists.imageUrl,
          playCount: sql<number>`COUNT(${plays.id})`.as('play_count'),
        })
        .from(plays)
        .innerJoin(songs, eq(plays.songId, songs.id))
        .innerJoin(artists, eq(songs.artistId, artists.id))
        .where(
          sql`${artists.name} != 'Unknown' AND ${artists.name} IS NOT NULL`
        )
        .groupBy(
          sql`EXTRACT(YEAR FROM ${plays.startTimestamp})::integer`,
          songs.id,
          songs.name,
          artists.id,
          artists.name,
          artists.imageUrl
        )
        .orderBy(
          desc(sql`EXTRACT(YEAR FROM ${plays.startTimestamp})::integer`),
          desc(sql`COUNT(${plays.id})`)
        );

      // Group by year and take top 5 for each
      const topSongsByYear: Record<number, (typeof songsByYear[number][] & { imageUrl?: string })> = {};

      // First, group songs by year and ensure proper sorting
      songsByYear.forEach((song) => {
        if (!topSongsByYear[song.year]) {
          topSongsByYear[song.year] = [];
        }
        // Only add if we don't have 5 songs yet for this year
        if (topSongsByYear[song.year].length < 5) {
          topSongsByYear[song.year].push(song);
        }
      });

      // Then, find representative images for each year
      Object.entries(topSongsByYear).forEach(([year, songs]) => {
        // First try to find image from the top song's artist
        const topSongImage = songs[0]?.imageUrl;
        if (topSongImage) {
          (topSongsByYear[Number(year)] as any).imageUrl = topSongImage;
        } else {
          // If top artist doesn't have image, find first artist with an image
          const artistWithImage = songs.find(song => song.imageUrl);
          if (artistWithImage) {
            (topSongsByYear[Number(year)] as any).imageUrl = artistWithImage.imageUrl;
          }
        }
      });

      res.json({ songsByYear: topSongsByYear });
    } catch (error) {
      console.error("Error fetching top songs by year:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to fetch top songs by year"
      });
    }
  });

  // Get available years from plays
  router.get("/api/music/available-years", async (_req, res) => {
    try {
      const yearsData = await db
        .select({
          year: sql<number>`EXTRACT(YEAR FROM ${plays.startTimestamp})::integer`,
        })
        .from(plays)
        .groupBy(sql`EXTRACT(YEAR FROM ${plays.startTimestamp})::integer`)
        .orderBy(desc(sql`EXTRACT(YEAR FROM ${plays.startTimestamp})::integer`));

      const years = yearsData.map(y => y.year.toString());

      res.json({ years });
    } catch (error) {
      console.error("Error fetching available years:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to fetch available years"
      });
    }
  });

  // Get top artists by year
  router.get("/api/music/top-artists-by-year/:year", async (req, res) => {
    try {
      const year = parseInt(req.params.year);

      const topArtists = await db
        .select({
          id: artists.id,
          name: artists.name,
          imageUrl: artists.imageUrl,
          artistImageUrl: artists.artistImageUrl,
          playCount: sql<number>`COUNT(${plays.id})`.as('play_count'),
        })
        .from(artists)
        .leftJoin(songs, eq(songs.artistId, artists.id))
        .leftJoin(plays, eq(plays.songId, songs.id))
        .where(
          and(
            sql`EXTRACT(YEAR FROM ${plays.startTimestamp})::integer = ${year}`,
            sql`${artists.name} != 'Unknown' AND ${artists.name} IS NOT NULL`
          )
        )
        .groupBy(artists.id, artists.name, artists.imageUrl, artists.artistImageUrl)
        .orderBy(desc(sql`play_count`))
        .limit(10);

      res.json({ artists: topArtists });
    } catch (error) {
      console.error("Error fetching top artists by year:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to fetch top artists by year"
      });
    }
  });
  // Get top songs by year
  router.get("/api/music/top-songs-by-year/:year", async (req, res) => {
    try {
      const year = parseInt(req.params.year);

      const topSongs = await db
        .select({
          id: songs.id,
          name: songs.name,
          artistId: artists.id,
          artistName: artists.name,
          imageUrl: artists.imageUrl,
          artistImageUrl: artists.artistImageUrl,
          playCount: sql<number>`COUNT(${plays.id})`.as('play_count'),
        })
        .from(songs)
        .innerJoin(plays, eq(plays.songId, songs.id))
        .innerJoin(artists, eq(songs.artistId, artists.id))
        .where(
          and(
            sql`EXTRACT(YEAR FROM ${plays.startTimestamp})::integer = ${year}`,
            sql`${artists.name} != 'Unknown' AND ${artists.name} IS NOT NULL`
          )
        )
        .groupBy(
          songs.id,
          songs.name,
          artists.id,
          artists.name,
          artists.imageUrl,
          artists.artistImageUrl
        )
        .orderBy(desc(sql`play_count`))
        .limit(10);

      res.json({ songs: topSongs });
    } catch (error) {
      console.error("Error fetching top songs by year:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to fetch top songs by year"
      });
    }
  });

  // Get paginated artists endpoint
  router.get("/api/music/artists", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = 10;
      const offset = (page - 1) * limit;

      // First get total count
      const countResult = await db
        .select({
          count: sql<number>`count(distinct ${artists.id})`
        })
        .from(artists);

      const totalCount = Number(countResult[0].count);

      // Then get paginated data
      const data = await db
        .select({
          id: artists.id,
          name: artists.name,
          imageUrl: artists.image_url,
          totalPlays: sql<number>`count(distinct ${plays.id})`.as('total_plays'),
          uniqueSongs: sql<number>`count(distinct ${songs.id})`.as('unique_songs'),
          firstPlayed: sql<string>`min(${plays.start_timestamp})`.as('first_played'),
          lastPlayed: sql<string>`max(${plays.start_timestamp})`.as('last_played')
        })
        .from(artists)
        .leftJoin(songs, eq(songs.artist_id, artists.id))
        .leftJoin(plays, eq(plays.song_id, songs.id))
        .groupBy(artists.id, artists.name, artists.image_url)
        .orderBy(desc(sql`count(distinct ${plays.id})`))
        .limit(limit)
        .offset(offset);

      res.json({
        data,
        totalPages: Math.ceil(totalCount / limit)
      });
    } catch (error) {
      console.error("Error fetching artists:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to fetch artists"
      });
    }
  });

  // Get paginated songs endpoint
  router.get("/api/music/songs", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = 10;
      const offset = (page - 1) * limit;

      // First get total count
      const countResult = await db
        .select({
          count: sql<number>`count(distinct ${songs.id})`
        })
        .from(songs);

      const totalCount = Number(countResult[0].count);

      // Then get paginated data
      const data = await db
        .select({
          id: songs.id,
          songName: songs.name,
          artistName: artists.name,
          albumName: songs.album_name,
          totalPlays: sql<number>`count(distinct ${plays.id})`.as('total_plays'),
          firstPlayed: sql<string>`min(${plays.start_timestamp})`.as('first_played'),
          lastPlayed: sql<string>`max(${plays.start_timestamp})`.as('last_played'),
          artistImage: artists.image_url
        })
        .from(songs)
        .leftJoin(artists, eq(songs.artist_id, artists.id))
        .leftJoin(plays, eq(plays.song_id, songs.id))
        .groupBy(songs.id, songs.name, songs.album_name, artists.name, artists.image_url)
        .orderBy(desc(sql`count(distinct ${plays.id})`))
        .limit(limit)
        .offset(offset);

      res.json({
        data,
        totalPages: Math.ceil(totalCount / limit)
      });
    } catch (error) {
      console.error("Error fetching songs:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to fetch songs"
      });
    }
  });

  // Get paginated plays endpoint
  router.get("/api/music/plays", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = 10;
      const offset = (page - 1) * limit;

      // First get total count
      const countResult = await db
        .select({
          count: sql<number>`count(*)`
        })
        .from(plays);

      const totalCount = Number(countResult[0].count);

      // Then get paginated data
      const data = await db
        .select({
          id: plays.id,
          startTimestamp: plays.start_timestamp,
          songName: songs.name,
          artistName: artists.name,
          albumName: songs.album_name,
          artistImage: artists.image_url
        })
        .from(plays)
        .innerJoin(songs, eq(plays.song_id, songs.id))
        .innerJoin(artists, eq(songs.artist_id, artists.id))
        .orderBy(desc(plays.start_timestamp))
        .limit(limit)
        .offset(offset);

      res.json({
        data,
        totalPages: Math.ceil(totalCount / limit)
      });
    } catch (error) {
      console.error("Error fetching plays:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to fetch plays"
      });
    }
  });

  return router;
}