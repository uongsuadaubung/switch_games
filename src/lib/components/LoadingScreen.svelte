<div class="loading-screen">
  <div class="loading-content">
    <div class="spinner-ring">
      <svg class="spinner-svg" viewBox="0 0 50 50">
        <circle class="track" cx="25" cy="25" r="20" fill="none" stroke-width="4" />
        <circle class="arc"   cx="25" cy="25" r="20" fill="none" stroke-width="4"
          stroke-dasharray="80 200" stroke-linecap="round" />
      </svg>
      <div class="logo-inner">
        <img src="/app-icon.png" alt="" class="loading-icon" />
      </div>
    </div>

    <p class="loading-text">Đang tải danh sách game...</p>
    <p class="loading-sub">Đang kiểm tra phiên bản mới nhất</p>
  </div>
</div>

<style lang="scss">
  .loading-screen {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-primary);

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      animation: fadeIn 0.4s ease;
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .spinner-ring {
    position: relative;
    width: 72px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;

    .spinner-svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      animation: rotate 1.2s linear infinite;
    }

    .track { stroke: var(--border); }

    .arc {
      stroke: var(--accent);
      animation: dash 1.5s ease-in-out infinite;
    }

    .logo-inner {
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 1.5s ease-in-out infinite;

      .loading-icon {
        width: 32px;
        height: 32px;
        border-radius: 7px;
        display: block;
      }
    }
  }

  @keyframes rotate { 100% { transform: rotate(360deg); } }

  @keyframes dash {
    0%   { stroke-dasharray: 10 200; stroke-dashoffset: 0; }
    50%  { stroke-dasharray: 110 200; stroke-dashoffset: -35px; }
    100% { stroke-dasharray: 110 200; stroke-dashoffset: -125px; }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.7; transform: scale(0.92); }
  }

  .loading-text {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .loading-sub {
    font-size: 12px;
    color: var(--text-secondary);
    margin: -12px 0 0;
    animation: blink 1.8s ease-in-out infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 0.5; }
    50%       { opacity: 1; }
  }
</style>


