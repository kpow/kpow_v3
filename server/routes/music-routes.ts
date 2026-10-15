import type { NextFunction, Request, Response, Router } from "express";
import { randomBytes } from "crypto";
import { db } from "../../db";
import { eq, desc, sql, and } from "drizzle-orm";
import { artists, plays, songs } from "../../db/schema";
import { LISTEN_SQL, ensureMusicTables } from "../lib/music/store";
import { authorizeUrl, disconnect, exchangeCode, spotifyConfigured } from "../lib/music/spotify";
import { musicStatus, startMusicSync, syncMusic } from "../lib/music/sync";

// Plays come from the Apple export, Last.fm and Spotify (server/lib/music). An
// Apple-export play under 30 s is a skip, so every count uses `isListen`.
const isListen = sql.raw(LISTEN_SQL);

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
  if (!req.user?.approved) return res.status(403).json({ error: "Account not approved" });
  next();
}

const callbackUri = (req: Request) =>
  process.env.SPOTIFY_REDIRECT_URI || `${req.protocol}://${req.get("host")}/api/admin/spotify/callback`;

export function registerMusicRoutes(router: Router) {
  // The listen rule needs the new plays columns before any stats query runs.
  router.use("/api/music", (_req, res, next) => {
    ensureMusicTables().then(() => next(), (e) => res.status(503).json({ message: e.message }));
  });
  startMusicSync();

  router.get("/api/admin/music", requireAdmin, async (_req, res) => {
    try {
      res.json(await musicStatus());
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  router.post("/api/admin/music/sync", requireAdmin, async (_req, res) => {
    try {
      await syncMusic();
      res.json(await musicStatus());
    } catch (e) {
      res.status(502).json({ error: (e as Error).message });
    }
  });

  // One-time Spotify login: /admin/music → Spotify → back here with a code.
  router.get("/api/admin/spotify/connect", requireAdmin, (req, res) => {
    if (!spotifyConfigured()) return res.status(503).send("Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET first.");
    const state = randomBytes(16).toString("hex");
    (req.session as any).spotifyState = state;
    res.redirect(authorizeUrl(callbackUri(req), state));
  });

  router.get("/api/admin/spotify/callback", requireAdmin, async (req, res) => {
    const back = (q: string) => res.redirect(`/admin/music?${q}`);
    const want = (req.session as any).spotifyState;
    delete (req.session as any).spotifyState;
    if (req.query.error) return back(`spotify=error&msg=${encodeURIComponent(String(req.query.error))}`);
    if (!want || req.query.state !== want) return back("spotify=error&msg=state");
    try {
      await exchangeCode(String(req.query.code), callbackUri(req));
      syncMusic().catch(() => {});
      back("spotify=connected");
    } catch (e) {
      back(`spotify=error&msg=${encodeURIComponent((e as Error).message)}`);
    }
  });

  router.post("/api/admin/spotify/disconnect", requireAdmin, async (_req, res) => {
    await disconnect();
    res.json(await musicStatus());
  });

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
        .leftJoin(plays, and(eq(plays.songId, songs.id), isListen))
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
          and(isListen, sql`${artists.name} != 'Unknown' AND ${artists.name} IS NOT NULL`)
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
        .where(isListen)
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
            isListen,
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
            isListen,
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

  // New route for paginated songs data
  router.get("/api/music/songs", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 25;
      const offset = (page - 1) * pageSize;

      const songsQuery = await db
        .select({
          id: songs.id,
          name: songs.name,
          albumName: songs.albumName,
          mediaDurationMs: songs.mediaDurationMs,
          artistId: artists.id,
          artistName: artists.name,
          artistImageUrl: artists.artistImageUrl,
          playCount: sql<number>`COUNT(${plays.id})`.as('play_count'),
          lastPlayed: sql<string>`MAX(${plays.startTimestamp})`.as('last_played')
        })
        .from(songs)
        .leftJoin(artists, eq(songs.artistId, artists.id))
        .leftJoin(plays, and(eq(plays.songId, songs.id), isListen))
        .groupBy(songs.id, songs.name, songs.albumName, songs.mediaDurationMs, 
                artists.id, artists.name, artists.artistImageUrl)
        .limit(pageSize)
        .offset(offset);

      // Get total count for pagination
      const totalCountResult = await db
        .select({ count: sql<number>`COUNT(*)`.as('count') })
        .from(songs)
        .execute();

      const totalCount = totalCountResult[0].count;
      const totalPages = Math.ceil(totalCount / pageSize);

      res.json({
        songs: songsQuery,
        pagination: {
          currentPage: page,
          totalPages,
          pageSize,
          totalCount
        }
      });
    } catch (error) {
      console.error("Error fetching paginated songs:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to fetch songs"
      });
    }
  });
}