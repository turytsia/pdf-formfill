import { describe, expect, it } from 'vitest';
import { INITIAL_ITEM_DEFAULTS } from '../state/constants';
import { createMarkItem, createTextItem } from '../state/createItem';
import { parseClipboardItem, serializeItem } from './clipboard';

describe('clipboard', () => {
  it('should restore a text item with a fresh id', () => {
    const original = {
      ...createTextItem(1, 10, 20, INITIAL_ITEM_DEFAULTS),
      text: 'NOVÁK',
    };

    const parsed = parseClipboardItem(serializeItem(original));

    expect(parsed).toEqual({ ...original, id: expect.any(String) });
    expect(parsed?.id).not.toBe(original.id);
  });

  it('should restore a mark item with a fresh id', () => {
    const original = createMarkItem(2, 30, 40, INITIAL_ITEM_DEFAULTS);

    const parsed = parseClipboardItem(serializeItem(original));

    expect(parsed).toEqual({ ...original, id: expect.any(String) });
    expect(parsed?.id).not.toBe(original.id);
  });

  it('should reject payloads that are not JSON', () => {
    expect(parseClipboardItem('not json')).toBeNull();
  });

  it('should reject payloads of an unknown kind', () => {
    expect(parseClipboardItem('{"kind":"image","pageIndex":0}')).toBeNull();
  });

  it('should reject a text item with a missing or non-numeric field', () => {
    expect(
      parseClipboardItem(
        '{"kind":"text","pageIndex":0,"x":"10","baseline":20,"text":"A","fontSize":11,"spacing":12}',
      ),
    ).toBeNull();
    expect(
      parseClipboardItem(
        '{"kind":"text","pageIndex":0,"x":10,"baseline":20,"fontSize":11,"spacing":12}',
      ),
    ).toBeNull();
  });

  it('should reject a mark item with a non-finite size', () => {
    expect(
      parseClipboardItem(
        '{"kind":"mark","pageIndex":0,"x":10,"y":20,"size":null}',
      ),
    ).toBeNull();
  });
});
