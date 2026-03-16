export interface FileLink {
  label: string;
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
  /** Game mới xuất hiện so với lần cache trước */
  is_new?: boolean;
  /** ISO timestamp lúc game được đánh dấu là mới */
  is_new_since?: string;
  /** User đã click vào game này chưa */
  is_new_seen?: boolean;
  /** User đã ẩn game này */
  is_hidden?: boolean;
  image_url: string;
  size: string;
  genres: string[];
  review_url: string;
  sheets: string[];
  links: GameLinks;
}
