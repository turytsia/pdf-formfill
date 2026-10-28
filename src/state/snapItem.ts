import { FieldKind, type Box, type DetectedField } from '../detection/types';
import { clamp } from '../utilities/geometry';
import { MAX_FONT_SIZE, MIN_FONT_SIZE } from './constants';
import { ItemKind, type FontMetrics, type Item, type Point } from './types';

// A detected field under the pointer. For box rows, typing starts in `boxIndex`.
export interface FieldTarget {
  field: DetectedField;
  boxIndex: number;
}

// Points around a box that still count as clicking it.
const HIT_SLACK = 1;
// Capital letters fill this share of the box height.
const CAP_HEIGHT_RATIO = 0.55;
// A glyph may take up this share of its box's width.
const GLYPH_WIDTH_RATIO = 0.8;
// An X mark fills this share of its box.
const MARK_RATIO = 0.6;

export function findFieldAt(
  fields: Array<DetectedField>,
  point: Point,
): FieldTarget | null {
  for (const field of fields) {
    const boxIndex = boxesOf(field).findIndex((box) => contains(box, point));
    if (boxIndex !== -1) {
      return { field, boxIndex };
    }
  }
  return null;
}

// Text for a row of boxes, starting in the clicked box with one character per box;
// an X mark for a single box.
export function createSnappedItem(
  { field, boxIndex }: FieldTarget,
  pageIndex: number,
  metrics: FontMetrics,
): Item {
  if (field.kind === FieldKind.Box) {
    const { box } = field;
    return {
      id: crypto.randomUUID(),
      kind: ItemKind.Mark,
      pageIndex,
      x: (box.left + box.right) / 2,
      y: (box.top + box.bottom) / 2,
      size: roundToHalf(
        Math.min(box.right - box.left, box.top - box.bottom) * MARK_RATIO,
      ),
    };
  }

  const pitch = pitchOf(field.boxes);
  const box = field.boxes[boxIndex];
  const boxHeight = box.top - box.bottom;
  const fontSize = roundToHalf(
    clamp(
      Math.min(
        (boxHeight * CAP_HEIGHT_RATIO) / metrics.capHeight,
        (pitch * GLYPH_WIDTH_RATIO) / metrics.advance,
      ),
      MIN_FONT_SIZE,
      MAX_FONT_SIZE,
    ),
  );

  return {
    id: crypto.randomUUID(),
    kind: ItemKind.Text,
    pageIndex,
    x: box.left,
    baseline: capCenteredBaseline(box, fontSize, metrics),
    text: '',
    fontSize,
    spacing: pitch,
  };
}

// Lines a pasted copy up with the field under the pointer, keeping its size.
// Returns null when the item doesn't fit that kind of field (text on a checkbox).
export function snapPastedItem(
  item: Item,
  { field, boxIndex }: FieldTarget,
  pageIndex: number,
  metrics: FontMetrics,
): Item | null {
  if (item.kind === ItemKind.Text && field.kind === FieldKind.BoxRow) {
    const box = field.boxes[boxIndex];
    return {
      ...item,
      pageIndex,
      x: box.left,
      baseline: capCenteredBaseline(box, item.fontSize, metrics),
      spacing: Math.max(pitchOf(field.boxes), metrics.advance * item.fontSize),
    };
  }
  if (item.kind === ItemKind.Mark && field.kind === FieldKind.Box) {
    const { box } = field;
    return {
      ...item,
      pageIndex,
      x: (box.left + box.right) / 2,
      y: (box.top + box.bottom) / 2,
    };
  }
  return null;
}

export function boxesOf(field: DetectedField): Array<Box> {
  return field.kind === FieldKind.BoxRow ? field.boxes : [field.box];
}

function pitchOf(boxes: Array<Box>): number {
  return (boxes[boxes.length - 1].right - boxes[0].left) / boxes.length;
}

// Capitals and digits sit centred in the box.
function capCenteredBaseline(
  box: Box,
  fontSize: number,
  metrics: FontMetrics,
): number {
  return (box.top + box.bottom) / 2 - (metrics.capHeight * fontSize) / 2;
}

// PDF space: top is above bottom.
function contains(box: Box, point: Point): boolean {
  return (
    point.x >= box.left - HIT_SLACK &&
    point.x <= box.right + HIT_SLACK &&
    point.y <= box.top + HIT_SLACK &&
    point.y >= box.bottom - HIT_SLACK
  );
}

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}
