import { invoke } from "@tauri-apps/api/core";
import type { Game } from "$lib/types";

const VERSION_JSON_URL =
  "https://raw.githubusercontent.com/uongsuadaubung/switch_games_data/main/data/version.json";
const GAMES_JSON_URL =
  "https://raw.githubusercontent.com/uongsuadaubung/switch_games_data/main/data/games.json";

// ── Cache helpers (Tauri ↔ disk) ──────────────────────────────────────────────

async function cacheReadHash(): Promise<string | null> {
  try {
    return await invoke<string | null>("read_version_hash");
  } catch (e) {
    console.warn("Không đọc được version hash từ disk:", e);
    return null;
  }
}

async function cacheWriteHash(hash: string): Promise<void> {
  try {
    await invoke("write_version_hash", { hash });
  } catch (e) {
    console.warn("Không ghi được version hash:", e);
  }
}

async function cacheReadGames(): Promise<Game[] | null> {
  try {
    const raw = await invoke<string | null>("read_games_cache");
    if (!raw) return null;
    return JSON.parse(raw) as Game[];
  } catch (e) {
    console.warn("Không đọc được games cache từ disk:", e);
    return null;
  }
}

async function cacheWriteGames(games: Game[]): Promise<void> {
  try {
    await invoke("write_games_cache", { data: JSON.stringify(games) });
  } catch (e) {
    console.warn("Không ghi được games cache:", e);
  }
}

// ── New game detection ────────────────────────────────────────────────────────

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Game hết "mới" khi CẢ HAI điều kiện đều đúng:
 *  - User đã click vào (is_new_seen = true)
 *  - Đã qua ít nhất 7 ngày kể từ is_new_since
 */
function shouldKeepNew(game: Game): boolean {
  if (!game.is_new) return false;
  if (!game.is_new_seen) return true; // chưa click → luôn giữ
  const since = game.is_new_since
    ? new Date(game.is_new_since).getTime()
    : Date.now();
  return Date.now() - since < ONE_WEEK_MS; // chưa đủ 7 ngày → giữ
}

/**
 * So sánh fresh games với cache cũ:
 * - Game chưa có trong cache        → is_new = true, ghi timestamp
 * - Game đã có + còn "mới" (chưa expire) → giữ nguyên new metadata
 * - Game đã có + đã expire          → bỏ is_new
 * Luôn giữ nguyên is_hidden và is_favorite từ cache cũ
 */
function markNewGames(
  fresh: Game[],
  cached: Game[]
): { games: Game[]; newCount: number } {
  // Dùng Map để O(1) lookup và giữ đủ metadata
  const cachedMap = new Map(cached.map((g) => [g.game_id || g.name, g]));
  const now = new Date().toISOString();

  const games = fresh.map((g) => {
    const key = g.game_id || g.name;
    const old = cachedMap.get(key);

    if (!old) {
      // Game hoàn toàn mới
      return { ...g, is_new: true, is_new_since: now, is_new_seen: false };
    }

    // Giữ toàn bộ metadata do user tạo ra (không có trong data gốc)
    const userMeta: Partial<Game> = {};
    if (old.is_hidden)          userMeta.is_hidden   = true;
    if (old.is_favorite)        userMeta.is_favorite = true;
    if (old.note)               userMeta.note        = old.note;

    if (old.is_new && shouldKeepNew(old)) {
      // Vẫn còn trong thời gian "mới" → giữ nguyên metadata
      return {
        ...g,
        ...userMeta,
        is_new: true,
        is_new_since: old.is_new_since,
        is_new_seen: old.is_new_seen,
      };
    }

    // Không mới hoặc đã expire
    return { ...g, ...userMeta };
  });

  const newCount = games.filter((g) => g.is_new).length;
  return { games, newCount };
}

// ── Store factory ─────────────────────────────────────────────────────────────

