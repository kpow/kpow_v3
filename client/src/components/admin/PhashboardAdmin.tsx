import { useEffect, useState } from "react";

// /admin/phashboard: when each part of the Phashboard data was built, and a
// button that rebuilds it now (phish.net + phish.in + phantasyfish.net).

interface Status {
  parts: Record<string, string | null>;
  building: boolean;
  lastError: { at: string; message: string } | null;
  error?: string;
}

const ago = (iso: string | null) => {
  if (!iso) return "never";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  return m < 60 ? `${m} min ago` : m < 2880 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`;
};

export function PhashboardAdmin() {
  const [s, setS] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = () => fetch("/api/admin/phashboard").then((r) => r.json()).then(setS).catch(() => setMsg("Couldn't read the status."));
  useEffect(() => { load(); }, []);

  const refresh = async () => {
    setBusy(true);
    setMsg("Rebuilding. This takes about a minute the first time, seconds after that.");
    try {
      const r = await fetch("/api/admin/phashboard/refresh", { method: "POST" });
      const body: Status = await r.json();
      setS(body);
      setMsg(r.ok ? "Rebuilt." : `Rebuild failed: ${body.error}. The page keeps serving the last good copy.`);
    } catch {
      setMsg("Rebuild request failed. Check the server log.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-zinc-400">
        The public page at <a className="text-blue-400 underline" href="/phashboard">/phashboard</a> serves these cached parts and
        rebuilds them in the background when they're over 6 hours old. Rebuild after a show if you don't want to wait.
      </p>
      <div className="overflow-hidden rounded-lg border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr><th className="px-3 py-2">Part</th><th className="px-3 py-2">Built</th></tr>
          </thead>
          <tbody>
            {Object.entries(s?.parts ?? {}).map(([p, at]) => (
              <tr key={p} className="border-t border-zinc-800">
                <td className="px-3 py-2 font-mono text-zinc-200">{p}</td>
                <td className="px-3 py-2 text-zinc-400" title={at ?? ""}>{ago(at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {s?.lastError && <p className="text-sm text-red-400">Last failure {ago(s.lastError.at)}: {s.lastError.message}</p>}
      <div className="flex items-center gap-3">
        <button onClick={refresh} disabled={busy || s?.building}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
          {busy || s?.building ? "Rebuilding…" : "Rebuild now"}
        </button>
        {msg && <span className="text-sm text-zinc-400">{msg}</span>}
      </div>
    </div>
  );
}
