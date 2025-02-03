import { Router } from "express";
import { fetchPhishData } from "../utils/api-utils";
import path from "path";
import fs from "fs";

export function registerPhishRoutes(router: Router) {
  router.post("/api/admin/generate-shows-json", async (_req, res) => {
    try {
      console.log("Fetching all Phish shows...");
      const showsData = await fetchPhishData("/shows/artist/phish?order_by=showdate");
      console.log(`Received shows data. Length: ${Array.isArray(showsData) ? showsData.length : 'Not an array'}`);

      const assetsDir = path.join(process.cwd(), 'attached_assets');
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }
      const showsFilePath = path.join(assetsDir, 'all-phish-shows.json');
      fs.writeFileSync(showsFilePath, JSON.stringify(showsData, null, 2));
      res.json({ 
        message: "Shows data has been saved to JSON file", 
        count: Array.isArray(showsData) ? showsData.length : 0,
        path: showsFilePath 
      });
    } catch (error) {
      console.error("Error generating shows JSON:", error);
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          stack: error.stack
        });
      }
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Unknown error occurred",
        details: error instanceof Error ? error.stack : undefined
      });
    }
  });
  router.get("/api/shows", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const shows = await fetchPhishData("/attendance/username/koolyp");

      const sortedShows = shows.sort(
        (a: any, b: any) =>
          new Date(b.showdate).getTime() - new Date(a.showdate).getTime(),
      );

      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedShows = sortedShows.slice(start, end);

      const formattedShows = paginatedShows.map((show: any) => ({
        showid: show.showid,
        showdate: show.showdate,
        venue: show.venue,
        city: show.city,
        state: show.state,
        country: show.country,
        notes: show.notes,
      }));

      const total = shows.length;
      const totalPages = Math.ceil(total / limit);

      res.json({
        shows: formattedShows,
        pagination: {
          current: page,
          total: totalPages,
          hasMore: page < totalPages,
        },
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  router.get("/api/venues/stats", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 5;
      const shows = await fetchPhishData("/attendance/username/koolyp");

      const venueStats = shows.reduce(
        (acc: { [key: string]: number }, show: any) => {
          acc[show.venue] = (acc[show.venue] || 0) + 1;
          return acc;
        },
        {},
      );

      const sortedVenues = Object.entries(venueStats)
        .map(([venue, count]) => ({ venue, count: Number(count) }))
        .sort((a, b) => b.count - a.count);

      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedVenues = sortedVenues.slice(start, end);

      const total = sortedVenues.length;
      const totalPages = Math.ceil(total / limit);

      res.json({
        venues: paginatedVenues,
        pagination: {
          current: page,
          total: totalPages,
          hasMore: page < totalPages,
        },
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  router.get("/api/setlists/:showId", async (req, res) => {
    try {
      const { showId } = req.params;
      const setlistData = await fetchPhishData(`/setlists/showid/${showId}`);

      if (Array.isArray(setlistData) && setlistData.length > 0) {
        const setGroups = setlistData.reduce((acc: any, song: any) => {
          if (!acc[song.set]) {
            acc[song.set] = [];
          }
          acc[song.set].push({
            name: song.song,
            transition: song.trans_mark,
            position: song.position,
            jamchart: song.isjamchart ? song.jamchart_description : null,
          });
          return acc;
        }, {});

        const formatSet = (songs: any[]) => {
          return songs
            .sort((a, b) => a.position - b.position)
            .map((song) => song.name + song.transition)
            .join(" ")
            .trim();
        };

        let setlistText = "";
        if (setGroups["1"]) {
          setlistText += "Set 1: " + formatSet(setGroups["1"]) + "\n\n";
        }
        if (setGroups["2"]) {
          setlistText += "Set 2: " + formatSet(setGroups["2"]) + "\n\n";
        }
        if (setGroups["e"]) {
          setlistText += "Encore: " + formatSet(setGroups["e"]) + "\n\n";
        }

        const firstSong = setlistData[0];
        res.json({
          showdate: firstSong.showdate,
          venue: firstSong.venue,
          location: `${firstSong.city}, ${firstSong.state}`,
          setlistdata: setlistText,
          setlistnotes: firstSong.setlistnotes?.replace(/<\/?[^>]+(>|$)/g, "") || "",
        });
      } else {
        res.status(404).json({ message: "Setlist not found" });
      }
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  router.get("/api/runs/stats", async (_req, res) => {
    try {
      const shows = await fetchPhishData("/attendance/username/koolyp");

      const uniqueVenues = new Set(shows.map((show: any) => show.venueid)).size;
      const totalShows = shows.length;

      res.json({
        totalShows,
        uniqueVenues,
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  router.get("/api/songs/stats", async (_req, res) => {
    try {
      const shows = await fetchPhishData("/attendance/username/koolyp");
      const songCounts = new Map<string, number>();

      for (const show of shows) {
        const setlist = await fetchPhishData(`/setlists/showid/${show.showid}`);
        if (Array.isArray(setlist)) {
          setlist.forEach((entry: any) => {
            const songName = entry.song;
            if (songName) {
              songCounts.set(songName, (songCounts.get(songName) || 0) + 1);
            }
          });
        }
      }

      const songStats = Array.from(songCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      res.json(songStats);
    } catch (error) {
      console.error("Error fetching song stats:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  router.get("/api/setlist/occurrences/:songName", async (req, res) => {
    try {
      const { songName } = req.params;
      const shows = await fetchPhishData("/attendance/username/koolyp");
      const songOccurrences = [];

      for (const show of shows) {
        const setlist = await fetchPhishData(`/setlists/showid/${show.showid}`);
        if (Array.isArray(setlist)) {
          const songInSetlist = setlist.find(
            (entry: any) => entry.song === songName,
          );
          if (songInSetlist) {
            songOccurrences.push({
              date: show.showdate,
              venue: show.venue,
              setlist: `Set ${songInSetlist.set}: ${songInSetlist.song}${songInSetlist.trans_mark || ""}`,
              url: formatSongUrl(songName),
            });
          }
        }
      }

      res.json(songOccurrences);
    } catch (error) {
      console.error("Error fetching song setlist:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  router.get("/api/shows/on-date", async (req, res) => {
    try {
      const month = parseInt(req.query.month as string);
      const day = parseInt(req.query.day as string);

      if (isNaN(month) || isNaN(day)) {
        return res.status(400).json({ message: "Invalid month or day parameters" });
      }

      const showsFilePath = path.join(process.cwd(), 'attached_assets', 'allshows.json');
      const showsData = JSON.parse(fs.readFileSync(showsFilePath, 'utf-8')).data;

      const showsOnDate = showsData.filter((show: any) => {
        const showDate = new Date(show.showdate);
        return (
          showDate.getMonth() + 1 === month && 
          showDate.getDate() === day
        );
      });

      // Ensure we're using the correct date by setting hours to noon to avoid timezone issues
const targetDate = new Date(Date.UTC(2025, month - 1, day, 12));
const showsOnDate = shows.filter((show: any) => {
  const showDate = new Date(show.showdate);
  return showDate.getUTCMonth() === targetDate.getUTCMonth() && 
         showDate.getUTCDate() === targetDate.getUTCDate();
});

const sortedShows = showsOnDate.sort(
  (a: any, b: any) =>
    new Date(b.showdate).getTime() - new Date(a.showdate).getTime()
);

      const formattedShows = sortedShows.map((show: any) => ({
        showid: show.showid,
        showdate: show.showdate,
        venue: show.venue,
        city: show.city,
        state: show.state,
        country: show.country,
        notes: show.setlist_notes,
      }));

      res.json(formattedShows);
    } catch (error) {
      console.error("Error fetching shows by date:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  router.get("/api/venues/:venue/shows", async (req, res) => {
    try {
      const { venue } = req.params;
      const shows = await fetchPhishData("/attendance/username/koolyp");

      const venueShows = shows
        .filter((show: any) => show.venue === venue)
        .map((show: any) => ({
          showid: show.showid,
          showdate: show.showdate,
          venue: show.venue,
          city: show.city,
          state: show.state,
          country: show.country,
          notes: show.notes,
        }))
        .sort((a: any, b: any) => 
          new Date(b.showdate).getTime() - new Date(a.showdate).getTime()
        );

      res.json(venueShows);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
}

function formatSongUrl(songName: string): string {
  return `https://phish.net/song/${songName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`;
}