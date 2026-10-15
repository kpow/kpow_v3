#!/usr/bin/env node
// check-page-meta.mjs — fetch every page the way a link-preview crawler does
// (no JavaScript) and check its share tags.
//
//   node scripts/check-page-meta.mjs                 # http://localhost:5000
//   node scripts/check-page-meta.mjs https://kpow.xyz
//   node scripts/check-page-meta.mjs <base> --table  # also print a markdown table
//
// Per route: status, <title>, description, og:* and twitter:* present, og:image
// loads as an image, and no two indexable pages share a title. Exits 1 on a problem.

const args = process.argv.slice(2);
const base = (args.find((a) => !a.startsWith("--")) || "http://localhost:5000").replace(/\/$/, "");
const table = args.includes("--table");

// every route in client/src/App.tsx, with real values for the dynamic ones
const ROUTES = [
  ["/", 200], ["/about", 200],
  ["/phashboard", 200], ["/phashboard/phantasy", 200], ["/phashboard/songs", 200], ["/phashboard/shows", 200],
  ["/phashboard/venues", 200], ["/phashboard/onthisday", 200],
  ["/books", 200], ["/books/page/2", 200], ["/starred-articles", 200], ["/starred-articles/page/2", 200],
  ["/videos", 200], ["/videos/page/2", 200], ["/pmonk", 200], ["/battle", 200],
  ["/donut-tour", 200], ["/donut-tour/portland/or", 200], ["/itunez", 200], ["/led", 200], ["/shows", 200],
  ["/builds", 200], ["/builds/recently", 200], ["/builds/vizbot", 200], ["/builds/8x8", 200], ["/builds/radar", 200],
  ["/builds/no-such-build", 404],
  ["/vizspot/guide", 200], ["/vizspot/controls", 200],
  ["/vizbot", 200], ["/vizbot/guide", 200], ["/vizbot/touch", 200], ["/vizbot/web", 200], ["/vizbot/releases", 200],
  ["/vizmac", 200], ["/vizmac/guide", 200], ["/vizmac/controller", 200],
  ["/auth", 200], ["/admin", 200], ["/admin/shows", 200], ["/no-such-page", 404],
];
// pages that deliberately go out with only a name and title
const NO_DESCRIPTION = new Set(["/pmonk"]);
const REQUIRED = ["og:title", "og:image", "og:url", "og:type", "og:site_name", "twitter:card", "twitter:image"];

const attr = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
const unesc = (s) => s?.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

function parse(html) {
  const head = html.split("</head>")[0];
  const tags = {};
  for (const m of head.matchAll(/<meta\b[^>]*>/g)) {
    const key = attr(m[0], "property") || attr(m[0], "name");
    if (key) tags[key] = unesc(attr(m[0], "content"));
  }
  const canonical = head.match(/<link\b[^>]*rel="canonical"[^>]*>/)?.[0];
  return { title: unesc(head.match(/<title>([^<]*)<\/title>/)?.[1]), tags, canonical: canonical && attr(canonical, "href"), titles: (head.match(/<title>/g) || []).length };
}

const imageChecks = new Map();
async function checkImage(url) {
  if (!imageChecks.has(url)) {
    imageChecks.set(url, fetch(url).then((r) => (r.ok && /^image\//.test(r.headers.get("content-type") || "") ? null : `og:image ${r.status} ${r.headers.get("content-type")}`)).catch((e) => `og:image ${e.message}`));
  }
  return imageChecks.get(url);
}

const rows = [];
let problems = 0;
const seenTitles = new Map();
for (const [route, want] of ROUTES) {
  const res = await fetch(base + route, { headers: { "user-agent": "facebookexternalhit/1.1" } });
  const html = await res.text();
  const { title, tags, canonical, titles } = parse(html);
  const issues = [];
  if (res.status !== want) issues.push(`status ${res.status}, want ${want}`);
  if (titles !== 1) issues.push(`${titles} <title> tags`);
  for (const k of REQUIRED) if (!tags[k]) issues.push(`no ${k}`);
  if (NO_DESCRIPTION.has(route)) {
    if (tags.description || tags["og:description"]) issues.push("has a description, wants none");
  } else if (!tags.description || !tags["og:description"]) issues.push("no description");
  const noindex = /noindex/.test(tags.robots || "");
  if (!noindex && !canonical) issues.push("no canonical");
  if (tags["og:image"]) {
    if (!/^https?:\/\//.test(tags["og:image"])) issues.push("og:image not absolute");
    const bad = await checkImage(tags["og:image"]);
    if (bad) issues.push(bad);
  }
  if (!noindex && want === 200) {
    if (seenTitles.has(title)) issues.push(`same title as ${seenTitles.get(title)}`);
    seenTitles.set(title, route);
  }
  problems += issues.length;
  rows.push({ route, status: res.status, title, description: tags.description, image: tags["og:image"], size: tags["og:image:width"] ? `${tags["og:image:width"]}×${tags["og:image:height"]}` : "", noindex, issues });
  console.log(`${issues.length ? "✗" : "✓"} ${route.padEnd(28)} ${String(res.status).padEnd(4)} ${title}${noindex ? "  [noindex]" : ""}${issues.length ? "\n    " + issues.join("\n    ") : ""}`);
}

if (table) {
  const cell = (s) => String(s ?? "").replace(/\|/g, "\\|");
  console.log("\n| route | title | description | image |\n|---|---|---|---|");
  for (const r of rows) {
    const img = r.image ? `\`${r.image.replace(base, "").replace("https://kfiles.atl1.cdn.digitaloceanspaces.com/showz", "cdn:showz")}\`${r.size ? ` ${r.size}` : ""}` : "";
    console.log(`| \`${r.route}\`${r.status !== 200 ? ` (${r.status})` : ""}${r.noindex ? " noindex" : ""} | ${cell(r.title)} | ${cell(r.description)} | ${img} |`);
  }
}

console.log(`\n${rows.length} routes, ${problems} problem${problems === 1 ? "" : "s"}`);
process.exit(problems ? 1 : 0);
