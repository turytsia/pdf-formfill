import type { ItemDefaults } from './types';

export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 3;
export const ZOOM_STEP = 0.1;

export const MIN_FONT_SIZE = 4;
export const MAX_FONT_SIZE = 72;
export const MAX_SPACING = 40;
export const MIN_MARK_SIZE = 2;
export const MAX_MARK_SIZE = 40;
export const MARK_STROKE_RATIO = 0.12;

export const PAGE_GUTTER = 48;
export const PASTE_OFFSET = 12;

export const INITIAL_ITEM_DEFAULTS: ItemDefaults = {
  fontSize: 11,
  spacing: 12,
  markSize: 8,
} as const;
