// /builds/recently — every devlog entry across every build, newest first, with
// a chip per build to narrow it down.

import { useMemo, useState } from "react";
import { SEO } from "@/components/global/SEO";
import { useBuildLog } from "@/lib/buildlog";
import { BuildLogError, BuildLogLoading, BuildLogShell } from "@/components/buildlog/BuildLogShell";
import { Crumbs } from "@/components/buildlog/Crumbs";
import { Ledger } from "@/components/buildlog/Ledger";
import { SectionHead } from "@/components/buildlog/SectionHead";

export default function Recently() {
  const { data, isLoading, error } = useBuildLog();
  const [filter, setFilter] = useState("all");

  // one chip per build that has entries, busiest first
  const chips = useMemo(() => {
    const counts = new Map<string, { title: string; n: number }>();
    for (const e of data?.recent ?? []) {
      const c = counts.get(e.build) ?? { title: e.buildTitle, n: 0 };
      c.n++;
      counts.set(e.build, c);
    }
    return Array.from(counts).sort((a, b) => b[1].n - a[1].n);
  }, [data]);

  const entries = useMemo(
    () => (filter === "all" ? data?.recent ?? [] : (data?.recent ?? []).filter((e) => e.build === filter)),
    [data, filter],
  );

  return (
    <BuildLogShell>
      <SEO />
      <Crumbs here="recently" />

      <header className="detail-head">
        <div className="dh-top">
          <h1 className="detail-title">Recently</h1>
        </div>
        <p className="detail-summary">Every devlog entry across every build, newest first.</p>
      </header>
      <div className="detail-body-card">
        <div className="links-row">
          {data && (
            <span className="chip">
              {data.recent.length} entries across {data.builds.length} builds
            </span>
          )}
          {data?.recent[0] && <span className="chip">latest {data.recent[0].date}</span>}
        </div>
      </div>

      {isLoading && <BuildLogLoading />}
      {error && <BuildLogError message={(error as Error).message} />}

      {data && (
        <>
          <SectionHead title="Devlog" count={`${entries.length} entries`} />
          <div className="filters" role="group" aria-label="Filter by build">
            <button
              type="button"
              className={filter === "all" ? "on" : undefined}
              aria-pressed={filter === "all"}
              onClick={() => setFilter("all")}
            >
              all<span className="n">{data.recent.length}</span>
            </button>
            {chips.map(([slug, c]) => (
              <button
                type="button"
                key={slug}
                className={filter === slug ? "on" : undefined}
                aria-pressed={filter === slug}
                onClick={() => setFilter(slug)}
              >
                {c.title}
                <span className="n">{c.n}</span>
              </button>
            ))}
          </div>
          <Ledger entries={entries} showBuild={filter === "all"} />
        </>
      )}
    </BuildLogShell>
  );
}
