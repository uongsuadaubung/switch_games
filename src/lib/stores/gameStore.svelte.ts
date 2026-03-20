import { invoke } from "@tauri-apps/api/core";
import type { Game } from "$lib/types";
import {
  VERSION_JSON_URL,
  GAMES_JSON_URL,
  CMD_READ_VERSION_HASH,
  CMD_WRITE_VERSION_HASH,
  CMD_READ_GAMES_CACHE,
  CMD_WRITE_GAMES_CACHE,
  CMD_OPEN_URL,
  CMD_OPEN_URLS,
  STORAGE_VIEW_MODE,
  STORAGE_VERSION_HASH,
  STORAGE_GAMES_CACHE,
} from "$lib/constants";
import { IS_BROWSER } from "$lib/environment";

// ── Cache helpers (Tauri ↔ disk || Browser ↔ localStorage) ──────────────────────────────────────────────

async function cacheReadHash(): Promise<string | null> {
  if (!IS_BROWSER) {
    try {
      return await invoke<string | null>(CMD_READ_VERSION_HASH);
    } catch (e) {
      console.warn("Không đọc được version hash từ disk:", e);
      return null;
    }
  }
  return localStorage.getItem(STORAGE_VERSION_HASH);
}

async function cacheWriteHash(hash: string): Promise<void> {
  if (!IS_BROWSER) {
    try {
      await invoke(CMD_WRITE_VERSION_HASH, { hash });
    } catch (e) {
      console.warn("Không ghi được version hash:", e);
    }
  } else {
    localStorage.setItem(STORAGE_VERSION_HASH, hash);
  }
}

async function cacheReadGames(): Promise<Game[] | null> {
  if (!IS_BROWSER) {
    try {
      const raw = await invoke<string | null>(CMD_READ_GAMES_CACHE);
      if (!raw) return null;
      return JSON.parse(raw) as Game[];
    } catch (e) {
      console.warn("Không đọc được games cache từ disk:", e);
      return null;
    }
  }
  try {
    const raw = localStorage.getItem(STORAGE_GAMES_CACHE);
    if (!raw) return null;
    return JSON.parse(raw) as Game[];
  } catch (e) {
    console.warn("Không đọc được games cache từ localStorage:", e);
    return null;
  }
}

async function cacheWriteGames(games: Game[]): Promise<void> {
  if (!IS_BROWSER) {
    try {
      await invoke(CMD_WRITE_GAMES_CACHE, { data: JSON.stringify(games) });
    } catch (e) {
      console.warn("Không ghi được games cache:", e);
    }
  } else {
    try {
      localStorage.setItem(STORAGE_GAMES_CACHE, JSON.stringify(games));
    } catch (e) {
      // QuotaExceededError: games.json vượt giới hạn ~5MB của localStorage.
      // Xóa cả hash để lần sau bắt buộc fetch lại thay vì dùng cache lỗi.
      console.warn("Không ghi được games cache vào localStorage (quota?):", e);
      localStorage.removeItem(STORAGE_GAMES_CACHE);
      localStorage.removeItem(STORAGE_VERSION_HASH);
    }
  }
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

  // Sort
  type SortKey = "name" | "size";
  let sortKey = $state<SortKey | null>(null);
  let sortDir = $state<"asc" | "desc">("asc");

  // View mode — persist vào localStorage để nhớ sau khi restart
  type ViewMode = "table" | "grid";
  let viewMode = $state<ViewMode>(
    (localStorage.getItem(STORAGE_VIEW_MODE) as ViewMode | null) ?? "table"
  );

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

  // ── Sort helper ───────────────────────────────────────────────────────────

  /** Parse size string "3.75 GB" / "512 MB" → bytes (soánh số) */
  function parseSize(s: string): number {
    const m = s.match(/([\d.]+)\s*(GB|MB|KB)/i);
    if (!m) return 0;
    const v = parseFloat(m[1]);
    switch (m[2].toUpperCase()) {
      case "GB": return v * 1024 * 1024;
      case "MB": return v * 1024;
      default:   return v;
    }
  }


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

    // ── Sort ───────────────────────────────────────────────────────
    if (sortKey) {
      const dir = sortDir === "asc" ? 1 : -1;
      games = [...games].sort((a, b) => {
        switch (sortKey) {
          case "name":
            return dir * a.name.localeCompare(b.name, "vi");
          case "size":
            return dir * (parseSize(a.size) - parseSize(b.size));
          default:
            return 0;
        }
      });
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

      // ── 4. Merge user metadata từ cache (is_hidden, is_favorite, note) ──────
      const mergedGames = cachedGames
        ? (() => {
            const cachedMap = new Map(cachedGames.map((g) => [g.game_id || g.name, g]));
            return freshGames.map((g) => {
              const old = cachedMap.get(g.game_id || g.name);
              if (!old) return g;
              return {
                ...g,
                ...(old.is_hidden   ? { is_hidden: true }   : {}),
                ...(old.is_favorite ? { is_favorite: true } : {}),
                ...(old.note        ? { note: old.note }    : {}),
              };
            });
          })()
        : freshGames;

      await Promise.all([
        cacheWriteHash(remoteHash),
        cacheWriteGames(mergedGames),
      ]);

      allGames = mergedGames;

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
    if (!IS_BROWSER) {
      await invoke(CMD_OPEN_URL, { url });
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  async function openAllLinks(game: Game) {
    const urls = game.links
      .map((l) => l.url || l.file_name)
      .filter((u): u is string => Boolean(u));
    if (!IS_BROWSER) {
      await invoke(CMD_OPEN_URLS, { urls });
    } else {
      // Phải mở đồng bộ trong cùng call stack của user gesture.
      // setTimeout sẽ đưa callback ra ngoài gesture context → browser block.
      for (const url of urls) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    }
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
    get sortKey()         { return sortKey; },
    get sortDir()         { return sortDir; },
    toggleSort(key: "name" | "size") {
      if (sortKey === key) {
        // Cùng cột → đảo chiều, hoặc nếu đang desc thì bỏ sort
        if (sortDir === "asc") { sortDir = "desc"; }
        else { sortKey = null; sortDir = "asc"; }
      } else {
        sortKey = key;
        sortDir = "asc";
      }
    },
    get viewMode()        { return viewMode; },
    set viewMode(v: "table" | "grid") {
      viewMode = v;
      localStorage.setItem(STORAGE_VIEW_MODE, v);
    },
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
