// Builds dist/ for GitHub Pages.
// Security rule: only boxes that are already open are written to dist/.
// A future box is never sent to the browser, so there is nothing to find.
//
// Content source (in order): env CONTENT_JSON (GitHub secret), then
// content/private.json (local, gitignored), then content/example.json.
//
// Usage: node scripts/build.mjs [ISO date-time, for testing]

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from "node:fs";

const config = JSON.parse(readFileSync("config.json", "utf8"));
const now = process.argv[2] ? new Date(process.argv[2]) : new Date();

// Paris date parts, computed from the clock (never from the visitor's device).
const parts = Object.fromEntries(
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now).map((p) => [p.type, p.value])
);
const year = Number(parts.year), month = Number(parts.month), day = Number(parts.day);

function openCount() {
  if (config.mode === "accelerated") {
    // Demo mode: one new box every `minutes_per_box` minutes since `start`.
    const elapsed = (now - new Date(config.accelerated.start)) / 60000;
    if (elapsed < 0) return 0;
    return Math.min(24, 1 + Math.floor(elapsed / config.accelerated.minutes_per_box));
  }
  if (year < config.year || (year === config.year && month < 12)) return 0;
  if (year > config.year || (year === config.year && day > 24)) return 24;
  return month === 12 ? Math.min(24, day) : 0;
}

let raw;
if (process.env.CONTENT_JSON) raw = process.env.CONTENT_JSON;
else if (existsSync("content/private.json")) raw = readFileSync("content/private.json", "utf8");
else raw = readFileSync("content/example.json", "utf8");

const content = JSON.parse(raw);
if (!Array.isArray(content.days) || content.days.length !== 24) {
  throw new Error(`Expected 24 days, got ${content.days?.length}`);
}

const open = openCount();
rmSync("dist", { recursive: true, force: true });
mkdirSync("dist/days", { recursive: true });
cpSync("site", "dist", { recursive: true });

for (const d of content.days.slice(0, open)) {
  writeFileSync(`dist/days/${String(d.day).padStart(2, "0")}.json`, JSON.stringify(d));
}
// The manifest carries only titles of the theme, and how many boxes are open.
writeFileSync(
  "dist/manifest.json",
  JSON.stringify({ title: content.title, subtitle: content.subtitle, open })
);
console.log(`Paris date ${parts.year}-${parts.month}-${parts.day}: ${open} box(es) open (mode: ${config.mode})`);