function createGameStore() {
  // ── State ──────────────────────────────────────────────────────────────────
  let allGames       = $state<Game[]>([]);
  let isLoading      = $state(false);
  let loadError      = $state<string | null>(null);
  let selectedGame   = $state<Game | null>(null);
  let showLinksPanel = $state(false);
  let showYoutube    = $state(false);

  // Multi-select
  let checkedKeys = $state<Set<string>>(new Set());

  // Filters
  let searchQuery   = $state("");
  let filterVietHoa = $state(false);
  let filterGenre   = $state("all");
  let filterHidden  = $state(false);
  let filterNew     = $state(false);
  let filterFavorite = $state(false);

  // Search input element ref (dùng cho keyboard shortcut Ctrl+F)
  let searchInputEl = $state<HTMLInputElement | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────────
  const hiddenCount    = $derived(allGames.filter((g) => g.is_hidden).length);
  const newGameCount   = $derived(allGames.filter((g) => g.is_new).length);
  const favoriteCount  = $derived(allGames.filter((g) => g.is_favorite).length);
  const vietHoaCount   = $derived(allGames.filter((g) => g.is_viet_hoa).length);
  const checkedCount   = $derived(checkedKeys.size);

  const allGenres = $derived.by(() => {
    const genres = new Set<string>();
    allGames.forEach((g) => g.genres.forEach((gen) => genres.add(gen)));
    return ["all", ...Array.from(genres).sort()];
  });

  const filteredGames = $derived.by(() => {
    let games = allGames;

    if (filterHidden) {
      games = games.filter((g) => g.is_hidden);
    } else {
      games = games.filter((g) => !g.is_hidden);
    }

    if (filterFavorite) {
      games = games.filter((g) => g.is_favorite);
    }

    if (filterNew) {
      games = games.filter((g) => g.is_new);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      games = games.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.genres.some((gen) => gen.toLowerCase().includes(q)) ||
          g.game_id.toLowerCase().includes(q)
      );
    }

    if (filterVietHoa) {
      games = games.filter((g) => g.is_viet_hoa);
    }

    if (filterGenre !== "all") {
      games = games.filter((g) => g.genres.includes(filterGenre));
    }

    return games;
  });

  const allChecked = $derived(
    filteredGames.length > 0 && filteredGames.every((g) => checkedKeys.has(gameKey(g)))
  );

  // ── Helpers ────────────────────────────────────────────────────────────────
  function gameKey(game: Game): string {
    return game.game_id || game.name;
  }

  /** Đóng LinksPanel nếu selectedGame nằm trong tập keys bị tác động */
  function closePanelIfAffected(keys: Set<string>) {
    if (selectedGame && keys.has(gameKey(selectedGame))) {
      selectedGame   = null;
      showLinksPanel = false;
      showYoutube    = false;
    }
  }

  /** Tắt filterHidden nếu không còn game ẩn nào (dùng sau khi bỏ ẩn) */
  function exitHiddenFilterIfEmpty() {
    if (filterHidden && allGames.every((g) => !g.is_hidden)) {
      filterHidden = false;
    }
  }

  /** Tắt filterFavorite nếu không còn game yêu thích nào (dùng sau khi bỏ yêu thích) */
  function exitFavoriteFilterIfEmpty() {
    if (filterFavorite && allGames.every((g) => !g.is_favorite)) {
      filterFavorite = false;
    }
  }

  function getYoutubeEmbedUrl(url: string): string | null {
    if (!url) return null;
    try {
      const u = new URL(url);
      let videoId: string | null = null;
      if (u.hostname === "youtu.be") videoId = u.pathname.slice(1);
      else if (u.hostname.includes("youtube.com"))
        videoId = u.searchParams.get("v");
      if (!videoId) return null;
      return `https://www.youtube.com/embed/${videoId}?rel=0`;
    } catch {
      return null;
    }
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Ẩn/bỏ ẩn một game đơn lẻ (từ LinksPanel). Tự đóng panel + thoát filterHidden nếu cần. */
  function toggleHide(game: Game) {
    const key = gameKey(game);
    const nowHidden = !game.is_hidden;
    allGames = allGames.map((g) =>
      gameKey(g) === key ? { ...g, is_hidden: nowHidden } : g
    );
    cacheWriteGames(allGames);
    closePanelIfAffected(new Set([key]));
    if (!nowHidden) exitHiddenFilterIfEmpty();
  }

  function selectGame(game: Game) {
    selectedGame = game;
    showLinksPanel = true;
    showYoutube = false;

    // Đánh dấu đã xem → bắt đầu countdown 7 ngày
    if (game.is_new && !game.is_new_seen) {
      const updated: Game = { ...game, is_new_seen: true };
      allGames = allGames.map((g) =>
        gameKey(g) === gameKey(game) ? updated : g
      );
      selectedGame = updated;
      cacheWriteGames(allGames); // fire-and-forget
    }
  }

  function closePanel() {
    showLinksPanel = false;
    selectedGame = null;
    showYoutube = false;
  }

  function clearFilters() {
    searchQuery    = "";
    filterVietHoa  = false;
    filterGenre    = "all";
    filterHidden   = false;
    filterNew      = false;
    filterFavorite = false;
    // Bỏ chọn game đang hiển thị trong LinksPanel
    selectedGame   = null;
    showLinksPanel = false;
    showYoutube    = false;
    checkedKeys    = new Set();
  }

  // ── Multi-select actions ───────────────────────────────────────────────────

  function toggleCheck(game: Game) {
    const key = gameKey(game);
    const next = new Set(checkedKeys);
    if (next.has(key)) next.delete(key); else next.add(key);
    checkedKeys = next;
  }

  function toggleCheckAll() {
    if (allChecked) {
      checkedKeys = new Set();
    } else {
      checkedKeys = new Set(filteredGames.map(gameKey));
    }
  }

  function clearChecked() {
    checkedKeys = new Set();
  }

  /** Ẩn tất cả game đã check, sau đó clear selection */
  function hideChecked() {
    const keys = checkedKeys;
    allGames = allGames.map((g) =>
      keys.has(gameKey(g)) ? { ...g, is_hidden: true } : g
    );
    cacheWriteGames(allGames);
    checkedKeys = new Set();
    closePanelIfAffected(keys);
  }

  /** Bỏ ẩn tất cả game đã check, sau đó clear selection. Thoát filterHidden nếu hết game ẩn. */
  function unhideChecked() {
    const keys = checkedKeys;
    allGames = allGames.map((g) =>
      keys.has(gameKey(g)) ? { ...g, is_hidden: false } : g
    );
    cacheWriteGames(allGames);
    checkedKeys = new Set();
    closePanelIfAffected(keys);
    exitHiddenFilterIfEmpty();
  }

  /** Toggle yêu thích cho 1 game (từ LinksPanel). Cập nhật cache ngay. */
  function toggleFavorite(game: Game) {
    const key = gameKey(game);
    const nowFavorite = !game.is_favorite;
    allGames = allGames.map((g) =>
      gameKey(g) === key ? { ...g, is_favorite: nowFavorite } : g
    );
    // Cập nhật selectedGame để UI phản hồi ngay
    if (selectedGame && gameKey(selectedGame) === key) {
      selectedGame = { ...selectedGame, is_favorite: nowFavorite };
    }
    cacheWriteGames(allGames);
    // Nếu bỏ yêu thích và hết game nào trong danh sách → tự thoát filter
    if (!nowFavorite) exitFavoriteFilterIfEmpty();
  }

  /** Cập nhật ghi chú cá nhân cho 1 game. Lưu cache ngay. */
  function updateNote(game: Game, note: string) {
    const key = gameKey(game);
    const trimmed = note.trim() || undefined; // chuỗi rỗng → xóa field
    allGames = allGames.map((g) =>
      gameKey(g) === key ? { ...g, note: trimmed } : g
    );
    // Cập nhật selectedGame để UI phản hồi ngay
    if (selectedGame && gameKey(selectedGame) === key) {
      selectedGame = { ...selectedGame, note: trimmed };
    }
    cacheWriteGames(allGames);
  }

  /**
   * Fetch flow:
   * 1. Fetch version.json → lấy hash
   * 2. Đọc hash + cache từ disk
   *    - Giống → dùng cache ngay
   *    - Khác  → fetch games.json, merge với cache (giữ is_hidden, is_new metadata)
   * 3. Fallback khi lỗi mạng: dùng cache trên disk
   */
  async function fetchGames() {
    isLoading = true;
    loadError = null;

    try {
      // ── 1. Fetch version.json ──────────────────────────────────────────────
      const versionRes = await fetch(VERSION_JSON_URL);
      if (!versionRes.ok)
        throw new Error(`version.json HTTP ${versionRes.status}`);
      const versionData: { hash: string; timestamp: string; game_count: number } =
        await versionRes.json();
      const remoteHash = versionData.hash;

      // ── 2. Đọc từ disk ────────────────────────────────────────────────────
      const [localHash, cachedGames] = await Promise.all([
        cacheReadHash(),
        cacheReadGames(),
      ]);

      // ── 3a. Hash không đổi + có cache → dùng luôn ────────────────────────
      if (remoteHash === localHash && cachedGames) {
        allGames = cachedGames;
        return;
      }

      // ── 3b. Hash mới → fetch games.json, merge ────────────────────────────
      const gamesRes = await fetch(GAMES_JSON_URL);
      if (!gamesRes.ok)
        throw new Error(`games.json HTTP ${gamesRes.status}`);
      const freshGames: Game[] = await gamesRes.json();

      // ── 4. So sánh với cache để mark game mới, rồi lưu disk ───────────────
      const markedGames = cachedGames
        ? markNewGames(freshGames, cachedGames).games
        : freshGames;

      await Promise.all([
        cacheWriteHash(remoteHash),
        cacheWriteGames(markedGames),
      ]);

      allGames = markedGames;

    } catch (e) {
      console.error("Fetch error:", e);
      const cachedGames = await cacheReadGames();
      if (cachedGames) {
        allGames  = cachedGames;
        loadError = `Không thể cập nhật (đang dùng cache): ${e}`;
      } else {
        loadError = `Không thể tải dữ liệu: ${e}`;
      }
    } finally {
      isLoading = false;
    }
  }

  async function openUrl(url: string) {
    if (!url || url.trim() === "") return;
    await invoke("open_url", { url });
  }

  async function openAllLinks(game: Game) {
    const urls = [
      ...game.links.base,
      ...game.links.update,
      ...game.links.dlc,
      ...game.links.viet_hoa,
    ]
      .map((l) => l.url || l.filename)
      .filter(Boolean);
    await invoke("open_urls", { urls });
  }

  // ── Expose ─────────────────────────────────────────────────────────────────
  return {
    get allGames()        { return allGames; },
    get isLoading()       { return isLoading; },
    get loadError()       { return loadError; },
    get newGameCount()    { return newGameCount; },
    get hiddenCount()     { return hiddenCount; },
    get favoriteCount()   { return favoriteCount; },
    get vietHoaCount()    { return vietHoaCount; },
    get selectedGame()    { return selectedGame; },
    get showLinksPanel()  { return showLinksPanel; },
    get showYoutube()     { return showYoutube; },
    set showYoutube(v: boolean)    { showYoutube = v; },
    get searchQuery()     { return searchQuery; },
    set searchQuery(v: string)     { searchQuery = v; },
    get filterVietHoa()   { return filterVietHoa; },
    set filterVietHoa(v: boolean)  { filterVietHoa = v; },
    get filterGenre()     { return filterGenre; },
    set filterGenre(v: string)     { filterGenre = v; },
    get filterHidden()    { return filterHidden; },
    set filterHidden(v: boolean)   { filterHidden = v; },
    get filterNew()       { return filterNew; },
    set filterNew(v: boolean)      { filterNew = v; },
    get filterFavorite()  { return filterFavorite; },
    set filterFavorite(v: boolean) { filterFavorite = v; },
    get allGenres()       { return allGenres; },
    get filteredGames()   { return filteredGames; },
    // Multi-select
    get checkedKeys()     { return checkedKeys; },
    get checkedCount()    { return checkedCount; },
    get allChecked()      { return allChecked; },
    // Search input ref (keyboard shortcut)
    get searchInputEl()   { return searchInputEl; },
    set searchInputEl(el: HTMLInputElement | null) { searchInputEl = el; },
    getYoutubeEmbedUrl,
    fetchGames,
    selectGame,
    closePanel,
    clearFilters,
    toggleHide,
    toggleFavorite,
    updateNote,
    toggleCheck,
    toggleCheckAll,
    clearChecked,
    hideChecked,
    unhideChecked,
    openUrl,
    openAllLinks,
  };
}

// Singleton store — shared across all components
export const store = createGameStore();
