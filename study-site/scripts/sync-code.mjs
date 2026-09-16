/**
 * sync-code.mjs
 *
 * Copies the real Book a Slot repository files into src/code-snapshots so the
 * study site always shows the *actual* code as frozen at the current commit.
 *
 * - Reads ONLY from the parent repository (../app, ../alembic, ../tests, ...).
 * - Writes ONLY inside study-site/src/code-snapshots.
 * - Never modifies any repository file.
 */
import { execSync } from "node:child_process";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, "..");
const REPO = path.resolve(SITE, "..");
const OUT = path.join(SITE, "src", "code-snapshots");

const SOURCES = [
  ["app", path.join(REPO, "app")],
  ["alembic", path.join(REPO, "alembic")],
  ["alembic.ini", path.join(REPO, "alembic.ini")],
  ["tests", path.join(REPO, "tests")],
  ["docker-compose.yml", path.join(REPO, "docker-compose.yml")],
  ["Dockerfile", path.join(REPO, "Dockerfile")],
  [".dockerignore", path.join(REPO, ".dockerignore")],
  ["pyproject.toml", path.join(REPO, "pyproject.toml")],
  [".env.example", path.join(REPO, ".env.example")],
  [".github", path.join(REPO, ".github")],
];

async function run() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  for (const [dest, src] of SOURCES) {
    await cp(src, path.join(OUT, dest), { recursive: true });
  }

  // Drop cache folders/files that could slip through.
  const pycache = await import("node:fs").then((fs) =>
    fs.promises.readdir(OUT, { recursive: true, withFileTypes: true }),
  );
  const purge = pycache.filter(
    (e) => e.name === "__pycache__" || /\.pyc$/.test(e.name),
  );
  const { rm: rmFile } = await import("node:fs/promises");
  for (const e of purge) {
    const p = path.join(e.parentPath, e.name);
    await rmFile(p, { recursive: e.isDirectory(), force: true });
  }

  const head = execSync("git rev-parse HEAD", { cwd: REPO }).toString().trim();
  const appLast = execSync("git log -1 --format=%h -- app", {
    cwd: REPO,
  })
    .toString()
    .trim();

  await writeFile(
    path.join(OUT, "_MANIFEST.json"),
    JSON.stringify(
      {
        copiedFrom: REPO,
        repoHead: head,
        appCodeLastChanged: appLast,
        syncedAt: new Date().toISOString(),
        note:
          "Frozen copies of the parent repository for teaching. Run 'npm run sync:code' after the repo changes.",
      },
      null,
      2
    ),
  );

  console.log(`Synced ${SOURCES.length} sources into ${OUT}`);
  console.log(`repo HEAD: ${head} | app code last changed: ${appLast}`);
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});