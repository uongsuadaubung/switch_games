// ── GitHub repos ─────────────────────────────────────────────────────────────

/** Repo chứa source code app */
const APP_REPO = "uongsuadaubung/switch-games";

/** Repo chứa data game (JSON) */
const DATA_REPO = "uongsuadaubung/switch-games-data";

// ── Data URLs ────────────────────────────────────────────────────────────────

export const VERSION_JSON_URL = `https://raw.githubusercontent.com/${DATA_REPO}/main/data/version.json`;
export const GAMES_JSON_URL   = `https://raw.githubusercontent.com/${DATA_REPO}/main/data/games.json`;

// ── GitHub Releases API ───────────────────────────────────────────────────────

export const GITHUB_RELEASES_API = `https://api.github.com/repos/${APP_REPO}/releases/latest`;
export const GITHUB_RELEASES_URL = `https://github.com/${APP_REPO}/releases`;

// ── Tauri command names ───────────────────────────────────────────────────────

export const CMD_READ_VERSION_HASH = "read_version_hash";
export const CMD_WRITE_VERSION_HASH = "write_version_hash";
export const CMD_READ_GAMES_CACHE  = "read_games_cache";
export const CMD_WRITE_GAMES_CACHE = "write_games_cache";
export const CMD_OPEN_URL          = "open_url";
export const CMD_OPEN_URLS         = "open_urls";

// ── localStorage keys ────────────────────────────────────────────────────────

export const STORAGE_VIEW_MODE    = "switch_games_view_mode";
export const STORAGE_VERSION_HASH = "switch_games_version_hash";
export const STORAGE_GAMES_CACHE  = "switch_games_games_cache";
