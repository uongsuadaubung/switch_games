export interface FileLink {
  filename: string;
  url: string;
}

export interface GameLinks {
  base: FileLink[];
  update: FileLink[];
  dlc: FileLink[];
  viet_hoa: FileLink[];
  required_firmware: string;
}

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
  sheets: string[];
  links: GameLinks;
}
