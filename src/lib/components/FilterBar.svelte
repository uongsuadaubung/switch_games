<script lang="ts">
  import { store } from "$lib/stores/gameStore.svelte";
</script>

<div class="filter-bar">
  {#if store.checkedCount > 0}
    <!-- ── Multi-select toolbar ── -->
    <div class="selection-bar">
      <span class="sel-label">Đã chọn <strong>{store.checkedCount}</strong> game</span>
      {#if store.filterHidden}
        <button class="sel-btn unhide-btn" onclick={store.unhideChecked}>
          ✅ Bỏ ẩn {store.checkedCount} game
        </button>
      {:else}
        <button class="sel-btn hide-btn" onclick={store.hideChecked}>
          🚫 Ẩn {store.checkedCount} game
        </button>
      {/if}
      <button class="sel-btn cancel-btn" onclick={store.clearChecked}>
        Bỏ chọn
      </button>
    </div>
  {:else}
    <!-- ── Normal filters ── -->
    <div class="search-wrap">
      <svg
        class="search-icon"
        width="15"
        height="15"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
      <input
        class="search-input"
        type="text"
        placeholder="Tìm game, thể loại, ID..."
        bind:value={store.searchQuery}
        bind:this={store.searchInputEl}
      />
      {#if store.searchQuery}
        <button class="clear-btn" onclick={() => (store.searchQuery = "")}
          >✕</button
        >
      {/if}
    </div>

    <select class="filter-select" bind:value={store.filterGenre}>
      {#each store.allGenres as genre}
        <option value={genre}
          >{genre === "all" ? "Tất cả thể loại" : genre}</option
        >
      {/each}
    </select>

    {#if store.vietHoaCount > 0}
      <button
        class="filter-toggle viet-filter"
        class:active={store.filterVietHoa}
        onclick={() => (store.filterVietHoa = !store.filterVietHoa)}
      >
        Việt hóa ({store.vietHoaCount})
      </button>
    {/if}

    {#if store.hiddenCount > 0}
      <button
        class="filter-toggle hidden-filter"
        class:active={store.filterHidden}
        onclick={() => (store.filterHidden = !store.filterHidden)}
      >
        🚫 Đã ẩn ({store.hiddenCount})
      </button>
    {/if}

    {#if store.newGameCount > 0}
      <button
        class="filter-toggle new-filter"
        class:active={store.filterNew}
        onclick={() => (store.filterNew = !store.filterNew)}
      >
        ✦ Mới ({store.newGameCount})
      </button>
    {/if}

    {#if store.favoriteCount > 0}
      <button
        class="filter-toggle fav-filter"
        class:active={store.filterFavorite}
        onclick={() => (store.filterFavorite = !store.filterFavorite)}
      >
        ❤ Yêu thích ({store.favoriteCount})
      </button>
    {/if}

    {#if store.searchQuery || store.filterVietHoa || store.filterGenre !== "all" || store.filterHidden || store.filterNew || store.filterFavorite}
      <button class="clear-filters" onclick={store.clearFilters}
        >Xóa bộ lọc</button
      >
    {/if}
  {/if}

  <!-- Toggle chế độ hiển thị -->
  <div class="view-toggle">
    <button
      class="view-btn"
      class:active={store.viewMode === "table"}
      onclick={() => (store.viewMode = "table")}
      title="Chế độ danh sách"
      aria-label="List view"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
        <rect x="0" y="0" width="14" height="2" rx="1"/>
        <rect x="0" y="5" width="14" height="2" rx="1"/>
        <rect x="0" y="10" width="14" height="2" rx="1"/>
      </svg>
    </button>
    <button
      class="view-btn"
      class:active={store.viewMode === "grid"}
      onclick={() => (store.viewMode = "grid")}
      title="Chế độ lưới"
      aria-label="Grid view"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
        <rect x="0"  y="0"  width="6" height="6" rx="1"/>
        <rect x="8"  y="0"  width="6" height="6" rx="1"/>
        <rect x="0"  y="8"  width="6" height="6" rx="1"/>
        <rect x="8"  y="8"  width="6" height="6" rx="1"/>
      </svg>
    </button>
  </div>
</div>

<style lang="scss">
  .filter-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
    flex-wrap: wrap;
    min-height: 52px;
    position: relative;
  }

  // ── Selection toolbar ──
  .selection-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    animation: slideIn 0.15s ease;
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .sel-label {
    font-size: 13px;
    color: var(--text-secondary);
    flex: 1;
    strong { color: var(--blue); font-weight: 700; }
  }

  .sel-btn {
    border-radius: 8px;
    padding: 6px 14px;
    font-size: 13px;
    font-weight: 600;
    transition: background 0.15s, border-color 0.15s;
  }

  .hide-btn {
    background: rgba(228, 0, 15, 0.12);
    border: 1px solid rgba(228, 0, 15, 0.4);
    color: var(--accent);
    &:hover { background: rgba(228, 0, 15, 0.22); border-color: var(--accent); }
  }

  .unhide-btn {
    background: rgba(0, 200, 100, 0.12);
    border: 1px solid rgba(0, 200, 100, 0.4);
    color: #00e676;
    &:hover { background: rgba(0, 200, 100, 0.22); border-color: rgba(0, 200, 100, 0.7); }
  }

  .cancel-btn {
    background: var(--bg-card);
    border: 1px solid var(--border);
    color: var(--text-secondary);
    &:hover { border-color: var(--accent); color: var(--text-primary); }
  }

  // ── Normal filters ──
  .search-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 9px;
    color: var(--text-secondary);
    pointer-events: none;
  }

  .search-input {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 6px 32px 6px 30px;
    color: var(--text-primary);
    width: 240px;
    font-size: 13px;
    &:focus { border-color: var(--accent); }
    &::placeholder { color: var(--text-secondary); }
  }

  .clear-btn {
    position: absolute;
    right: 8px;
    background: none;
    color: var(--text-secondary);
    font-size: 11px;
    padding: 2px;
    &:hover { color: var(--text-primary); }
  }

  .filter-select {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 6px 10px;
    color: var(--text-primary);
    font-family: inherit;
    font-size: 13px;
    cursor: pointer;
    max-width: 160px;
    &:focus { border-color: var(--accent); outline: none; }
  }

  .filter-toggle {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 6px 12px;
    color: var(--text-secondary);
    font-size: 13px;
    white-space: nowrap;

    &:hover { border-color: var(--accent); color: var(--text-primary); }
    &.active { background: var(--accent-dim); border-color: var(--accent); color: var(--accent); font-weight: 600; }
    &.hidden-filter.active { background: rgba(140,140,160,0.15); border-color: rgba(140,140,160,0.5); color: var(--text-secondary); }
  }

  .new-filter {
    border-color: rgba(0, 200, 100, 0.3);
    color: #00e676;
    &:hover { border-color: rgba(0,200,100,0.6); background: rgba(0,200,100,0.07); }
    &.active { background: rgba(0,200,100,0.15); border-color: rgba(0,200,100,0.6); color: #00e676; font-weight: 700; }
  }

  .fav-filter {
    border-color: rgba(255, 100, 130, 0.3);
    color: rgba(255, 100, 130, 0.8);
    &:hover { border-color: rgba(255,100,130,0.6); background: rgba(255,100,130,0.07); }
    &.active { background: rgba(255,100,130,0.15); border-color: rgba(255,100,130,0.6); color: #ff6482; font-weight: 700; }
  }

  .clear-filters {
    background: none;
    color: var(--text-secondary);
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 6px;
    border: 1px solid transparent;
    transition: color 0.15s, border-color 0.15s;
    &:hover { color: var(--accent); border-color: rgba(205,72,51,0.3); }
  }

  // View mode toggle
  .view-toggle {
    margin-left: auto;
    display: flex;
    gap: 2px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 2px;
    flex-shrink: 0;
  }

  .view-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 26px;
    border-radius: 6px;
    color: var(--text-secondary);
    background: none;
    border: none;
    transition: background 0.12s, color 0.12s;
    &:hover { color: var(--text-primary); background: rgba(255,255,255,0.06); }
    &.active { background: var(--accent); color: white; }
  }
</style>
