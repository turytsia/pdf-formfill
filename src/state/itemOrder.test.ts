import { describe, expect, it } from 'vitest';
import { INITIAL_ITEM_DEFAULTS } from './constants';
import { createMarkItem, createTextItem } from './createItem';
import { sortByDocumentOrder } from './itemOrder';

describe('sortByDocumentOrder', () => {
  it('should order fields page by page', () => {
    const onSecondPage = createTextItem(1, 50, 800, INITIAL_ITEM_DEFAULTS);
    const onFirstPage = createTextItem(0, 50, 100, INITIAL_ITEM_DEFAULTS);

    expect(sortByDocumentOrder([onSecondPage, onFirstPage])).toEqual([
      onFirstPage,
      onSecondPage,
    ]);
  });

  it('should order fields on a page from top to bottom', () => {
    const lower = createTextItem(0, 50, 300, INITIAL_ITEM_DEFAULTS);
    const higher = createMarkItem(0, 400, 700, INITIAL_ITEM_DEFAULTS);

    expect(sortByDocumentOrder([lower, higher])).toEqual([higher, lower]);
  });

  it('should order fields in the same row from left to right', () => {
    const right = createMarkItem(0, 400, 501, INITIAL_ITEM_DEFAULTS);
    const left = createTextItem(0, 60, 499, INITIAL_ITEM_DEFAULTS);

    expect(sortByDocumentOrder([right, left])).toEqual([left, right]);
  });

  it('should not reorder the array it was given', () => {
    const second = createTextItem(1, 50, 100, INITIAL_ITEM_DEFAULTS);
    const first = createTextItem(0, 50, 100, INITIAL_ITEM_DEFAULTS);
    const items = [second, first];

    sortByDocumentOrder(items);

    expect(items).toEqual([second, first]);
  });
});
