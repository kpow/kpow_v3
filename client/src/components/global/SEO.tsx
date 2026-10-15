import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";
import { fullTitle, headTags, metaForPath, type PageMeta } from "@/lib/page-meta";

/**
 * The page's title and share tags. Every page renders exactly one.
 * With no `meta`, it uses the fixed entry for the current path in lib/page-meta.ts;
 * pages with data (a build, k-shows, phashboard) pass the helper's result.
 * The server writes the same tags into index.html for crawlers (server/page-meta.ts).
 */
export function SEO({ meta }: { meta?: PageMeta }) {
  const [path] = useLocation();
  const m = meta ?? metaForPath(path);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <Helmet>
      <title>{fullTitle(m)}</title>
      {headTags(m, path, origin).map(({ tag, attrs }) =>
        tag === "link" ? <link key={attrs.rel} {...attrs} /> : <meta key={attrs.name ?? attrs.property} {...attrs} />,
      )}
    </Helmet>
  );
}
