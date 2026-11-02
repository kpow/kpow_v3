#!/usr/bin/env node
// publish-tinyradar-firmware — copies one tinyradar release into the site.
//
//   node scripts/publish-tinyradar-firmware.mjs v1.2.0 [--notes "One line for the radar's page"]
//
// The radar repo (kpow/ESP32-Plane-Radar) is private, so its GitHub release can't
// be read by the radar or the site. This downloads the release's manifest.json and
// the OTA .bin it names (with your `gh` login), checks size and md5, and writes
// both to firmware/tinyradar/, replacing the previous release.
// Commit and ship it like any change: a push to main redeploys kpow.xyz, and every
// radar's page offers the update the next time someone opens it.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = "kpow/ESP32-Plane-Radar";
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "firmware", "tinyradar");

const args = process.argv.slice(2);
const tag = args.find((a) => !a.startsWith("--"));
const notesAt = args.indexOf("--notes");
const notes = notesAt >= 0 ? args[notesAt + 1] : undefined;
if (!tag || !/^v\d+\.\d+\.\d+$/.test(tag)) {
  console.error("usage: node scripts/publish-tinyradar-firmware.mjs vX.Y.Z [--notes \"…\"]");
  process.exit(1);
}

const tmp = mkdtempSync(join(tmpdir(), "tinyradar-fw-"));
const gh = (...a) => execFileSync("gh", a, { stdio: ["ignore", "inherit", "inherit"] });
try {
  gh("release", "download", tag, "-R", REPO, "-p", "manifest.json", "-D", tmp);
  const manifest = JSON.parse(readFileSync(join(tmp, "manifest.json"), "utf8"));
  // "s3-4mb" = the 4 MB S3FH4R2 (every radar from v1.1.0; the 8 MB "s3" build is retired).
  const build = manifest.builds?.["s3-4mb"];
  if (!build?.url || build.url.includes("/")) throw new Error('manifest.json has no plain builds["s3-4mb"].url');
  if (manifest.version !== tag.slice(1)) throw new Error(`manifest says ${manifest.version}, tag is ${tag}`);

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

  console.log(`\ntinyradar ${manifest.version} is in firmware/tinyradar/:`);
  console.log(`  manifest.json  notes: ${JSON.stringify(manifest.notes ?? "")}`);
  console.log(`  ${build.url}  ${bin.length} bytes  md5 ${md5}`);
  console.log("\nNext: commit it on a branch and open a PR. Merging to main redeploys kpow.xyz.");
} catch (e) {
  console.error(`\npublish failed: ${e.message}`);
  process.exitCode = 1;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
