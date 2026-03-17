/**
 * true khi đang chạy bên trong Tauri webview (cả dev lẫn production).
 * false khi mở thẳng trên browser (vite devserver không qua Tauri).
 */
export const IS_TAURI = "__TAURI_INTERNALS__" in window;

/**
 * true khi Vite build ở chế độ development (npm run dev / tauri dev).
 * false ở production build.
 */
export const IS_DEV = import.meta.env.DEV;

/** Tauri production build */
export const IS_TAURI_PROD = IS_TAURI && !IS_DEV;

/** Tauri dev mode (npm run tauri dev) */
export const IS_TAURI_DEV = IS_TAURI && IS_DEV;

/** Browser thuần — mở vite devserver trực tiếp, không qua Tauri */
export const IS_BROWSER = !IS_TAURI;
