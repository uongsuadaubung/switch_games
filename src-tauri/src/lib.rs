pub mod commands;

use commands::{
    open_url, open_urls,
    read_user_meta, write_user_meta,
    read_version_hash, write_version_hash,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            open_url,
            open_urls,
            read_user_meta,
            write_user_meta,
            read_version_hash,
            write_version_hash,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
