// ── GitHub repos ─────────────────────────────────────────────────────────────

/** Repo chứa source code app */
const APP_REPO = "uongsuadaubung/switch-games";

/** Repo chứa data game (JSON) */
const DATA_REPO = "uongsuadaubung/switch-games-data";

// ── Data URLs ────────────────────────────────────────────────────────────────

export const GAMES_JSON_URL   = `https://raw.githubusercontent.com/${DATA_REPO}/main/data/games.json`;

// ── GitHub Releases API ───────────────────────────────────────────────────────

export const GITHUB_RELEASES_API = `https://api.github.com/repos/${APP_REPO}/releases/latest`;
export const GITHUB_RELEASES_URL = `https://github.com/${APP_REPO}/releases`;

// ── Tauri command names ───────────────────────────────────────────────────────

export const CMD_READ_USER_META     = "read_user_meta";
export const CMD_WRITE_USER_META    = "write_user_meta";
export const CMD_OPEN_URL           = "open_url";
export const CMD_OPEN_URLS          = "open_urls";

// ── localStorage keys ────────────────────────────────────────────────────────

export const STORAGE_VIEW_MODE    = "switch_games_view_mode";
export const STORAGE_USER_META    = "switch_games_user_meta";

// ── Layout & Animation ────────────────────────────────────────────────────────

/** Thời gian animation mở/đóng LinksPanel (ms) — khớp với CSS transition flex-basis */
export const PANEL_ANIM_MS = 220;
