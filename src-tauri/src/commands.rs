use tauri::Manager;
use tauri_plugin_opener::OpenerExt;
use std::fs;
use std::path::PathBuf;

const USER_META_FILE: &str = "user_meta.json";
const HASH_FILE:      &str = "version_hash.txt";

/// Trả về app data dir (tạo nếu chưa có)
fn get_app_data_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Không lấy được app data dir: {e}"))?;
    if !dir.exists() {
        fs::create_dir_all(&dir)
            .map_err(|e| format!("Không tạo được app data dir: {e}"))?;
    }
    Ok(dir)
}

// ── URL opener ────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn open_url(app: tauri::AppHandle, url: String) -> Result<(), String> {
    app.opener()
        .open_url(&url, None::<&str>)
        .map_err(|e| format!("Cannot open URL: {e}"))
}

#[tauri::command]
pub async fn open_urls(app: tauri::AppHandle, urls: Vec<String>) -> Result<(), String> {
    for url in urls {
        if !url.is_empty() {
            if let Err(e) = app.opener().open_url(&url, None::<&str>) {
                eprintln!("Không mở được URL {url}: {e}");
            }
        }
    }
    Ok(())
}

// ── Cache: đọc/ghi user metadata JSON ───────────────────────────────────────

/// Đọc user metadata cache từ disk, trả về JSON string hoặc null nếu chưa có
#[tauri::command]
pub async fn read_user_meta(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let path = get_app_data_dir(&app)?.join(USER_META_FILE);
    if !path.exists() {
        return Ok(None);
    }
    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Không đọc được user meta cache: {e}"))?;
    Ok(Some(content))
}

/// Ghi user metadata JSON string ra cache file trên disk
#[tauri::command]
pub async fn write_user_meta(app: tauri::AppHandle, data: String) -> Result<(), String> {
    let path = get_app_data_dir(&app)?.join(USER_META_FILE);
    fs::write(&path, data.as_bytes())
        .map_err(|e| format!("Không ghi được user meta cache: {e}"))?;
    Ok(())
}

// ── Cache: đọc/ghi version hash ──────────────────────────────────────────────

/// Đọc version hash đã lưu lần trước, None nếu chưa có
#[tauri::command]
pub async fn read_version_hash(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let path = get_app_data_dir(&app)?.join(HASH_FILE);
    if !path.exists() {
        return Ok(None);
    }
    let hash = fs::read_to_string(&path)
        .map_err(|e| format!("Không đọc được hash: {e}"))?;
    Ok(Some(hash.trim().to_string()))
}

/// Ghi version hash mới ra disk
#[tauri::command]
pub async fn write_version_hash(app: tauri::AppHandle, hash: String) -> Result<(), String> {
    let path = get_app_data_dir(&app)?.join(HASH_FILE);
    fs::write(&path, hash.as_bytes())
        .map_err(|e| format!("Không ghi được hash: {e}"))?;
    Ok(())
}

