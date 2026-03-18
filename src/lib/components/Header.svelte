<script lang="ts">
  import { onMount } from "svelte";
  import { store } from "$lib/stores/gameStore.svelte";
  import { updateStore } from "$lib/stores/updateStore.svelte";
  import { GITHUB_RELEASES_URL } from "$lib/constants";
  import { IS_BROWSER } from "$lib/environment";

  onMount(() => {
    // Kiểm tra cập nhật sau 2 giây để không block load màn hình đầu
    const timer = setTimeout(() => {
      updateStore.checkForUpdate();
    }, 2000);
    return () => clearTimeout(timer);
  });
</script>

<header class="header">
  <div class="header-left">
    <h1 class="app-title">Switch Games Manager</h1>
  </div>

  <div class="header-right">
    {#if store.allGames.length > 0}
      <span class="game-count">{store.filteredGames.length} / {store.allGames.length} games</span>
    {/if}

    {#if store.newGameCount > 0}
      <span class="new-badge" title="{store.newGameCount} game mới kể từ lần cập nhật trước">
        ✦ {store.newGameCount} mới
      </span>
    {/if}

    {#if updateStore.hasUpdate}
      <a
        class="update-badge"
        href={updateStore.releaseUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Bản mới: v{updateStore.latestVersion} — Click để tải về"
      >
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2v12M6 10l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M4 20h16" stroke-linecap="round"/>
        </svg>
        v{updateStore.latestVersion} có sẵn
        <button
          class="dismiss-btn"
          onclick={(e) => { e.preventDefault(); updateStore.dismiss(); }}
          title="Bỏ qua"
          aria-label="Bỏ qua thông báo cập nhật"
        >✕</button>
      </a>
    {/if}

    {#if IS_BROWSER}
      <a
        class="btn-download"
        href={GITHUB_RELEASES_URL}
        target="_blank"
        rel="noopener noreferrer"
        title="Tải ứng dụng desktop"
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2v12M6 10l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M4 20h16" stroke-linecap="round"/>
        </svg>
        Tải app
      </a>
    {/if}

    <button class="btn-refresh" onclick={store.fetchGames} disabled={store.isLoading} title="Làm mới dữ liệu">
      {#if store.isLoading}
        <span class="spinner"></span>
      {:else}
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
          <path d="M23 4v6h-6M1 20v-6h6" />
          <path d="M3.51 9a9 9 0 0114.38-3.36L23 10M1 14l5.12 4.36A9 9 0 0020.49 15" />
        </svg>
      {/if}
      {store.isLoading ? "Đang tải..." : "Làm mới"}
    </button>
  </div>
</header>

<style lang="scss">
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    height: 56px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
    gap: 16px;
  }

  .header-left { display: flex; align-items: center; gap: 12px; }
  .header-right { display: flex; align-items: center; gap: 12px; }
  .app-title { font-size: 16px; font-weight: 700; color: var(--text-primary); white-space: nowrap; }
  .game-count { font-size: 12px; color: var(--text-secondary); white-space: nowrap; }

  .new-badge {
    font-size: 11px;
    font-weight: 700;
    color: var(--new);
    background: var(--new-dim);
    border: 1px solid var(--new-border);
    border-radius: 20px;
    padding: 3px 10px;
    white-space: nowrap;
    animation: badgePulse 2.5s ease-in-out infinite;
  }

  @keyframes badgePulse {
    0%, 100% { box-shadow: 0 0 0 0 transparent; }
    50%       { box-shadow: 0 0 8px 2px var(--new-border); }
  }

  // ── Update badge ────────────────────────────────────────────────────────────
  .update-badge {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 700;
    color: var(--warn);
    background: var(--warn-dim);
    border: 1px solid var(--warn-border);
    border-radius: 20px;
    padding: 3px 10px 3px 8px;
    white-space: nowrap;
    text-decoration: none;
    transition: background 0.15s, border-color 0.15s;
    animation: updatePulse 3s ease-in-out infinite;

    &:hover {
      background: var(--warn-dim-md);
      border-color: var(--warn-border-md);
    }
  }

  @keyframes updatePulse {
    0%, 100% { box-shadow: 0 0 0 0 transparent; }
    50%       { box-shadow: 0 0 8px 2px var(--warn-border); }
  }

  .dismiss-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    margin-left: 2px;
    padding: 0;
    background: transparent;
    border: none;
    color: var(--warn-border-md);
    font-size: 10px;
    cursor: pointer;
    border-radius: 50%;
    transition: color 0.15s, background 0.15s;
    line-height: 1;

    &:hover {
      color: var(--warn);
      background: var(--warn-dim-md);
    }
  }

  // ── Download button (web only) ───────────────────────────────────────────────
  .btn-download {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    background: var(--accent);
    color: var(--text-primary);
    border: 1px solid transparent;
    border-radius: 8px;
    font-weight: 600;
    white-space: nowrap;
    font-size: 13px;
    text-decoration: none;
    transition: opacity 0.15s, box-shadow 0.15s;

    &:hover {
      opacity: 0.88;
      box-shadow: 0 0 8px var(--accent-border-md);
    }
  }

  .btn-refresh {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    background: var(--bg-primary);
    color: var(--text-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-weight: 600;
    white-space: nowrap;
    font-size: 13px;
    transition: background 0.15s, color 0.15s, border-color 0.15s;

    &:hover:not(:disabled) {
      background: var(--bg-secondary);
      color: var(--text-primary);
      border-color: var(--accent);
    }

    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid var(--surface-lg);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }

  @keyframes spin { to { transform: rotate(360deg); } }
</style>

