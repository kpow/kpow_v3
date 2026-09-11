// Local harness for the vizSpot relay ONLY: no auth, no Vite, no other routes or jobs.
// It still uses DATABASE_URL, so it creates/uses the vizspot_pairings table there.
//   npx tsx --env-file=.env scripts/vizspot-relay-dev.ts
//   node scripts/vizspot-fake.mjs contract http://localhost:5055
import express, { Router } from "express";
import { registerVizspotRoutes } from "../server/routes/vizspot-routes";

const app = express();
app.use(express.json());
const router = Router();
registerVizspotRoutes(router);
app.use(router);
const port = Number(process.env.VIZSPOT_RELAY_PORT || 5055);
app.listen(port, () => console.log(`[vizspot-relay-dev] listening on http://localhost:${port}`));
