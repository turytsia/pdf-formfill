import { ItemKind, type Item } from '../state/types';

export const ITEM_CLIPBOARD_TYPE = 'application/x-formfill-item';

export const serializeItem = (item: Item): string => JSON.stringify(item);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

// The clipboard is an external boundary, so the payload is validated field by field.
export function parseClipboardItem(payload: string): Item | null {
  let value: unknown;
  try {
    value = JSON.parse(payload);
  } catch {
    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  if (value.kind === ItemKind.Text) {
    const { pageIndex, x, baseline, text, fontSize, spacing } = value;
    if (
      !isFiniteNumber(pageIndex) ||
      !isFiniteNumber(x) ||
      !isFiniteNumber(baseline) ||
      !isFiniteNumber(fontSize) ||
      !isFiniteNumber(spacing) ||
      typeof text !== 'string'
    ) {
      return null;
    }
    return {
      id: crypto.randomUUID(),
      kind: ItemKind.Text,
      pageIndex,
      x,
      baseline,
      text,
      fontSize,
      spacing,
    };
  }

  if (value.kind === ItemKind.Mark) {
    const { pageIndex, x, y, size } = value;
    if (
      !isFiniteNumber(pageIndex) ||
      !isFiniteNumber(x) ||
      !isFiniteNumber(y) ||
      !isFiniteNumber(size)
    ) {
      return null;
    }
    return {
      id: crypto.randomUUID(),
      kind: ItemKind.Mark,
      pageIndex,
      x,
      y,
      size,
    };
  }

  return null;
}
