import { describe, expect, it } from 'vitest';
import { FieldKind, type DetectedField } from '../detection/types';
import { createMarkItem, createTextItem } from './createItem';
import { INITIAL_ITEM_DEFAULTS } from './constants';
import { createSnappedItem, findFieldAt, snapPastedItem } from './snapItem';
import { ItemKind, type FontMetrics } from './types';

const METRICS: FontMetrics = {
  ascent: 1,
  descent: 0.3,
  advance: 0.6,
  capHeight: 0.7,
};

// Five 12 × 16 pt boxes starting at x = 100, between y = 516 and y = 500.
const ROW: DetectedField = {
  kind: FieldKind.BoxRow,
  boxes: [0, 1, 2, 3, 4].map((index) => ({
    left: 100 + index * 12,
    right: 112 + index * 12,
    top: 516,
    bottom: 500,
  })),
};

const CHECKBOX: DetectedField = {
  kind: FieldKind.Box,
  box: { left: 300, right: 312, top: 416, bottom: 400 },
};

describe('snapItem', () => {
  describe('findFieldAt', () => {
    it('should find the box of a row under the point', () => {
      expect(findFieldAt([CHECKBOX, ROW], { x: 127, y: 508 })).toEqual({
        field: ROW,
        boxIndex: 2,
      });
    });

    it('should find a single box under the point', () => {
      expect(findFieldAt([ROW, CHECKBOX], { x: 305, y: 410 })).toEqual({
        field: CHECKBOX,
        boxIndex: 0,
      });
    });

    it('should accept a click just outside a box edge', () => {
      expect(findFieldAt([CHECKBOX], { x: 312.5, y: 399.5 })).not.toBeNull();
    });

    it('should find nothing away from every field', () => {
      expect(findFieldAt([ROW, CHECKBOX], { x: 200, y: 300 })).toBeNull();
    });
  });

  describe('snapPastedItem', () => {
    it('should line pasted text up with the box under the pointer and keep its size', () => {
      const copied = {
        ...createTextItem(0, 13, 700, INITIAL_ITEM_DEFAULTS),
        text: 'NOVÁK',
        fontSize: 10,
        spacing: 14,
      };

      const pasted = snapPastedItem(
        copied,
        { field: ROW, boxIndex: 1 },
        2,
        METRICS,
      );

      expect(pasted).toMatchObject({
        text: 'NOVÁK',
        pageIndex: 2,
        x: 112,
        fontSize: 10,
        spacing: 12,
        baseline: 508 - (0.7 * 10) / 2,
      });
    });

    it('should centre a pasted X mark in the box under the pointer', () => {
      const copied = createMarkItem(0, 50, 50, INITIAL_ITEM_DEFAULTS);

      const pasted = snapPastedItem(
        copied,
        { field: CHECKBOX, boxIndex: 0 },
        0,
        METRICS,
      );

      expect(pasted).toMatchObject({ x: 306, y: 408, size: copied.size });
    });

    it('should not snap text onto a checkbox', () => {
      const copied = createTextItem(0, 13, 700, INITIAL_ITEM_DEFAULTS);

      expect(
        snapPastedItem(copied, { field: CHECKBOX, boxIndex: 0 }, 0, METRICS),
      ).toBeNull();
    });
  });

  describe('createSnappedItem', () => {
    describe('for a row of boxes', () => {
      it('should start text in the clicked box with one character per box', () => {
        const item = createSnappedItem({ field: ROW, boxIndex: 2 }, 3, METRICS);

        expect(item).toMatchObject({
          kind: ItemKind.Text,
          pageIndex: 3,
          x: 124,
          spacing: 12,
          text: '',
        });
      });

      it('should fit capital letters to the box height', () => {
        const item = createSnappedItem({ field: ROW, boxIndex: 0 }, 0, METRICS);

        // 16 pt box × 0.55 / 0.7 cap height ≈ 12.57 → rounded to half points.
        expect(item).toMatchObject({ fontSize: 12.5 });
      });

      it('should centre capital letters vertically in the box', () => {
        const item = createSnappedItem({ field: ROW, boxIndex: 0 }, 0, METRICS);

        expect(item.kind).toBe(ItemKind.Text);
        if (item.kind === ItemKind.Text) {
          const capTop = item.baseline + METRICS.capHeight * item.fontSize;
          expect((capTop + item.baseline) / 2).toBeCloseTo(508);
        }
      });

      it('should keep glyphs narrower than narrow boxes', () => {
        const narrow: DetectedField = {
          kind: FieldKind.BoxRow,
          boxes: [0, 1].map((index) => ({
            left: index * 6,
            right: 6 + index * 6,
            top: 30,
            bottom: 0,
          })),
        };

        const item = createSnappedItem(
          { field: narrow, boxIndex: 0 },
          0,
          METRICS,
        );

        expect(item).toMatchObject({ fontSize: 8 });
      });
    });

    describe('for a single box', () => {
      it('should place an X mark in the middle of the box', () => {
        const item = createSnappedItem(
          { field: CHECKBOX, boxIndex: 0 },
          1,
          METRICS,
        );

        expect(item).toMatchObject({
          kind: ItemKind.Mark,
          pageIndex: 1,
          x: 306,
          y: 408,
          size: 7,
        });
      });
    });
  });
});
