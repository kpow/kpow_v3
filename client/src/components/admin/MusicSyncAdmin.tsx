import { useEffect, useState } from "react";

// /admin/music: the Spotify connection and the 15-minute play sync
// (server/lib/music). Plays land in the same table /itunez reads.

interface SourceState {
  last_run: string | null;
  last_ok: string | null;
  last_error: string | null;
  last_counts: { inserted: number; paired: number; known: number } | null;
}

interface Status {
  spotify: { configured: boolean; connected_at: string | null; state: SourceState | null };
  lastfm: { user: string; state: SourceState | null };
  syncing: boolean;
  last30: { source: string; via: string; n: number; latest: string }[];
  error?: string;
}

const ago = (iso: string | null | undefined) => {
  if (!iso) return "never";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  return m < 60 ? `${m} min ago` : m < 2880 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`;
};

function Row({ name, state, note }: { name: string; state: SourceState | null; note?: string }) {
  const c = state?.last_counts;
  return (
    <tr className="border-t border-zinc-800">
      <td className="px-3 py-2 font-semibold text-zinc-200">{name}</td>
      <td className="px-3 py-2 text-zinc-400" title={state?.last_ok ?? ""}>{note ?? ago(state?.last_ok)}</td>
      <td className="px-3 py-2 text-zinc-400">{c ? `${c.inserted} new · ${c.paired} paired` : "–"}</td>
      <td className="px-3 py-2 text-red-400">{state?.last_error ?? ""}</td>
    </tr>
  );
}

export function MusicSyncAdmin() {
  const [s, setS] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("spotify") === "connected") return "Spotify connected. First sync is running.";
    if (q.get("spotify") === "error") return `Spotify connect failed: ${q.get("msg")}`;
    return "";
  });

  const load = () => fetch("/api/admin/music").then((r) => r.json()).then(setS).catch(() => setMsg("Couldn't read the status."));
  useEffect(() => { load(); }, []);

  const post = async (url: string, doing: string, done: string) => {
    setBusy(true);
    setMsg(doing);
    try {
      const r = await fetch(url, { method: "POST" });
      const body: Status = await r.json();
      if (r.ok) setS(body);
      setMsg(r.ok ? done : `Failed: ${body.error}`);
    } catch {
      setMsg("Request failed. Check the server log.");
    } finally {
      setBusy(false);
    }
  };

  const sp = s?.spotify;
  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-zinc-400">
        Every 15 minutes the server copies new Spotify plays and <span className="font-mono">{s?.lastfm.user ?? "krakap"}</span>'s
        Last.fm scrobbles into the plays behind <a className="text-blue-400 underline" href="/itunez">/itunez</a>. A scrobble
        Spotify also reports counts once, as Spotify; the rest count as Apple Music.
      </p>
      <div className="overflow-hidden rounded-lg border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr><th className="px-3 py-2">Source</th><th className="px-3 py-2">Last sync</th><th className="px-3 py-2">Last run</th><th className="px-3 py-2" /></tr>
          </thead>
          <tbody>
            <Row name="Spotify" state={sp?.state ?? null}
              note={!sp?.configured ? "SPOTIFY_CLIENT_ID / SECRET not set" : !sp.connected_at ? "not connected" : undefined} />
            <Row name="Last.fm" state={s?.lastfm.state ?? null} />
          </tbody>
        </table>
      </div>
      {!!s?.last30.length && (
        <p className="text-sm text-zinc-400">
          Last 30 days: {s.last30.map((r) => `${r.n} ${r.source} (${r.via})`).join(" · ")}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => post("/api/admin/music/sync", "Syncing…", "Synced.")} disabled={busy || s?.syncing}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
          {busy || s?.syncing ? "Syncing…" : "Sync now"}
        </button>
        {sp?.configured && !sp.connected_at && (
          <a href="/api/admin/spotify/connect" className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-500">
            Connect Spotify
          </a>
        )}
        {sp?.connected_at && (
          <button onClick={() => post("/api/admin/spotify/disconnect", "Disconnecting…", "Spotify disconnected.")} disabled={busy}
            className="rounded-md px-3 py-2 text-sm text-zinc-400 ring-1 ring-zinc-700 hover:bg-zinc-800 disabled:opacity-50">
            Disconnect Spotify
          </button>
        )}
        {msg && <span className="text-sm text-zinc-400">{msg}</span>}
      </div>
    </div>
  );
}
