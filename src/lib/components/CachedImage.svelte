<script lang="ts">
  import { getCachedImageSrc } from "$lib/imageCache";
  import type { Game } from "$lib/types";

  interface Props {
    game: Game;
    class?: string;
    alt?: string;
    loading?: "lazy" | "eager";
  }

  let { game, class: className = "", alt = "", loading = "lazy" }: Props = $props();

  // Resolved src — bắt đầu là null (hiện placeholder), cập nhật khi resolve xong
  let src = $state<string | null>(null);
  let failed = $state(false);

  // Mỗi khi game thay đổi, resolve lại ảnh
  $effect(() => {
    src = null;
    failed = false;
    const currentGame = game; // snapshot để tránh stale closure

    getCachedImageSrc(currentGame).then((resolved) => {
      // Chỉ cập nhật nếu vẫn là game này (tránh race condition)
      if (currentGame === game) {
        src = resolved;
      }
    });
  });
</script>

{#if src && !failed}
  {#key src}
    <img
      {src}
      {alt}
      {loading}
      class={className}
      onerror={() => { failed = true; }}
    />
  {/key}
{/if}
