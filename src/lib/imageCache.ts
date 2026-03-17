import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import type { Game } from "./types";

/**
 * In-memory cache: gameKey → asset URL đã resolve
 * Tránh gọi invoke nhiều lần cho cùng 1 ảnh trong 1 phiên
 */
const memCache = new Map<string, string>();

/**
 * Tạo key filename an toàn từ game.
 * Ưu tiên game_id (hex string), fallback sang tên rút gọn.
 */
function imageKey(game: Game): string {
  if (game.game_id) return game.game_id;
  // Sanitize tên: chỉ giữ chữ/số/gạch dưới, tối đa 50 ký tự
  return game.name
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 50);
}

/**
 * Lấy src ảnh cho 1 game với cache 2 lớp:
 * 1. In-memory (instant)
 * 2. Disk cache qua Tauri (tồn tại giữa các phiên)
 * 3. Fetch từ mạng → lưu disk → trả src
 *
 * @returns asset URL hoặc original URL nếu lỗi
 */
export async function getCachedImageSrc(game: Game): Promise<string | null> {
  if (!game.image_url) return null;

  const key = imageKey(game);

  // ── 1. In-memory ────────────────────────────────────────────────
  if (memCache.has(key)) return memCache.get(key)!; // safe: .has() đã xác nhận key tồn tại

  // ── 2. Disk cache ───────────────────────────────────────────────
  try {
    const cached = await invoke<string | null>("check_image_cache", { key });
    if (cached) {
      const src = convertFileSrc(cached);
      memCache.set(key, src);
      return src;
    }
  } catch {
    // Nếu invoke lỗi, fallback về URL gốc
    return game.image_url;
  }

  // ── 3. Fetch từ mạng → lưu disk ─────────────────────────────────
  try {
    const res = await fetch(game.image_url);
    if (!res.ok) return game.image_url;

    const buffer = await res.arrayBuffer();
    const data = Array.from(new Uint8Array(buffer));

    const savedPath = await invoke<string>("save_image_cache", { key, data });
    const src = convertFileSrc(savedPath);
    memCache.set(key, src);
    return src;
  } catch {
    // Bất kỳ lỗi nào → dùng URL gốc  
    return game.image_url;
  }
}

/** Xóa in-memory cache (dùng khi cần reload) */
export function clearImageMemCache(): void {
  memCache.clear();
}
