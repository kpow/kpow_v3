// /builds — the wiki index: a tight grid of every build.

import { Link } from "wouter";
import { SEO } from "@/components/global/SEO";
import { useBuildLog } from "@/lib/buildlog";
import { BuildCard } from "@/components/buildlog/BuildCard";
import { BuildLogError, BuildLogLoading, BuildLogShell } from "@/components/buildlog/BuildLogShell";
import { Crumbs } from "@/components/buildlog/Crumbs";
import { SectionHead } from "@/components/buildlog/SectionHead";

export default function Builds() {
  const { data, isLoading, error } = useBuildLog();

  return (
    <BuildLogShell>
      <SEO
        title="build log — kpow"
        description="Every thing kpow is building: LED instruments, handheld consoles, robots, and the devlog behind them."
        keywords="build log, devlog, ESP32, LED, hardware, making"
      />
      <Crumbs />

      <header className="detail-head">
        <div className="dh-top">
          <h1 className="detail-title">Build Log</h1>
        </div>
        <p className="detail-summary">
          Everything on the bench, and the day-by-day record of getting it working.
        </p>
      </header>
      <div className="detail-body-card">
        <div className="links-row">
          <Link className="link-btn" href="/builds/recently">
            ◆ recently — all entries, newest first
          </Link>
          {data && (
            <span className="chip">
              {data.builds.length} builds · {data.recent.length} entries
            </span>
          )}
        </div>
      </div>

      {isLoading && <BuildLogLoading />}
      {error && <BuildLogError message={(error as Error).message} />}

      {data && (
        <>
          <SectionHead
            title="All builds"
            count={`${data.builds.length} project${data.builds.length === 1 ? "" : "s"}`}
          />
          <section className="index-grid">
            {data.builds.map((build) => (
              <BuildCard build={build} key={build.slug} />
            ))}
          </section>
        </>
      )}
    </BuildLogShell>
  );
}
