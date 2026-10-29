// Keeps backend/shared/ in sync with the root shared/ directory.
//
// Why: Hostinger deploys only the `backend` directory, so the backend cannot
// import from ../shared at runtime. The root shared/ folder stays the single
// source of truth (the frontend imports it); backend/shared/ is a committed copy.
//
// Usage:
//   node scripts/sync-shared.mjs          copy root shared/*.mjs -> backend/shared/
//   node scripts/sync-shared.mjs --check  exit 1 if backend/shared/ is out of date
//
// If the root shared/ directory is not present (e.g. a backend-only deployment),
// the script does nothing and exits 0: the committed copies are used as-is.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(repoRoot, "shared");
const target = path.join(repoRoot, "backend", "shared");
const checkOnly = process.argv.includes("--check");

if (!existsSync(source)) {
  console.log("[sync-shared] root shared/ not found; using the committed backend/shared/ copies.");
  process.exit(0);
}

const files = readdirSync(source).filter((name) => name.endsWith(".mjs")).sort();
const stale = [];

if (!checkOnly) mkdirSync(target, { recursive: true });

for (const name of files) {
  const from = path.join(source, name);
  const to = path.join(target, name);
  const same = existsSync(to) && readFileSync(from).equals(readFileSync(to));
  if (same) continue;
  stale.push(name);
  if (!checkOnly) copyFileSync(from, to);
}

if (checkOnly) {
  if (stale.length) {
    console.error(`[sync-shared] backend/shared is out of date: ${stale.join(", ")}. Run "npm run sync:shared".`);
    process.exit(1);
  }
  console.log(`[sync-shared] backend/shared is up to date (${files.length} files).`);
} else {
  console.log(stale.length ? `[sync-shared] updated: ${stale.join(", ")}` : `[sync-shared] already up to date (${files.length} files).`);
}
