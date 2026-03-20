export interface GameLink {
  label: string;
  file_name: string;
  url: string;
}

/**
 * User metadata — chỉ chứa các field do app quản lý.
 * Đây là dữ liệu được cache (nhẹ), phần còn lại luôn fetch từ API.
 */
export interface UserGameMeta {
  is_hidden?: boolean;
  is_favorite?: boolean;
  note?: string;
}

/** Map game_id → UserGameMeta, dùng cho cache */
export type UserMetaMap = Record<string, UserGameMeta>;

export interface Game {
  name: string;
  game_id: string;
  is_viet_hoa: boolean;
  /** Game mới xuất hiện trong data JSON */
  is_new?: boolean;
  /** User đã ẩn game này */
  is_hidden?: boolean;
  /** User đã đánh dấu yêu thích */
  is_favorite?: boolean;
  /** Ghi chú cá nhân của user */
  note?: string;
  image_url: string;
  size: string;
  genres: string[];
  review_url: string;
  links: GameLink[];
  required_firmware: string;
}
