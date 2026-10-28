import { baselineFromCenter } from '../utilities/geometry';
import {
  ItemKind,
  type FontMetrics,
  type Item,
  type ItemDefaults,
  type MarkItem,
  type Point,
  type TextItem,
} from './types';

export function createTextItem(
  pageIndex: number,
  x: number,
  baseline: number,
  defaults: ItemDefaults,
): TextItem {
  return {
    id: crypto.randomUUID(),
    kind: ItemKind.Text,
    pageIndex,
    x,
    baseline,
    text: '',
    fontSize: defaults.fontSize,
    spacing: defaults.spacing,
  };
}

export function createMarkItem(
  pageIndex: number,
  x: number,
  y: number,
  defaults: ItemDefaults,
): MarkItem {
  return {
    id: crypto.randomUUID(),
    kind: ItemKind.Mark,
    pageIndex,
    x,
    y,
    size: defaults.markSize,
  };
}

// Centers the item on a point: the first text cell or the mark itself.
export function placeItemAt(
  item: Item,
  pageIndex: number,
  center: Point,
  metrics: FontMetrics,
): Item {
  if (item.kind === ItemKind.Text) {
    return {
      ...item,
      pageIndex,
      x: center.x - item.spacing / 2,
      baseline: baselineFromCenter(center.y, item.fontSize, metrics),
    };
  }
  return { ...item, pageIndex, x: center.x, y: center.y };
}

export function offsetItem(item: Item, offset: number): Item {
  if (item.kind === ItemKind.Text) {
    return { ...item, x: item.x + offset, baseline: item.baseline - offset };
  }
  return { ...item, x: item.x + offset, y: item.y - offset };
}
