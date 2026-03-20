<script lang="ts">
  import { store } from "$lib/stores/gameStore.svelte";
  import type { GameLink } from "$lib/types";

  /** Trả về emoji + CSS class dựa trên nội dung label */
  function linkMeta(link: GameLink): { emoji: string; cls: string } {
    const l = link.label.toLowerCase();
    if (l.includes("việt hóa") || l.includes("viet hoa"))
      return { emoji: "🇻🇳", cls: "link-vh" };
    if (l.includes("dlc") || l.includes("expansion") || l.includes("season"))
      return { emoji: "🎁", cls: "link-dlc" };
    if (
      l.includes("update") ||
      l.includes("cập nhật") ||
      l.includes("cap nhat")
    )
      return { emoji: "🔄", cls: "link-update" };
    if (l.includes("base")) return { emoji: "📁", cls: "link-base" };
    if (l.includes("dự phòng") || l.includes("du phong"))
      return { emoji: "🔗", cls: "link-backup" };
    return { emoji: "📎", cls: "link-other" };
  }

  // Draft note cục bộ — chỉ gửi lên store khi blur để tránh cache write từng phím
  let noteDraft = $state("");
  $effect(() => {
    // Đồng bộ draft khi đổi game được chọn
    noteDraft = store.selectedGame?.note ?? "";
  });
</script>

