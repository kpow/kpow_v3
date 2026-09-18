// /builds/:slug — one build: title bar, hero, Project Info, WIP Pix, devlog.

import { useParams } from "wouter";
import { SEO } from "@/components/global/SEO";
import { shortDate, useBuildLog, type Build } from "@/lib/buildlog";
import { BuildCard } from "@/components/buildlog/BuildCard";
import { BuildLogError, BuildLogLoading, BuildLogShell } from "@/components/buildlog/BuildLogShell";
import { Crumbs } from "@/components/buildlog/Crumbs";
import { Filmstrip } from "@/components/buildlog/Filmstrip";
import { Markdown } from "@/components/buildlog/Markdown";
import { SectionHead } from "@/components/buildlog/SectionHead";
import { StatusPill } from "@/components/buildlog/StatusPill";
import { Timeline } from "@/components/buildlog/Timeline";
import { Zoomable } from "@/components/buildlog/Lightbox";

/** stats first, then whatever `facts` this build happens to carry, then the range. */
function StatStrip({ build }: { build: Build }) {
  const { stats, facts } = build;
  const cells: { num?: string; sub?: React.ReactNode; lab: string; accent?: boolean }[] = [
    { num: String(stats.entries), lab: "Entries", accent: true },
    { num: String(stats.photos), lab: "Photos" },
    { num: String(stats.daysActive), lab: "Days active" },
    ...Object.entries(facts || {}).map(([lab, num]) => ({
      num: String(num),
      lab,
      accent: true,
    })),
  ];

  if (stats.firstEntry && stats.lastEntry) {
    cells.push({
      sub: (
        <>
          {shortDate(stats.firstEntry).replace(/ '\d\d$/, "")} –
          <br />
          {shortDate(stats.lastEntry)}
        </>
      ),
      lab: "Range",
    });
  }

  return (
    <div className="stat-strip">
      {cells.map((cell) => (
        <div className={`stat${cell.accent ? " accent" : ""}`} key={cell.lab}>
          {cell.num !== undefined ? (
            <span className="num">{cell.num}</span>
          ) : (
            <span className="sub">{cell.sub}</span>
          )}
          <span className="lab">{cell.lab}</span>
        </div>
      ))}
    </div>
  );
}

export default function BuildDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = useBuildLog();

  if (isLoading) {
    return (
      <BuildLogShell>
        <BuildLogLoading />
      </BuildLogShell>
    );
  }
  if (error) {
    return (
      <BuildLogShell>
        <BuildLogError message={(error as Error).message} />
      </BuildLogShell>
    );
  }

  const build = data?.builds.find((b) => b.slug === slug);
  if (!build) {
    return (
      <BuildLogShell>
        <Crumbs here={slug} />
        <BuildLogError message={`No build called "${slug}".`} />
      </BuildLogShell>
    );
  }

  const heroCaption = build.picturesOverTime.find((p) => p.src === build.hero)?.caption || build.title;

  return (
    <BuildLogShell>
      <SEO
        title={`${build.title} — build log — kpow`}
        description={build.summary}
        image={build.hero || undefined}
        keywords={[...build.tags, ...build.stack].join(", ")}
      />
      <Crumbs here={build.title} />

      {/* title bar */}
      <header className="detail-head">
        <div className="dh-top">
          <h1 className="detail-title">{build.title}</h1>
          <StatusPill status={build.status} />
          <span className="kind-tag">{build.kind}</span>
        </div>
        <p className="detail-summary">{build.summary}</p>
      </header>

      {/* project info */}
      <div className="detail-body-card">
        <div className="meta-block">
          {!!build.stack.length && (
            <div className="chip-row">
              <span className="meta-label">Stack</span>
              {build.stack.map((item) => (
                <span className="chip" key={item}>
                  {item}
                </span>
              ))}
            </div>
          )}
          {!!build.tags.length && (
            <div className="chip-row">
              <span className="meta-label">Tags</span>
              {build.tags.map((tag) => (
                <span className="chip tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <StatStrip build={build} />

        <div className="links-row">
          {build.links.map((link) => (
            <a className="link-btn" href={link.url} target="_blank" rel="noopener noreferrer" key={link.url}>
              🔗 {link.label}
            </a>
          ))}
          {build.started && <span className="chip">started {build.started}</span>}
          {build.rung && <span className="chip">{build.rung}</span>}
        </div>
      </div>

      {/* hero */}
      {build.hero && (
        <figure className="hero-band">
          <Zoomable src={build.hero} caption={heroCaption} />
          <figcaption className="hero-cap">
            <span className="dotmk">◆</span> {heroCaption}
          </figcaption>
        </figure>
      )}

      {/* evergreen body */}
      {build.body && <Markdown className="build-body">{build.body}</Markdown>}

      {/* WIP pix */}
      <Filmstrip shots={build.picturesOverTime} />

      {/* devlog */}
      {!!build.entries.length && (
        <>
          <SectionHead title="Devlog" count={`${build.entries.length} entries`} />
          <Timeline entries={build.entries} />
        </>
      )}

      {/* the rest of the wiki */}
      {data && data.builds.length > 1 && (
        <>
          <SectionHead title="All builds" count={`${data.builds.length} projects`} />
          <section className="index-grid">
            {data.builds.map((other) => (
              <BuildCard build={other} current={other.slug === build.slug} key={other.slug} />
            ))}
          </section>
        </>
      )}
    </BuildLogShell>
  );
}
