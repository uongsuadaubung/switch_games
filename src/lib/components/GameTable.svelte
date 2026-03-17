<script lang="ts">
  import { store } from "$lib/stores/gameStore.svelte";
  import CachedImage from "$lib/components/CachedImage.svelte";

  // Columns: [checkbox | # | Tên game | Kích thước | Thể loại | Links]
  const COL_TEMPLATE = "36px 44px 2fr 1fr 1fr 1fr";
</script>

<div class="table-container">
  <!-- ── Header (sticky) ── -->
  <div class="table-header" style="grid-template-columns: {COL_TEMPLATE}">
    <div class="th th-check">
      <input
        type="checkbox"
        class="row-check"
        checked={store.allChecked}
        indeterminate={store.checkedCount > 0 && !store.allChecked}
        onchange={store.toggleCheckAll}
      />
    </div>
    <div class="th">#</div>
    <div class="th">Tên game</div>
    <div class="th">Kích thước</div>
    <div class="th">Thể loại</div>
    <div class="th">Links</div>
  </div>

  <!-- ── Body ── -->
  <div class="table-body">
    {#each store.filteredGames as game, i (game.game_id || game.name)}
      {@const key = game.game_id || game.name}
      {@const isChecked = store.checkedKeys.has(key)}
      <div
        class="game-row"
        class:selected={store.selectedGame?.game_id === game.game_id &&
          store.selectedGame?.name === game.name}
        class:checked={isChecked}
        style="grid-template-columns: {COL_TEMPLATE}"
        role="row"
        tabindex="0"
        onclick={() => store.selectGame(game)}
        onkeydown={(e) => e.key === "Enter" && store.selectGame(game)}
      >
        <!-- Checkbox -->
        <div
          class="td td-check"
          role="cell"
          onclick={(e) => { e.stopPropagation(); store.toggleCheck(game); }}
          onkeydown={(e) => { if (e.key === " ") { e.stopPropagation(); store.toggleCheck(game); } }}
          tabindex="-1"
        >
          <input
            type="checkbox"
            class="row-check"
            checked={isChecked}
            onclick={(e) => e.stopPropagation()}
            onchange={() => store.toggleCheck(game)}
          />
        </div>

        <!-- # -->
        <div class="td td-num" role="cell">{i + 1}</div>

        <!-- Tên -->
        <div class="td td-name" role="cell">
          <div class="name-cell">
            {#if game.image_url}
              <CachedImage {game} class="game-thumb" loading="lazy" />
            {/if}
            <div class="name-info">
              <span class="game-name">{game.name}</span>
              <div class="name-tags">
                {#if game.is_new}
                  <span class="tag tag-new">✦ MỚI</span>
                {/if}
                {#if game.is_favorite}
                  <span class="tag tag-fav">❤</span>
                {/if}
                {#if game.note}
                  <span class="tag tag-note" title={game.note}>📝</span>
                {/if}
                {#if game.is_viet_hoa}
                  <span class="tag tag-viet">Việt Hóa</span>
                {/if}
                {#if game.game_id}
                  <span class="tag tag-id">{game.game_id}</span>
                {/if}
              </div>
            </div>
          </div>
        </div>

        <!-- Size -->
        <div class="td td-size" role="cell">{game.size}</div>

        <!-- Genres -->
        <div class="td td-genres" role="cell">
          <div class="genres-wrap">
            {#each game.genres as genre}
              <span class="genre-chip">{genre}</span>
            {/each}
          </div>
        </div>

        <!-- Links -->
        <div class="td td-links" role="cell">
          <div class="link-counts">
            {#if game.links.base.length > 0}<span class="lc base">B</span>{/if}
            {#if game.links.update.length > 0}<span class="lc update">U</span>{/if}
            {#if game.links.dlc.length > 0}<span class="lc dlc">D</span>{/if}
            {#if game.links.viet_hoa.length > 0}<span class="lc vh">VH</span>{/if}
          </div>
        </div>
      </div>
    {/each}

    {#if store.filteredGames.length === 0}
      <div class="no-results">Không tìm thấy game nào phù hợp</div>
    {/if}
  </div>
</div>

<style>
  /* ── Container ── */
  .table-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: auto;
    font-size: 13px;
    display: flex;
    flex-direction: column;
  }

  /* ── Header ── */
  .table-header {
    display: grid;
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border);
  }
  .th {
    padding: 10px 12px;
    color: var(--text-secondary);
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }
  .th-check {
    padding: 10px 8px 10px 14px;
  }

  /* ── Row ── */
  .game-row {
    display: grid;
    cursor: pointer;
    transition: background 0.1s;
    border-bottom: 1px solid rgba(46, 46, 66, 0.5);
    /* content-visibility: skip layout/paint cho row ngoài viewport */
    content-visibility: auto;
    contain-intrinsic-size: auto 52px;
  }
  .game-row:hover { background: var(--bg-hover); }
  .game-row:focus { outline: none; }
  .game-row:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
  .game-row.selected { background: var(--accent-dim); }
  .game-row.selected { border-bottom-color: rgba(228, 0, 15, 0.2); }
  .game-row.checked { background: rgba(91, 156, 246, 0.08); }
  .game-row.checked { border-bottom-color: rgba(91, 156, 246, 0.15); }
  .game-row.checked.selected {
    background: color-mix(in srgb, var(--accent-dim) 60%, rgba(91, 156, 246, 0.1));
  }

  /* ── Cells ── */
  .td {
    padding: 9px 12px;
    display: flex;
    align-items: center;
    overflow: hidden;
  }
  .td-check {
    padding: 9px 8px 9px 14px;
  }
  .td-num {
    color: var(--text-secondary);
    font-size: 12px;
  }
  .td-size {
    white-space: nowrap;
    color: var(--text-secondary);
    font-size: 12px;
  }

  /* ── Custom checkbox ── */
  .row-check {
    appearance: none;
    -webkit-appearance: none;
    width: 15px;
    height: 15px;
    border: 1.5px solid var(--border);
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    cursor: pointer;
    display: block;
    position: relative;
    transition: background 0.12s, border-color 0.12s, box-shadow 0.12s;
    flex-shrink: 0;
  }
  .row-check:hover {
    border-color: var(--blue);
    box-shadow: 0 0 0 3px rgba(91, 156, 246, 0.12);
  }
  .row-check:checked {
    background: var(--blue);
    border-color: var(--blue);
    box-shadow: 0 0 0 3px rgba(91, 156, 246, 0.2);
  }
  .row-check:checked::after {
    content: "";
    position: absolute;
    inset: 0;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2 6l3 3 5-5' stroke='white' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E")
      center/10px no-repeat;
  }
  .row-check:indeterminate {
    background: rgba(91, 156, 246, 0.2);
    border-color: var(--blue);
  }
  .row-check:indeterminate::after {
    content: "";
    position: absolute;
    inset: 0;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M3 6h6' stroke='%235b9cf6' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")
      center/10px no-repeat;
  }

  /* ── Name cell ── */
  .name-cell {
    display: flex;
    align-items: center;
    gap: 10px;
    overflow: hidden;
  }
  :global(.game-thumb) {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    object-fit: cover;
    flex-shrink: 0;
    background: var(--bg-card);
    border: 1px solid var(--border);
  }
  .name-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    overflow: hidden;
  }
  .game-name {
    font-weight: 500;
    color: var(--text-primary);
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .name-tags {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  /* ── Tags ── */
  .tag {
    font-size: 10px;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 4px;
    white-space: nowrap;
  }
  .tag-new {
    background: rgba(0, 200, 100, 0.15);
    color: #00e676;
    border: 1px solid rgba(0, 200, 100, 0.35);
    animation: newPulse 2.5s ease-in-out infinite;
    letter-spacing: 0.5px;
  }
  @keyframes newPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(0, 200, 100, 0); }
    50%       { box-shadow: 0 0 6px 1px rgba(0, 200, 100, 0.35); }
  }
  .tag-fav {
    background: rgba(255, 100, 130, 0.12);
    color: #ff6482;
    border: 1px solid rgba(255, 100, 130, 0.3);
    padding: 1px 5px;
  }
  .tag-note {
    background: rgba(250, 204, 21, 0.1);
    color: #facc15;
    border: 1px solid rgba(250, 204, 21, 0.25);
    padding: 1px 5px;
    cursor: default;
  }
  .tag-viet {
    background: rgba(0, 80, 200, 0.2);
    color: #7ab3ff;
  }
  .tag-id {
    background: rgba(100, 100, 140, 0.15);
    color: var(--text-secondary);
    font-family: monospace;
    font-size: 9px;
  }

  /* ── Genres ── */
  .genres-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    overflow: hidden;
  }
  .genre-chip {
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 4px;
    background: rgba(91, 156, 246, 0.1);
    color: var(--blue);
    white-space: nowrap;
  }

  /* ── Link badges ── */
  .link-counts {
    display: flex;
    gap: 4px;
    align-items: center;
  }
  .lc {
    font-size: 10px;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 3px;
  }
  .lc.base   { background: rgba(0, 200, 117, 0.15); color: var(--green); }
  .lc.update { background: rgba(91, 156, 246, 0.15); color: var(--blue); }
  .lc.dlc    { background: rgba(245, 197, 24, 0.15); color: var(--yellow); }
  .lc.vh     { background: rgba(0, 80, 200, 0.15); color: #7ab3ff; }

  /* ── Empty state ── */
  .no-results {
    padding: 40px;
    text-align: center;
    color: var(--text-secondary);
  }
</style>
