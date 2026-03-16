<script lang="ts">
  import { store } from "$lib/stores/gameStore.svelte";
  import CachedImage from "$lib/components/CachedImage.svelte";
  import type { GameLinks } from "$lib/types";

  // Config cho các section link — thêm loại mới tại đây
  const LINK_SECTIONS: { key: keyof GameLinks; label: string; cls: string }[] = [
    { key: "base",     label: "📁 Base Game", cls: "base-label"   },
    { key: "update",   label: "🔄 Update",    cls: "update-label" },
    { key: "dlc",      label: "🎁 DLC",       cls: "dlc-label"    },
    { key: "viet_hoa", label: "🇻🇳 Việt hóa", cls: "vh-label"    },
  ];
</script>

{#if store.selectedGame}
  {@const game = store.selectedGame}
  <div class="links-panel">
    <div class="panel-header">
      <div class="panel-title">
        <span>{game.name}</span>
      </div>
      <button class="close-btn" onclick={store.closePanel}>✕</button>
    </div>

    {#if game.image_url}
      <div class="panel-image">
        <CachedImage {game} alt={game.name} />
      </div>
    {/if}

    <div class="panel-meta">
      <span>📦 {game.size}</span>
      {#if game.game_id}<span>🆔 {game.game_id}</span>{/if}
      {#if game.genres.length > 0}<span>🎯 {game.genres.join(", ")}</span>{/if}
      {#if game.links.required_firmware}<span>⚙️ Firmware {game.links.required_firmware}</span>{/if}
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

    <div class="links-sections">
      {#each LINK_SECTIONS as section}
        {@const links = game.links[section.key]}
        {#if Array.isArray(links) && links.length > 0}
          <div class="link-section">
            <div class="section-header">
              <span class="section-label {section.cls}">{section.label}</span>
            </div>
            {#each links as link}
              <div class="link-item">
                <span class="filename">{link.filename}</span>
                <button class="btn-open-link" onclick={() => store.openUrl(link.url || link.filename)}>Mở</button>
              </div>
            {/each}
          </div>
        {/if}
      {/each}
    </div>
  </div>
{/if}


<style>
  .links-panel { flex: 0 0 38%; background: var(--bg-secondary); border-left: 1px solid var(--border); overflow-y: auto; }
  .panel-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 8px; padding: 14px 16px 10px; border-bottom: 1px solid var(--border); flex-shrink: 0;
  }
  .panel-title { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; }
  .panel-title > span:first-child { font-size: 15px; font-weight: 700; color: var(--text-primary); line-height: 1.3; word-break: break-word; }
  .close-btn {
    background: var(--bg-card); border: 1px solid var(--border); color: var(--text-secondary);
    border-radius: 6px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0;
  }
  .close-btn:hover { border-color: var(--accent); color: var(--accent); }

  .panel-image { padding: 0 16px 0; flex-shrink: 0; border-bottom: 1px solid var(--border); }
  .panel-image :global(img) { width: 100%; max-height: 160px; object-fit: contain; border-radius: 8px; display: block; margin: 10px 0; }

  .panel-meta { display: flex; flex-wrap: wrap; gap: 12px; padding: 8px 16px; font-size: 12px; color: var(--text-secondary); border-bottom: 1px solid var(--border); flex-shrink: 0; }

  .panel-actions { display: flex; gap: 8px; padding: 10px 16px; flex-shrink: 0; border-bottom: 1px solid var(--border); }
  .btn-open-all { flex: 1; background: var(--accent); color: white; border-radius: 8px; padding: 8px 14px; font-weight: 600; font-size: 13px; }
  .btn-open-all:hover { background: var(--accent-hover); }
  .btn-review { background: rgba(255, 0, 0, 0.1); border: 1px solid rgba(255, 0, 0, 0.3); color: #ff6b6b; border-radius: 8px; padding: 8px 12px; font-size: 13px; font-weight: 600; }
  .btn-review:hover { background: rgba(255, 0, 0, 0.2); }
  .btn-review.active { background: rgba(255, 0, 0, 0.25); border-color: rgba(255, 0, 0, 0.6); color: #ff4444; }
  .btn-hide { background: rgba(140, 140, 160, 0.1); border: 1px solid rgba(140, 140, 160, 0.25); color: var(--text-secondary); border-radius: 8px; padding: 8px 12px; font-size: 13px; font-weight: 600; transition: background 0.15s, border-color 0.15s; }
  .btn-hide:hover { background: rgba(140, 140, 160, 0.2); color: var(--text-primary); }
  .btn-hide.active { background: rgba(245, 158, 11, 0.12); border-color: rgba(245, 158, 11, 0.4); color: #f59e0b; }

  .yt-embed-wrap { flex-shrink: 0; padding: 0 16px 12px; border-bottom: 1px solid var(--border); }
  .yt-embed { width: 100%; aspect-ratio: 16 / 9; border-radius: 8px; border: 1px solid rgba(255, 0, 0, 0.2); background: #000; display: block; }

  .links-sections { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
  .link-section { background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
  .section-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid var(--border); background: rgba(255, 255, 255, 0.02); }
  .section-label { font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 5px; }
  .base-label { color: var(--green); }
  .update-label { color: var(--blue); }
  .dlc-label { color: var(--yellow); }
  .vh-label { color: #7ab3ff; }

  .link-item { display: flex; align-items: center; gap: 8px; padding: 7px 12px; border-bottom: 1px solid rgba(46, 46, 66, 0.4); }
  .link-item:last-child { border-bottom: none; }
  .filename { flex: 1; color: var(--text-secondary); word-break: break-all; font-family: monospace; font-size: 11px; }
  .btn-open-link { flex-shrink: 0; font-size: 11px; padding: 3px 10px; background: var(--accent-dim); border: 1px solid rgba(228, 0, 15, 0.3); border-radius: 5px; color: var(--accent); font-weight: 600; }
  .btn-open-link:hover { background: var(--accent); color: white; }
</style>
