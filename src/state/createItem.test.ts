import { describe, expect, it } from 'vitest';
import type { FontMetrics } from './types';
import { INITIAL_ITEM_DEFAULTS } from './constants';
import {
  createMarkItem,
  createTextItem,
  offsetItem,
  placeItemAt,
} from './createItem';

const METRICS: FontMetrics = { ascent: 1, descent: 0.5, advance: 0.6 };

describe('createItem', () => {
  describe('placeItemAt', () => {
    it('should center the first cell of a text item on the given point', () => {
      const text = {
        ...createTextItem(0, 0, 0, INITIAL_ITEM_DEFAULTS),
        fontSize: 10,
        spacing: 12,
      };

      const placed = placeItemAt(text, 2, { x: 100, y: 200 }, METRICS);

      expect(placed).toEqual({
        ...text,
        pageIndex: 2,
        x: 94,
        baseline: 197.5,
      });
    });

    it('should center a mark item on the given point', () => {
      const mark = createMarkItem(0, 0, 0, INITIAL_ITEM_DEFAULTS);

      const placed = placeItemAt(mark, 1, { x: 100, y: 200 }, METRICS);

      expect(placed).toEqual({ ...mark, pageIndex: 1, x: 100, y: 200 });
    });
  });

  describe('offsetItem', () => {
    it('should move a text item down and to the right', () => {
      const text = createTextItem(0, 50, 700, INITIAL_ITEM_DEFAULTS);

      expect(offsetItem(text, 12)).toEqual({ ...text, x: 62, baseline: 688 });
    });

    it('should move a mark item down and to the right', () => {
      const mark = createMarkItem(0, 50, 700, INITIAL_ITEM_DEFAULTS);

      expect(offsetItem(mark, 12)).toEqual({ ...mark, x: 62, y: 688 });
    });
  });
});
