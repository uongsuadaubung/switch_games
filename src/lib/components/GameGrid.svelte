<script lang="ts">
  import { store } from "$lib/stores/gameStore.svelte";

  // ── Keyboard navigation ─────────────────────────────────────────────
  let gridEl = $state<HTMLDivElement | null>(null);

  // Khi selectedGame thay đổi, scroll card đó vào view sau khi DOM reflow xong
  // (dùng rAF vì LinksPanel mở → grid co lại → cần chờ layout xong mới scroll)
  $effect(() => {
    const game = store.selectedGame;
    if (!game || !gridEl) return;
    const games = store.filteredGames;
    const idx = games.findIndex(
      (g) => g.game_id === game.game_id && g.name === game.name
    );
    if (idx === -1) return;
    requestAnimationFrame(() => {
      const cards = gridEl!.querySelectorAll<HTMLElement>(".game-card");
      cards[idx]?.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  });

  /** Tính số cột thực tế từ computed grid-template-columns */
  function getColumnCount(): number {
    if (!gridEl) return 1;
    const style = window.getComputedStyle(gridEl);
    const cols = style.gridTemplateColumns.split(" ").length;
    return Math.max(1, cols);
  }

  function handleKeydown(e: KeyboardEvent) {
    const arrows = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    if (!arrows.includes(e.key)) return;
    const games = store.filteredGames;
    if (games.length === 0) return;

    e.preventDefault();

    const currentIndex = store.selectedGame
      ? games.findIndex(
          (g) =>
            g.game_id === store.selectedGame!.game_id &&
            g.name === store.selectedGame!.name
        )
      : -1;

    const cols = getColumnCount();
    let nextIndex: number;

    if (currentIndex === -1) {
      nextIndex = 0;
    } else {
      switch (e.key) {
        case "ArrowRight":
          nextIndex = Math.min(currentIndex + 1, games.length - 1);
          break;
        case "ArrowLeft":
          nextIndex = Math.max(currentIndex - 1, 0);
          break;
        case "ArrowDown":
          nextIndex = Math.min(currentIndex + cols, games.length - 1);
          break;
        case "ArrowUp":
          nextIndex = Math.max(currentIndex - cols, 0);
          break;
        default:
          return;
      }
    }

    if (nextIndex === currentIndex) return;
    store.navigateGame(games[nextIndex]);

    // Chuyển DOM focus về container — gỡ outline khỏi card cũ
    (e.currentTarget as HTMLElement).focus({ preventScroll: true });

    // Scroll card vào view
    if (gridEl) {
      const cards = gridEl.querySelectorAll<HTMLElement>(".game-card");
      cards[nextIndex]?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="grid-container"
  tabindex="0"
  role="listbox"
  onkeydown={handleKeydown}
>
  {#if store.filteredGames.length === 0}
    <div class="empty-state">
      <span class="empty-icon">🎮</span>
      <p>Không tìm thấy game nào</p>
    </div>
  {:else}
    <div class="game-grid" bind:this={gridEl}>
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

          <!-- Info -->
          <div class="card-body">
            <p class="card-name">{game.name}</p>
            <div class="card-meta">
              <span class="card-size">📦 {game.size}</span>
            </div>
            {#if game.is_new || game.is_favorite || game.is_hidden || game.is_viet_hoa || game.note}
              <div class="card-status-tags">
                {#if game.is_new}<span class="tag tag-new">✦ MỚI</span>{/if}
                {#if game.is_favorite}<span class="tag tag-fav">❤ Yêu thích</span>{/if}
                {#if game.is_hidden}<span class="tag tag-hidden">Đã ẩn</span>{/if}
                {#if game.is_viet_hoa}<span class="tag tag-viet">Việt Hóa</span>{/if}
                {#if game.note}<span class="tag tag-note" title={game.note}>📝</span>{/if}
              </div>
            {/if}
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
    outline: none;
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
      box-shadow: 0 4px 16px var(--overlay);
      transform: translateY(-2px);
      will-change: transform;

      .card-check { opacity: 1; }
    }

    &.selected {
      border-color: var(--accent);
      box-shadow: 0 0 0 2px var(--accent-border);
    }

    &.checked {
      border-color: var(--accent);
      background: var(--accent-dim-sm);

      .card-check { opacity: 1; }
    }


  }

  // ── Checkbox ───────────────────────────────────────────────────────────────
  .card-check {
    position: absolute;
    top: 7px;
    left: 7px;
    z-index: 2;
    background: var(--overlay);
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
    color: var(--text-primary);
    line-height: 1;
  }

  // ── Image ──────────────────────────────────────────────────────────────────
  .card-image {
    width: 100%;
    aspect-ratio: 16 / 9;
    background: var(--surface-sm);
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

  // ── Tags ───────────────────────────────────────────────────────────────────
  .card-status-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .tag {
    font-size: 10px;
    border-radius: 4px;
    padding: 1px 5px;
    line-height: 1.5;
    font-weight: 700;

    &.tag-new    { background: var(--new-dim-md);   color: var(--new);   border: 1px solid var(--new-border); }
    &.tag-fav    { background: var(--fav-dim-md);   color: var(--fav);   border: 1px solid var(--fav-border); }
    &.tag-note   { background: var(--note-dim);     color: var(--note);  border: 1px solid var(--note-border); cursor: default; }
    &.tag-hidden { background: var(--muted-dim-md); color: var(--muted); border: 1px solid var(--muted-border); }
    &.tag-viet   { background: var(--viet-dim);     color: var(--viet);  border: 1px solid var(--viet-border); }
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

