// Three build cards for the home page, pulled from the same builds.json the
// /builds section renders. Deliberately echoes the build log's look — amethyst,
// mono labels, stat chips — without importing its scoped stylesheet.

import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useBuildLog, shortDateNoYear } from "@/lib/buildlog";
import type { Build } from "@/lib/buildlog";

const FEATURED = ["8x8", "noodle", "vizspot"];

const STATUS_COLOR: Record<string, string> = {
  active: "bg-emerald-500",
  shipped: "bg-violet-500",
  live: "bg-sky-500",
  shelved: "bg-gray-400",
};

function BuildMiniCard({ build }: { build: Build }) {
  // Two stat chips at most: "22 effects", "64x64 panel".
  const chips = Object.entries(build.facts || {}).slice(0, 2);

  return (
    <Link
      href={`/builds/${build.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-violet-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-[0_14px_30px_-18px_rgba(124,58,237,.65)]"
    >
      <div className="relative">
        {build.hero ? (
          <img
            src={build.hero}
            alt={build.title}
            loading="lazy"
            className="h-32 w-full object-cover"
          />
        ) : (
          <div className="h-32 w-full bg-violet-50" />
        )}
        <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded bg-black/70 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-white backdrop-blur-sm">
          <span
            className={`h-1.5 w-1.5 rounded-full ${STATUS_COLOR[build.status] ?? "bg-gray-400"}`}
          />
          {build.status}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="font-slackey text-base leading-tight text-gray-900">
          {build.title}
        </h3>
        <p className="line-clamp-2 text-sm leading-snug text-gray-600">
          {build.summary}
        </p>

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {chips.map(([key, value]) => (
              <span
                key={key}
                className="rounded border border-violet-200 bg-violet-50 px-1.5 py-0.5 font-mono text-[10px] text-violet-800"
              >
                {value} {key}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-2 font-mono text-[11px] text-gray-500">
          <span>
            <span className="text-violet-700">◆</span> {build.stats.entries} entries
          </span>
          <span>{build.lastEntry ? shortDateNoYear(build.lastEntry) : ""}</span>
        </div>
      </div>
    </Link>
  );
}

export function BuildsSection() {
  const { data, isLoading } = useBuildLog();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {FEATURED.map((slug) => (
          <Skeleton key={slug} className="h-[260px] w-full rounded-lg" />
        ))}
      </div>
    );
  }

  // Keep the order asked for, and skip anything that isn't in builds.json yet.
  const builds = FEATURED.map((slug) =>
    data?.builds.find((b) => b.slug === slug),
  ).filter((b): b is Build => Boolean(b));

  if (builds.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      {builds.map((build) => (
        <BuildMiniCard key={build.slug} build={build} />
      ))}
    </div>
  );
}
