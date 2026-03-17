<script lang="ts">
  import { store } from "$lib/stores/gameStore.svelte";
</script>

<div class="grid-container">
  {#if store.filteredGames.length === 0}
    <div class="empty-state">
      <span class="empty-icon">🎮</span>
      <p>Không tìm thấy game nào</p>
    </div>
  {:else}
    <div class="game-grid">
      {#each store.filteredGames as game, i ((game.game_id || game.name) + '-' + i)}
        {@const isSelected = store.selectedGame?.game_id === game.game_id && store.selectedGame?.name === game.name}
        {@const isChecked = store.checkedKeys.has(game.game_id || game.name)}
        <div
          class="game-card"
          class:selected={isSelected}
          class:checked={isChecked}
          class:hidden-card={game.is_hidden}
          role="button"
          tabindex="0"
          onclick={() => store.selectGame(game)}
          onkeydown={(e) => e.key === "Enter" && store.selectGame(game)}
        >
          <!-- Checkbox overlay -->
          <div
            class="card-check"
            onclick={(e) => { e.stopPropagation(); store.toggleCheck(game); }}
            onkeydown={(e) => { if (e.key === " ") { e.stopPropagation(); store.toggleCheck(game); }}}
            role="checkbox"
            tabindex="0"
            aria-checked={isChecked}
            aria-label="Chọn {game.name}"
          >
            <span class="check-icon">{isChecked ? "☑" : "☐"}</span>
          </div>

          <!-- Thumbnail -->
          <div class="card-image">
            {#if game.image_url}
              <img src={game.image_url} alt={game.name} loading="lazy" />
            {:else}
              <div class="no-image">🎮</div>
            {/if}
          </div>

          <!-- Tags overlay (top-right) -->
          <div class="card-tags">
            {#if game.is_new}<span class="tag tag-new">✦</span>{/if}
            {#if game.is_favorite}<span class="tag tag-fav">❤</span>{/if}
            {#if game.note}<span class="tag tag-note" title={game.note}>📝</span>{/if}
            {#if game.is_hidden}<span class="tag tag-hidden">🚫</span>{/if}
          </div>

          <!-- Info -->
          <div class="card-body">
            <p class="card-name">{game.name}</p>
            <div class="card-meta">
              <span class="card-size">📦 {game.size}</span>
              {#if game.is_viet_hoa}
                <span class="tag tag-viet">Việt Hóa</span>
              {/if}
            </div>
            {#if game.genres.length > 0}
              <p class="card-genres">{game.genres.slice(0, 2).join(" · ")}{game.genres.length > 2 ? " ···" : ""}</p>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style lang="scss">
  .grid-container {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding: 12px 16px 16px;
  }

  .game-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
  }

  // ── Card ───────────────────────────────────────────────────────────────────
  .game-card {
    position: relative;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
    display: flex;
    flex-direction: column;
    content-visibility: auto;
    contain-intrinsic-size: auto 220px;

    &:hover {
      border-color: var(--accent);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      transform: translateY(-2px);
      will-change: transform;

      .card-check { opacity: 1; }
    }

    &.selected {
      border-color: var(--accent);
      box-shadow: 0 0 0 2px rgba(205, 72, 51, 0.25);
    }

    &.checked {
      border-color: var(--accent);
      background: rgba(205, 72, 51, 0.06);

      .card-check { opacity: 1; }
    }

    &.hidden-card { opacity: 0.45; }
  }

  // ── Checkbox ───────────────────────────────────────────────────────────────
  .card-check {
    position: absolute;
    top: 7px;
    left: 7px;
    z-index: 2;
    background: rgba(0, 0, 0, 0.55);
    border-radius: 5px;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.15s;
  }

  .check-icon {
    font-size: 14px;
    color: #fff;
    line-height: 1;
  }

  // ── Image ──────────────────────────────────────────────────────────────────
  .card-image {
    width: 100%;
    aspect-ratio: 16 / 9;
    background: rgba(255, 255, 255, 0.04);
    overflow: hidden;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  }

  .no-image {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;
    opacity: 0.3;
  }

  // ── Tags overlay ───────────────────────────────────────────────────────────
  .card-tags {
    position: absolute;
    top: 7px;
    right: 7px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    align-items: flex-end;
    z-index: 2;
  }

  .tag {
    font-size: 11px;
    border-radius: 4px;
    padding: 1px 4px;
    line-height: 1.5;
    font-weight: 700;
    backdrop-filter: blur(4px);

    &.tag-new    { background: rgba(0, 200, 100, 0.2);   color: #00e676; border: 1px solid rgba(0,200,100,0.4); }
    &.tag-fav    { background: rgba(255,100,130, 0.2);   color: #ff6482; border: 1px solid rgba(255,100,130,0.4); }
    &.tag-note   { background: rgba(250,204,21, 0.2);    color: #facc15; border: 1px solid rgba(250,204,21,0.35); cursor: default; }
    &.tag-hidden { background: rgba(140,140,160, 0.2);   color: #aaa;    border: 1px solid rgba(140,140,160,0.4); }
    &.tag-viet   { background: rgba(0, 80, 200, 0.25);   color: #7ab3ff; border: 1px solid rgba(0,80,200,0.4); }
  }

  // ── Body ───────────────────────────────────────────────────────────────────
  .card-body {
    padding: 10px 10px 11px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  .card-name {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.35;
    // Clamp to 2 lines
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 2px;
  }

  .card-size {
    font-size: 11px;
    color: var(--text-secondary);
  }

  .card-genres {
    font-size: 10px;
    color: var(--text-secondary);
    margin: 0;
    opacity: 0.7;
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 60px 0;
    color: var(--text-secondary);

    p { margin: 0; font-size: 14px; }
  }

  .empty-icon { font-size: 40px; opacity: 0.4; }
</style>

