/**
 * bump-version.mjs
 * Đồng bộ phiên bản ở cả 3 file:
 *   - package.json
 *   - src-tauri/Cargo.toml
 *   - src-tauri/tauri.conf.json
 *
 * Dùng: node scripts/bump-version.mjs <version>
 * Ví dụ: node scripts/bump-version.mjs 0.5.5
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── Helpers ──────────────────────────────────────────────────────────────────

function readText(rel) {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

function writeText(rel, content) {
  writeFileSync(resolve(ROOT, rel), content, "utf8");
}

// ── Main ─────────────────────────────────────────────────────────────────────

const newVersion = process.argv[2];

if (!newVersion || !/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.log("\nLỗi: Vui lòng cung cấp số phiên bản hợp lệ (định dạng x.y.z)");
  console.log("Ví dụ: node scripts/bump-version.mjs 0.5.5\n");
  process.exit(1);
}

// 1. Lấy version cũ từ package.json (chủ yếu để log)
const pkg = JSON.parse(readText("package.json"));
const oldVersion = pkg.version;

console.log(`\n📦 Cập nhật phiên bản: ${oldVersion} → ${newVersion}\n`);

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

// 5. Run cargo update to refresh Cargo.lock
console.log("\n  🔄 Đang cập nhật Cargo.lock...");
try {
  execSync("cargo update --workspace", {
    stdio: "inherit",
    cwd: resolve(ROOT, "src-tauri"),
  });
  console.log("  ✅ Cargo.lock");
} catch (error) {
  console.error("  ❌ Lỗi khi cập nhật Cargo.lock:", error.message);
  // Không exit vì có thể máy dev chưa cài cargo, nhưng trên CI sẽ có
}

// 6. Run npm install to update package-lock.json
console.log("\n  🔄 Đang chạy npm install để cập nhật package-lock.json...");
try {
  execSync("npm install", { stdio: "inherit", cwd: ROOT });
  console.log("  ✅ package-lock.json");
} catch (error) {
  console.error("  ❌ Lỗi khi chạy npm install:", error.message);
  process.exit(1);
}

console.log(`\n🎉 Xong! Version mới: ${newVersion}`);
console.log(`\nBước tiếp theo:`);
console.log(`  git add package.json package-lock.json src-tauri/Cargo.toml src-tauri/tauri.conf.json`);
console.log(`  git commit -m "chore: bump version to ${newVersion}"`);
console.log(`  git push`);
console.log(`  → Tạo Release v${newVersion} trên GitHub để trigger CI build\n`);
