import type { Router } from "express";
import { timingSafeEqual } from "crypto";

// vizbrain install links. vizbrain (the Mac-side brain for vizBot) is shared by
// invitation: each person gets a link with their own code and pastes one line
// in Terminal:
//
//   bash -c "$(curl -sSL https://kpow.xyz/vb/<code>)"
//
//   GET /vb/:code  ->  the installer script, for a code in VIZBRAIN_INVITES;
//                      404 and a one-line shell message for any other code
//
// VIZBRAIN_INVITES is a comma-separated list of codes. It is set on the server
// and never committed (this repo is public); removing a code ends that link.
// Every reply is a shell script, because whatever comes back gets run: a dead
// link has to say so in the Terminal, not hand bash an HTML page.
//
// The installer is vizbrain/install.sh from the vizpow repo, fetched and cached
// for 5 minutes (a stale copy is served if GitHub fails). The link is written
// into the script so `vizbrain update` can come back to it.

const INSTALLER_URL =
  process.env.VIZBRAIN_INSTALLER_URL ??
  "https://raw.githubusercontent.com/kpow/vizpow/main/vizbrain/install.sh";
const LINK_BASE = process.env.VIZBRAIN_LINK_BASE ?? "https://kpow.xyz";
const TTL_MS = 5 * 60 * 1000;
// Long enough that a code can't be guessed, and nothing that needs quoting in a shell.
const CODE_RE = /^[A-Za-z0-9_-]{16,64}$/;

const shellMessage = (text: string) => `#!/bin/sh\necho "${text}"\nexit 1\n`;
const DEAD_LINK = shellMessage("This vizbrain install link isn't active. Email Kevin for a new one.");
const UNAVAILABLE = shellMessage("The vizbrain installer can't be reached right now. Try again in a few minutes.");

function invited(code: string): boolean {
  if (!CODE_RE.test(code)) return false;
  const given = Buffer.from(code);
  return (process.env.VIZBRAIN_INVITES ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter((c) => CODE_RE.test(c))
    .some((c) => c.length === given.length && timingSafeEqual(Buffer.from(c), given));
}

let cache: { script: string; at: number } | null = null;
let inflight: Promise<string> | null = null;

async function fetchInstaller(): Promise<string> {
  const res = await fetch(INSTALLER_URL, {
    headers: { "User-Agent": "kpow.xyz-vizbrain" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`GitHub ${res.status} ${res.statusText}`);
  const script = await res.text();
  if (!script.startsWith("#!")) throw new Error("that isn't a shell script");
  return script;
}

export function registerVizbrainRoutes(router: Router) {
  router.get("/vb/:code", async (req, res) => {
    res.type("text/plain");
    res.setHeader("Cache-Control", "no-store");
    if (!invited(req.params.code)) {
      return res.status(404).send(DEAD_LINK);
    }
    if (!cache || Date.now() - cache.at >= TTL_MS) {
      try {
        inflight ??= fetchInstaller().finally(() => {
          inflight = null;
        });
        cache = { script: await inflight, at: Date.now() };
      } catch (error) {
        console.error("[vizbrain] installer fetch failed:", (error as Error).message);
        if (!cache) return res.status(503).send(UNAVAILABLE);
      }
    }
    // After the shebang line, so the script's own default ("") doesn't replace it.
    const [shebang, ...rest] = cache!.script.split("\n");
    const link = `VIZBRAIN_LINK="${LINK_BASE}/vb/${req.params.code}"`;
    res.send([shebang, link, ...rest].join("\n"));
  });
}