{#if store.selectedGame}
  {@const game = store.selectedGame}
  <div class="links-panel">
    <div class="panel-header">
      <div class="panel-title">
        <span>{game.name}</span>
        {#if game.note}
          <span class="note-badge" title={game.note}>📝</span>
        {/if}
      </div>
      <button class="close-btn" onclick={store.closePanel}>✕</button>
    </div>

    {#if game.image_url}
      <div class="panel-image">
        <img src={game.image_url} alt={game.name} />
      </div>
    {/if}

    <div class="panel-meta">
      <span>📦 {game.size}</span>
      {#if game.game_id}<span>🆔 {game.game_id}</span>{/if}
      {#if game.genres.length > 0}<span>🎯 {game.genres.join(", ")}</span>{/if}
      {#if game.required_firmware}<span class="firmware-badge"
          >⚙️ Firmware {game.required_firmware}</span
        >{/if}
    </div>

    <div class="panel-actions">
      <button class="btn-open-all" onclick={() => store.openAllLinks(game)}>
        🚀 Mở tất cả links
      </button>
      {#if game.review_url}
        <button
          class="btn-review"
          class:active={store.showYoutube}
          onclick={() => (store.showYoutube = !store.showYoutube)}
        >
          {store.showYoutube ? "✕ Đóng Review" : "▶ Xem Review"}
        </button>
      {/if}
      <button
        class="btn-hide"
        class:active={game.is_hidden}
        onclick={() => {
          store.toggleHide(game);
          if (!game.is_hidden) store.closePanel(); // is_hidden sẽ thành true sau toggle
        }}
        title={game.is_hidden ? "Bỏ ẩn game này" : "Ẩn game này"}
      >
        {game.is_hidden ? "👁 Bỏ ẩn" : "🚫 Ẩn"}
      </button>
      <button
        class="btn-favorite"
        class:active={game.is_favorite}
        onclick={() => store.toggleFavorite(game)}
        title={game.is_favorite ? "Bỏ yêu thích" : "Đánh dấu yêu thích"}
      >
        {game.is_favorite ? "❤️ Yêu thích" : "🤍 Yêu thích"}
      </button>
    </div>

    <!-- ── Ghi chú cá nhân ── -->
    <div class="note-section">
      <label class="note-label" for="game-note">📝 Ghi chú</label>
      <textarea
        id="game-note"
        class="note-input"
        rows="3"
        placeholder="Đã chơi xong, chờ update, cần firmware..."
        bind:value={noteDraft}
        onblur={() => store.updateNote(game, noteDraft)}
      ></textarea>
    </div>

    {#if store.showYoutube && game.review_url}
      {@const embedUrl = store.getYoutubeEmbedUrl(game.review_url)}
      {#if embedUrl}
        <div class="yt-embed-wrap">
          <iframe
            src={embedUrl}
            class="yt-embed"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            title="Review {game.name}"
          ></iframe>
        </div>
      {/if}
    {/if}

    <div class="links-list">
      {#each game.links as link}
        {@const meta = linkMeta(link)}
        <div class="link-item">
          <div class="link-info">
            <span class="link-label {meta.cls}">{meta.emoji} {link.label}</span>
            {#if link.file_name}
              <span class="filename">{link.file_name}</span>
            {/if}
          </div>
          <div class="link-actions">
            <button
              class="btn-open-link"
              onclick={() => store.openUrl(link.url)}>Mở</button
            >
          </div>
        </div>
      {/each}

      {#if game.links.length === 0}
        <div class="no-links">Chưa có link tải</div>
      {/if}
    </div>
  </div>
{/if}

<style lang="scss">
  .links-panel {
    flex: 0 0 38%;
    background: var(--bg-secondary);
    border-left: 1px solid var(--border);
    overflow-y: auto;
  }

  .panel-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    padding: 14px 16px 10px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .panel-title {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    min-width: 0;

    > span:first-child {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.3;
      word-break: break-word;
    }
  }

  .note-badge {
    font-size: 14px;
    flex-shrink: 0;
    opacity: 0.8;
    cursor: default;
  }

  .close-btn {
    background: var(--bg-card);
    border: 1px solid var(--border);
    color: var(--text-secondary);
    border-radius: 6px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    flex-shrink: 0;

    &:hover {
      border-color: var(--accent);
      color: var(--accent);
    }
  }

  .panel-image {
    padding: 0 16px;
    flex-shrink: 0;
    border-bottom: 1px solid var(--border);

    img {
      width: 100%;
      max-height: 160px;
      object-fit: contain;
      border-radius: 8px;
      display: block;
      margin: 10px 0;
    }
  }

  .panel-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    padding: 8px 16px;
    font-size: 12px;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .firmware-badge {
    background: var(--amber-dim);
    color: var(--amber);
    padding: 1px 8px;
    border-radius: 4px;
    font-weight: 600;
    font-size: 11px;
    border: 1px solid var(--amber-border);
  }

  .panel-actions {
    display: flex;
    gap: 8px;
    padding: 10px 16px;
    flex-shrink: 0;
    border-bottom: 1px solid var(--border);
  }

  .btn-open-all {
    flex: 1;
    background: var(--accent);
    color: white;
    border-radius: 8px;
    padding: 8px 14px;
    font-weight: 600;
    font-size: 13px;

    &:hover {
      background: var(--accent-hover);
    }
  }

  .btn-review {
    background: var(--video-dim);
    border: 1px solid var(--video-border);
    color: var(--video);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;

    &:hover {
      background: var(--video-dim-md);
    }
    &.active {
      background: var(--video-dim-md);
      border-color: var(--video-border-md);
      color: var(--video);
    }
  }

  .btn-hide {
    background: var(--muted-dim);
    border: 1px solid var(--muted-border);
    color: var(--text-secondary);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;
    transition:
      background 0.15s,
      border-color 0.15s;

    &:hover {
      background: var(--muted-dim-md);
      color: var(--text-primary);
    }
    &.active {
      background: var(--amber-dim);
      border-color: var(--amber-border);
      color: var(--amber);
    }
  }

  .btn-favorite {
    background: var(--fav-dim);
    border: 1px solid var(--fav-border);
    color: var(--fav);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;
    transition:
      background 0.15s,
      border-color 0.15s;

    &:hover {
      background: var(--fav-dim-md);
      color: var(--fav);
    }
    &.active {
      background: var(--fav-dim-md);
      border-color: var(--fav);
      color: var(--fav);
    }
  }

  .note-section {
    padding: 10px 16px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .note-label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .note-input {
    width: 100%;
    box-sizing: border-box;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-primary);
    font-family: inherit;
    font-size: 12px;
    line-height: 1.5;
    padding: 8px 10px;
    resize: vertical;
    min-height: 60px;
    transition: border-color 0.15s;

    &:focus {
      border-color: var(--accent);
      outline: none;
    }
    &::placeholder {
      color: var(--text-secondary);
      opacity: 0.6;
    }
  }

  .yt-embed-wrap {
    flex-shrink: 0;
    padding: 0 16px 12px;
    border-bottom: 1px solid var(--border);
  }

  .yt-embed {
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: 8px;
    border: 1px solid var(--video-dim);
    background: var(--bg-primary);
    display: block;
  }

  .links-list {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;

    .link-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      transition: border-color 0.15s;

      &:hover {
        border-color: var(--accent-border-md);
      }

      .link-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .link-label {
        font-size: 12px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 4px;

        &.link-base {
          color: var(--green);
        }
        &.link-update {
          color: var(--blue);
        }
        &.link-dlc {
          color: var(--yellow);
        }
        &.link-vh {
          color: var(--viet);
        }
        &.link-backup {
          color: var(--amber);
        }
        &.link-other {
          color: var(--text-secondary);
        }
      }

      .filename {
        color: var(--text-secondary);
        word-break: break-all;
        font-family: monospace;
        font-size: 10px;
        opacity: 0.7;
      }

      .link-actions {
        display: flex;
        gap: 4px;
        flex-shrink: 0;
      }

      .btn-open-link {
        flex-shrink: 0;
        font-size: 11px;
        padding: 3px 10px;
        background: var(--accent-dim);
        border: 1px solid var(--accent-border-md);
        border-radius: 6px;
        color: var(--accent);
        font-weight: 600;

        &:hover {
          background: var(--accent);
          color: white;
        }
      }
    }
  }

  .no-links {
    padding: 24px;
    text-align: center;
    color: var(--text-secondary);
    font-size: 13px;
    opacity: 0.6;
  }
</style>
