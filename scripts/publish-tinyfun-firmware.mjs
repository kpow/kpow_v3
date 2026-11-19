#!/usr/bin/env node
// publish-tinyfun-firmware — copies one tinyfun release into the site.
//
//   node scripts/publish-tinyfun-firmware.mjs tinyfun-v1.2.3 [--notes "One line for the update page"]
//
// The kFun repo (kpow/kfun) is private, so its GitHub release can't be read by
// the site or a phone. This downloads the release's manifest.json and the .bin
// it names (with your `gh` login), checks size and md5, and writes both to
// firmware/tinyfun/, replacing the previous release.
// Commit and ship it like any change: a push to main redeploys kpow.xyz, and
// kpow.xyz/tinyfun/update offers the new file at once.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = "kpow/kfun";
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "firmware", "tinyfun");

const args = process.argv.slice(2);
const notesAt = args.indexOf("--notes");
const notes = notesAt >= 0 ? args[notesAt + 1] : undefined;
const tag = args.find((a, i) => !a.startsWith("--") && i !== notesAt + 1);
if (!tag || !/^tinyfun-v\d+\.\d+\.\d+$/.test(tag)) {
  console.error('usage: node scripts/publish-tinyfun-firmware.mjs tinyfun-vX.Y.Z [--notes "…"]');
  process.exit(1);
}
const version = tag.slice("tinyfun-v".length);

const tmp = mkdtempSync(join(tmpdir(), "tinyfun-fw-"));
const gh = (...a) => execFileSync("gh", a, { stdio: ["ignore", "inherit", "inherit"] });
try {
  gh("release", "download", tag, "-R", REPO, "-p", "manifest.json", "-D", tmp);
  const manifest = JSON.parse(readFileSync(join(tmp, "manifest.json"), "utf8"));
  // "s3" = the tinyfun board (ESP32-S3, 4 MB, two OTA slots).
  const build = manifest.builds?.s3;
  if (!build?.url || build.url.includes("/")) throw new Error("manifest.json has no plain builds.s3.url");
  if (manifest.version !== version) throw new Error(`manifest says ${manifest.version}, tag is ${tag}`);

  gh("release", "download", tag, "-R", REPO, "-p", build.url, "-D", tmp);
  const bin = readFileSync(join(tmp, build.url));
  const md5 = createHash("md5").update(bin).digest("hex");
  if (bin.length !== build.size) throw new Error(`${build.url}: ${bin.length} bytes, manifest says ${build.size}`);
  if (md5 !== build.md5) throw new Error(`${build.url}: md5 ${md5}, manifest says ${build.md5}`);
  if (bin[0] !== 0xe9) throw new Error(`${build.url} doesn't start like an ESP32 app image`);

  if (notes !== undefined) manifest.notes = notes;
  for (const f of readdirSync(OUT)) if (f.endsWith(".bin") || f === "manifest.json") rmSync(join(OUT, f));
  copyFileSync(join(tmp, build.url), join(OUT, build.url));
  writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  console.log(`\ntinyfun ${manifest.version} is in firmware/tinyfun/:`);
  console.log(`  manifest.json  notes: ${JSON.stringify(manifest.notes ?? "")}`);
  console.log(`  ${build.url}  ${bin.length} bytes  md5 ${md5}`);
  console.log("\nNext: commit it on a branch and open a PR. Merging to main redeploys kpow.xyz.");
} catch (e) {
  console.error(`\npublish failed: ${e.message}`);
  process.exitCode = 1;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
