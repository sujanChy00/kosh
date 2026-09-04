import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const rootDir = process.cwd();

// Lockfile patterns to remove
const LOCK_FILES = [
  "bun.lock",
  "bun.lockb",
  "yarn.lock",
  "package-lock.json",
  "pnpm-lock.yaml",
];

// Folders to remove
const TARGET_DIRS = ["node_modules", ".turbo", ".expo"];

function removeFileOrDir(targetPath) {
  if (!fs.existsSync(targetPath)) return;
  try {
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      fs.rmSync(targetPath, { recursive: true, force: true });
      console.log(`  [deleted dir] ${path.relative(rootDir, targetPath)}`);
    } else {
      fs.rmSync(targetPath, { force: true });
      console.log(`  [deleted file] ${path.relative(rootDir, targetPath)}`);
    }
  } catch (err) {
    console.error(`  [error] Failed to remove ${targetPath}: ${err.message}`);
  }
}

function cleanRecursively(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Don't recurse into .git
      if (entry.name === ".git") continue;

      if (TARGET_DIRS.includes(entry.name)) {
        removeFileOrDir(fullPath);
      } else {
        cleanRecursively(fullPath);
      }
    } else if (entry.isFile()) {
      if (LOCK_FILES.includes(entry.name)) {
        removeFileOrDir(fullPath);
      }
    }
  }
}

console.log("🧹 Cleaning node_modules, lock files, and build caches...\n");
cleanRecursively(rootDir);

console.log("\n📦 Running 'bun install'...\n");
const result = spawnSync("bun", ["install"], {
  cwd: rootDir,
  stdio: "inherit",
  shell: true,
});

if (result.status === 0) {
  console.log("\n✨ Clean install complete!");
} else {
  console.error(`\n❌ 'bun install' failed with exit code ${result.status}`);
  process.exit(result.status ?? 1);
}
