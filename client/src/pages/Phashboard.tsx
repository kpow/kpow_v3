import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { SEO } from "@/components/global/SEO";
import { phashboardMeta } from "@/lib/page-meta";
import { useCore } from "@/components/phashboard/data";
import { TABS, type Nav, type Tab } from "@/components/phashboard/nav";
import { Failed, Loading } from "@/components/phashboard/parts";
import { Overview } from "@/components/phashboard/Overview";
import { PhantasyTab } from "@/components/phashboard/PhantasyTab";
import { SongsTab } from "@/components/phashboard/SongsTab";
import { ShowsTab } from "@/components/phashboard/ShowsTab";
import { OnThisDayTab, VenuesTab } from "@/components/phashboard/PlacesTabs";
import "@/components/phashboard/phashboard.css";

// /phashboard and /phashboard/:tab. Data: server/lib/phashboard (phish.net
// attendance + phish.in setlists + phantasyfish.net games), cached server-side.

export default function Phashboard() {
  const params = useParams<{ tab?: string }>();
  const [, setLocation] = useLocation();
  const tab: Tab = (TABS.find((t) => t.id === params.tab)?.id ?? "overview") as Tab;
  const core = useCore();
  const [show, setShow] = useState<string | null>(null);
  const [game, setGame] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const nav: Nav = useMemo(() => ({
    go: (t, sel) => {
      if (sel?.show) setShow(sel.show);
      if (sel?.game) setGame(sel.game);
      if (sel?.query != null) setQuery(sel.query);
      setLocation(t === "overview" ? "/phashboard" : `/phashboard/${t}`);
      window.scrollTo({ top: 0 });
    },
    show, game, query, setShow, setGame, setQuery,
  }), [show, game, query, setLocation]);

  const meta = phashboardMeta(tab, core.data?.summary, core.data?.pf_summary);

  return (
    <div className="phashboard">
      <SEO meta={meta} />
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 36 }}>phashboard</h1>
        <span className="eb">koolyp on phish.net · kpow on phantasyfish{core.data ? ` · updated ${new Date(core.data.built_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}` : ""}</span>
      </div>
      <nav className="pb-tabs" aria-label="Sections">
        {TABS.map((t) => (
          <Link key={t.id} href={t.id === "overview" ? "/phashboard" : `/phashboard/${t.id}`} className={t.color} aria-selected={tab === t.id}>{t.label}</Link>
        ))}
      </nav>
      {core.isLoading ? <Loading what="tuning up" /> : core.error || !core.data ? <Failed error={core.error} /> : (
        <>
          {tab === "overview" && <Overview core={core.data} nav={nav} />}
          {tab === "phantasy" && <PhantasyTab core={core.data} nav={nav} />}
          {tab === "songs" && <SongsTab core={core.data} nav={nav} />}
          {tab === "shows" && <ShowsTab core={core.data} nav={nav} />}
          {tab === "venues" && <VenuesTab core={core.data} nav={nav} />}
          {tab === "onthisday" && <OnThisDayTab core={core.data} nav={nav} />}
        </>
      )}
    </div>
  );
}
