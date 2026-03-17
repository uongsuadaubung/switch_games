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
