// /builds/recently — every devlog entry across every build, newest first.

import { SEO } from "@/components/global/SEO";
import { useBuildLog } from "@/lib/buildlog";
import { BuildLogError, BuildLogLoading, BuildLogShell } from "@/components/buildlog/BuildLogShell";
import { Crumbs } from "@/components/buildlog/Crumbs";
import { SectionHead } from "@/components/buildlog/SectionHead";
import { Timeline } from "@/components/buildlog/Timeline";

export default function Recently() {
  const { data, isLoading, error } = useBuildLog();

  return (
    <BuildLogShell>
      <SEO
        title="recently — build log — kpow"
        description="The latest devlog entries across every kpow build, newest first."
        keywords="devlog, build log, recently, ESP32, LED"
      />
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
          <SectionHead title="Devlog" count={`${data.recent.length} entries`} />
          <Timeline entries={data.recent} />
        </>
      )}
    </BuildLogShell>
  );
}
