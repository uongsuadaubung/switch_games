use tauri::Manager;
use tauri_plugin_opener::OpenerExt;
use std::fs;
use std::path::PathBuf;
use std::io::Cursor;
use image::ImageReader;
use image::imageops::FilterType;

const CACHE_FILE: &str = "games.json";
const HASH_FILE:  &str = "version_hash.txt";

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
            let _ = app.opener().open_url(&url, None::<&str>);
        }
    }
    Ok(())
}

// ── Cache: đọc/ghi games JSON ────────────────────────────────────────────────

/// Đọc games cache từ disk, trả về JSON string hoặc null nếu chưa có
#[tauri::command]
pub async fn read_games_cache(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let path = get_app_data_dir(&app)?.join(CACHE_FILE);
    if !path.exists() {
        return Ok(None);
    }
    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Không đọc được cache: {e}"))?;
    Ok(Some(content))
}

/// Ghi games JSON string ra cache file trên disk
#[tauri::command]
pub async fn write_games_cache(app: tauri::AppHandle, data: String) -> Result<(), String> {
    let path = get_app_data_dir(&app)?.join(CACHE_FILE);
    fs::write(&path, data.as_bytes())
        .map_err(|e| format!("Không ghi được cache: {e}"))?;
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

// ── Cache: ảnh game ───────────────────────────────────────────────────────────

fn get_images_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = get_app_data_dir(app)?.join("images");
    if !dir.exists() {
        fs::create_dir_all(&dir)
            .map_err(|e| format!("Không tạo được images dir: {e}"))?;
    }
    Ok(dir)
}

/// Kiểm tra ảnh đã cache chưa. Trả về path tuyệt đối nếu có, None nếu chưa.
#[tauri::command]
pub async fn check_image_cache(
    app: tauri::AppHandle,
    key: String,
) -> Result<Option<String>, String> {
    let path = get_images_dir(&app)?.join(format!("{key}.jpg"));
    if path.exists() {
        Ok(Some(path.to_string_lossy().to_string()))
    } else {
        Ok(None)
    }
}

/// Nhận bytes ảnh từ frontend, nén + resize rồi ghi ra disk, trả về path tuyệt đối.
/// - Resize về max 400px (giữ tỷ lệ, dùng Lanczos3)
/// - Re-encode sang JPEG quality 75
/// - Nếu decode lỗi (format lạ) thì fallback ghi raw
#[tauri::command]
pub async fn save_image_cache(
    app: tauri::AppHandle,
    key: String,
    data: Vec<u8>,
) -> Result<String, String> {
    let path = get_images_dir(&app)?.join(format!("{key}.jpg"));

    // Thử decode + nén
    let compressed = compress_image(&data);
    let bytes_to_write = compressed.as_deref().unwrap_or(&data);

    fs::write(&path, bytes_to_write)
        .map_err(|e| format!("Không ghi được ảnh: {e}"))?;
    Ok(path.to_string_lossy().to_string())
}

/// Decode ảnh từ bytes, resize về max 400px, re-encode sang JPEG quality 75.
/// Trả về None nếu có lỗi (caller sẽ fallback về raw bytes).
fn compress_image(data: &[u8]) -> Option<Vec<u8>> {
    const MAX_SIZE: u32 = 400;
    const JPEG_QUALITY: u8 = 75;

    let img = ImageReader::new(Cursor::new(data))
        .with_guessed_format()
        .ok()?
        .decode()
        .ok()?;

    // Chỉ resize nếu ảnh lớn hơn MAX_SIZE (giữ tỷ lệ, Lanczos3)
    let img = if img.width() > MAX_SIZE || img.height() > MAX_SIZE {
        img.resize(MAX_SIZE, MAX_SIZE, FilterType::Lanczos3)
    } else {
        img
    };

    // Encode JPEG với quality tuỳ chỉnh (mặc định crate là 80)
    let rgb = img.to_rgb8();
    let mut out: Vec<u8> = Vec::new();
    let mut enc = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut out, JPEG_QUALITY);
    enc.encode_image(&rgb).ok()?;

    Some(out)
}
