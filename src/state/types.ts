export enum ItemKind {
  Text = 'text',
  Mark = 'mark',
}

// All coordinates are PDF user space: points, y grows upwards, origin at the bottom-left.
export interface PageGeometry {
  index: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

interface ItemBase {
  id: string;
  pageIndex: number;
}

export interface TextItem extends ItemBase {
  kind: ItemKind.Text;
  // Left edge of the first character cell.
  x: number;
  baseline: number;
  text: string;
  fontSize: number;
  // Width of one character cell; the glyph is centered inside it.
  spacing: number;
}

export interface MarkItem extends ItemBase {
  kind: ItemKind.Mark;
  // Center of the mark.
  x: number;
  y: number;
  size: number;
}

export type Item = TextItem | MarkItem;

// Relative to the font size (em units).
export interface FontMetrics {
  ascent: number;
  capHeight: number;
  descent: number;
  advance: number;
}

export interface ItemDefaults {
  fontSize: number;
  spacing: number;
  markSize: number;
}
