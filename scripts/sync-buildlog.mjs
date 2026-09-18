#!/usr/bin/env node
// sync-buildlog.mjs — pull the build log content repo and stage it for the client.
//
//   node scripts/sync-buildlog.mjs
//
// No database. Content lives in the kpow-buildlog repo as markdown + images; this
// runs its generator and drops the results where Vite can serve them:
//
//   client/public/builds.json             <- the rendered data
//   client/public/buildlog/<slug>/media/  <- the photos (URLs in builds.json point here)
//
// Source resolution, in order:
//   1. BUILDLOG_PATH   — an existing checkout (local dev against a working copy)
//   2. a sibling checkout next to this repo, if one happens to be there
//   3. a shallow clone of BUILDLOG_URL into .buildlog-cache (what CI/production does)
//
// Because production always clones fresh, a push to kpow-buildlog republishes the
// site on the next deploy — no submodule pointer to bump, no admin panel.

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "client", "public");
const CACHE = join(ROOT, ".buildlog-cache");

const URL_ = process.env.BUILDLOG_URL || "https://github.com/kpow/kpow-buildlog.git";
const SIBLING = resolve(ROOT, "..", "kpow-music-makes-content", "kpow-buildlog");

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { stdio: "inherit", ...opts });
}

function resolveSource() {
  if (process.env.BUILDLOG_PATH) {
    const p = resolve(process.env.BUILDLOG_PATH);
    if (!existsSync(join(p, "builds"))) {
      throw new Error(`BUILDLOG_PATH has no builds/ directory: ${p}`);
    }
    return { path: p, how: "BUILDLOG_PATH" };
  }
  if (existsSync(join(SIBLING, "builds"))) {
    return { path: SIBLING, how: "local checkout" };
  }
  rmSync(CACHE, { recursive: true, force: true });
  run("git", ["clone", "--depth", "1", URL_, CACHE]);
  return { path: CACHE, how: `shallow clone of ${URL_}` };
}

const src = resolveSource();
console.log(`[buildlog] content from ${src.path} (${src.how})`);

// 1. markdown -> builds.json, straight into the client's public dir.
const outJson = join(PUBLIC, "builds.json");
mkdirSync(PUBLIC, { recursive: true });
run("node", [join(src.path, "scripts", "build-buildlog.mjs"), join(src.path, "builds"), outJson]);

// 2. photos -> /buildlog/<slug>/media/, matching the URLs the generator wrote.
const mediaRoot = join(PUBLIC, "buildlog");
rmSync(mediaRoot, { recursive: true, force: true });

let copied = 0;
const buildsDir = join(src.path, "builds");
for (const slug of readdirSync(buildsDir)) {
  const from = join(buildsDir, slug, "media");
  if (!existsSync(from) || !statSync(from).isDirectory()) continue;
  const to = join(mediaRoot, slug, "media");
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
  copied += readdirSync(from).length;
}

console.log(`[buildlog] wrote ${outJson} and ${copied} media files under ${mediaRoot}`);
