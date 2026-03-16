<script lang="ts">
  import { onMount } from "svelte";
  import { store } from "$lib/stores/gameStore.svelte";
  import Header from "$lib/components/Header.svelte";
  import LoadingScreen from "$lib/components/LoadingScreen.svelte";
  import FilterBar from "$lib/components/FilterBar.svelte";
  import GameTable from "$lib/components/GameTable.svelte";
  import LinksPanel from "$lib/components/LinksPanel.svelte";

  onMount(store.fetchGames);
</script>

<div class="app-shell">
  <Header />

  <div class="content-area">
    {#if store.isLoading && store.allGames.length === 0}
      <LoadingScreen />
    {:else if store.loadError && store.allGames.length === 0}
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <p class="error-title">Không thể tải dữ liệu</p>
        <p class="error-msg">{store.loadError}</p>
        <button class="retry-btn" onclick={store.fetchGames}>Thử lại</button>
      </div>
    {:else}
      <FilterBar />
      <div class="table-panel-layout" class:has-panel={store.showLinksPanel}>
        <GameTable />
        <LinksPanel />
      </div>
    {/if}
  </div>
</div>

<style>
  .app-shell {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--bg-primary);
    overflow: hidden;
  }
  .content-area {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .table-panel-layout {
    flex: 1;
    display: flex;
    overflow: hidden;
    min-height: 0;
  }
  .table-panel-layout.has-panel :global(.table-container) {
    flex: 0 0 auto;
    width: 62%;
  }

  /* Error state */
  .error-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    animation: fadeIn 0.3s ease;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .error-icon { font-size: 40px; }
  .error-title {
    font-size: 16px; font-weight: 600;
    color: var(--text-primary); margin: 0;
  }
  .error-msg {
    font-size: 12px; color: var(--text-secondary);
    margin: 0; max-width: 400px; text-align: center;
  }
  .retry-btn {
    margin-top: 8px;
    padding: 8px 20px;
    background: var(--accent);
    color: white;
    border-radius: 8px;
    font-weight: 600;
    font-size: 13px;
    transition: opacity 0.15s;
  }
  .retry-btn:hover { opacity: 0.85; }
</style>
