import { Router } from "express";
import { fetchPhishData } from "../utils/api-utils";
import path from "path";
import fs from "fs";

// What is left of the old Phashboard API: the home page's guess-the-setlist
// game reads /api/shows/all and /api/setlists/:showId. The Phashboard itself
// lives in server/lib/phashboard + routes/phashboard-routes.ts.
export function registerPhishRoutes(router: Router) {
  router.post("/api/admin/generate-shows-json", async (_req, res) => {
    try {
      console.log("Fetching all Phish shows...");
      const showsData = await fetchPhishData(
        "/shows/artist/phish?order_by=showdate",
      );
      console.log(
        `Received shows data. Length: ${Array.isArray(showsData) ? showsData.length : "Not an array"}`,
      );

      const assetsDir = path.join(process.cwd(), "attached_assets");
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }
      const showsFilePath = path.join(assetsDir, "allshows.json");
      fs.writeFileSync(showsFilePath, JSON.stringify(showsData, null, 2));
      res.json({
        message: "Shows data has been saved to JSON file",
        count: Array.isArray(showsData) ? showsData.length : 0,
        path: showsFilePath,
      });
    } catch (error) {
      console.error("Error generating shows JSON:", error);
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
        });
      }
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        details: error instanceof Error ? error.stack : undefined,
      });
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
          setlistnotes:
            firstSong.setlistnotes?.replace(/<\/?[^>]+(>|$)/g, "") || "",
        });
      } else {
        res.status(404).json({ message: "Setlist not found" });
      }
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  router.get("/api/shows/all", async (_req, res) => {
    try {
      const showsFilePath = path.join(
        process.cwd(),
        "client",
        "src",
        "data",
        "allshows.json",
      );
      const showsData = JSON.parse(
        fs.readFileSync(showsFilePath, "utf-8"),
      ).data;

      const formattedShows = showsData.map((show: any) => ({
        id: show.showid,
        date: show.showdate,
        venue: show.venue,
        city: show.city,
        state: show.state,
        country: show.country,
      }));

      res.json({ shows: formattedShows });
    } catch (error) {
      console.error("Error fetching all shows:", error);
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Failed to fetch shows",
        details: error instanceof Error ? error.stack : undefined,
      });
    }
  });
}
