import { ItemKind, type Item } from './types';

// Items whose vertical positions are this close (in points) count as one row.
const ROW_TOLERANCE = 4;

// Reading order: page by page, top to bottom, then left to right within a row.
export function sortByDocumentOrder(items: Array<Item>): Array<Item> {
  return [...items].sort(compareDocumentOrder);
}

function compareDocumentOrder(a: Item, b: Item): number {
  if (a.pageIndex !== b.pageIndex) {
    return a.pageIndex - b.pageIndex;
  }
  // PDF y grows upwards, so the higher item has the larger y.
  const rowDifference = verticalAnchor(b) - verticalAnchor(a);
  if (Math.abs(rowDifference) > ROW_TOLERANCE) {
    return rowDifference;
  }
  return a.x - b.x;
}

function verticalAnchor(item: Item): number {
  return item.kind === ItemKind.Text ? item.baseline : item.y;
}
