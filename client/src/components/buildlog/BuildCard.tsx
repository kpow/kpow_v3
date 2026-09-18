import { Link } from "wouter";
import type { Build } from "@/lib/buildlog";
import { shortDateNoYear } from "@/lib/buildlog";
import { StatusPill } from "./StatusPill";

export function BuildCard({ build, current }: { build: Build; current?: boolean }) {
  return (
    <Link href={`/builds/${build.slug}`} className={`card${current ? " current" : ""}`}>
      {build.hero && <img className="card-thumb" src={build.hero} alt={build.title} loading="lazy" />}
      <div className="card-inner">
        <div className="card-top">
          <span className="card-title">{build.title}</span>
          {current ? (
            <span className="card-here">you are here</span>
          ) : (
            <StatusPill status={build.status} mini />
          )}
        </div>
        <p className="card-sum">{build.summary}</p>
        <div className="card-foot">
          <span className="k">
            {build.kind} · <span className="entries">{build.stats.entries} entries</span>
          </span>
          <span>{build.lastEntry ? shortDateNoYear(build.lastEntry) : ""}</span>
        </div>
      </div>
    </Link>
  );
}
