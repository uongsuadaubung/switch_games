/**
 * bump-version.mjs
 * Đồng bộ nâng version ở cả 3 file:
 *   - package.json
 *   - src-tauri/Cargo.toml
 *   - src-tauri/tauri.conf.json
 *
 * Dùng: node scripts/bump-version.mjs [patch|minor|major]
 *   hoặc: npm run bump [--] [patch|minor|major]
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── Helpers ──────────────────────────────────────────────────────────────────

function bumpSemver(version, type) {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3 || parts.some(isNaN))
    throw new Error(`Version không hợp lệ: "${version}"`);
  const [major, minor, patch] = parts;
  switch (type) {
    case "major": return `${major + 1}.0.0`;
    case "minor": return `${major}.${minor + 1}.0`;
    case "patch": return `${major}.${minor}.${patch + 1}`;
    default: throw new Error(`Loại bump không hợp lệ: "${type}". Dùng patch | minor | major`);
  }
}

function readText(rel) {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

function writeText(rel, content) {
  writeFileSync(resolve(ROOT, rel), content, "utf8");
}

// ── Main ─────────────────────────────────────────────────────────────────────

const bumpType = process.argv[2];

if (!bumpType) {
  // Đọc version hiện tại để hiển thị ví dụ cụ thể
  const pkg = JSON.parse(readText("package.json"));
  const cur = pkg.version;
  const [ma, mi, pa] = cur.split(".").map(Number);
  console.log(`\nVersion hiện tại: ${cur}\n`);
  console.log("Cách dùng:");
  console.log(`  npm run bump -- patch   # ${cur} → ${ma}.${mi}.${pa + 1}`);
  console.log(`  npm run bump -- minor   # ${cur} → ${ma}.${mi + 1}.0`);
  console.log(`  npm run bump -- major   # ${cur} → ${ma + 1}.0.0`);
  console.log();
  process.exit(0);
}

// 1. Lấy version hiện tại từ package.json
const pkg = JSON.parse(readText("package.json"));
const oldVersion = pkg.version;
const newVersion = bumpSemver(oldVersion, bumpType);

console.log(`\n📦 Bumping version: ${oldVersion} → ${newVersion}  (${bumpType})\n`);

// 2. package.json
pkg.version = newVersion;
writeText("package.json", JSON.stringify(pkg, null, 2) + "\n");
console.log("  ✅ package.json");

// 3. src-tauri/Cargo.toml  (chỉ sửa dòng version = "..." đầu tiên trong [package])
const cargoPath = "src-tauri/Cargo.toml";
const cargoOld = readText(cargoPath);
const cargoNew = cargoOld.replace(
  /^(version\s*=\s*)"[^"]+"/m,
  `$1"${newVersion}"`
);
if (cargoOld === cargoNew) throw new Error("Cargo.toml: không tìm thấy dòng version để sửa!");
writeText(cargoPath, cargoNew);
console.log("  ✅ src-tauri/Cargo.toml");

// 4. src-tauri/tauri.conf.json
const tauriPath = "src-tauri/tauri.conf.json";
const tauriConf = JSON.parse(readText(tauriPath));
tauriConf.version = newVersion;
writeText(tauriPath, JSON.stringify(tauriConf, null, 2) + "\n");
console.log("  ✅ src-tauri/tauri.conf.json");

console.log(`\n🎉 Xong! Version mới: ${newVersion}`);
console.log(`\nBước tiếp theo:`);
console.log(`  git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json`);
console.log(`  git commit -m "chore: bump version to ${newVersion}"`);
console.log(`  git push`);
console.log(`  → Tạo Release v${newVersion} trên GitHub để trigger CI build\n`);
