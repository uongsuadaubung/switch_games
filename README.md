# Switch Games Manager

Desktop app quản lý thư viện game Nintendo Switch — dữ liệu tự động đồng bộ từ GitHub, có cache offline.

Được xây dựng bằng [Tauri](https://tauri.app) + [SvelteKit](https://kit.svelte.dev) + Rust.

---

## Tính năng

- Xem danh sách game với thumbnail, thể loại, kích thước và links tải
- Tìm kiếm, lọc, ẩn/hiện game, đánh dấu game mới
- Xem review YouTube trực tiếp trong app
- Cache dữ liệu và ảnh cục bộ, hoạt động offline

---

## Screenshots

![Danh sách game](screenshot/Screenshot%202026-03-16%20125856.png)
*Danh sách toàn bộ 632 game với thumbnail, thể loại và links tải*

![Filter Việt Hóa + Links panel](screenshot/Screenshot%202026-03-16%20130021.png)
*Lọc theo Việt Hóa và xem chi tiết links tải của từng game*

![Tìm kiếm](screenshot/Screenshot%202026-03-16%20130047.png)
*Tìm kiếm nhanh theo tên game*

![Filter kết hợp nhiều điều kiện](screenshot/Screenshot%202026-03-16%20130224.png)
*Kết hợp nhiều bộ lọc: thể loại Kinh dị + Việt Hóa*

---

## Nguồn dữ liệu

Dữ liệu game lấy từ repo: [uongsuadaubung/switch_games_data](https://github.com/uongsuadaubung/switch_games_data)

```
data/version.json  — hash phiên bản hiện tại
data/games.json    — danh sách toàn bộ game
```

---

## Yêu cầu để build

| Công cụ | Phiên bản |
|---------|-----------|
| [Node.js](https://nodejs.org) | ≥ 18 |
| [Rust](https://rustup.rs) | stable |
| [Tauri CLI](https://tauri.app/start/prerequisites/) | v2 |

> **Windows**: Cần cài thêm [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) hoặc Visual Studio với workload "Desktop development with C++".

---

## Build & chạy

```bash
# Cài dependencies
npm install

# Chạy dev mode (hot-reload)
npm run tauri dev

# Build production
npm run tauri build
# → file .exe xuất hiện tại src-tauri/target/release/
```

---

## Cấu trúc project

```
switch_games/
├── src/                    # SvelteKit frontend
│   ├── lib/
│   │   ├── components/     # UI components (GameTable, FilterBar, LinksPanel, ...)
│   │   ├── stores/         # gameStore.svelte.ts — toàn bộ state & logic
│   │   ├── imageCache.ts   # Cache ảnh 2 lớp (memory + disk)
│   │   └── types.ts        # TypeScript interfaces
│   └── routes/
│       └── +page.svelte    # Entry point
├── src-tauri/              # Tauri backend (Rust)
│   ├── src/
│   │   ├── commands.rs     # Tauri commands: cache đọc/ghi, mở URL, nén ảnh
│   │   └── lib.rs
│   └── tauri.conf.json
└── static/                 # Assets tĩnh
```

---

## ⚠️ Cảnh báo Windows SmartScreen

Vì app chưa có chứng chỉ ký số, Windows sẽ hiện cảnh báo khi mở lần đầu. Đây là bình thường — chỉ cần bỏ qua:

**Bước 1:** Click **"More info"**

![SmartScreen bước 1](screenshot/Screenshot%202026-03-16%20141356.png)

**Bước 2:** Click **"Run anyway"**

![SmartScreen bước 2](screenshot/Screenshot%202026-03-16%20141503.png)

---

## License

[MIT](LICENSE)
