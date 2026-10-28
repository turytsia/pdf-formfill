import { describe, expect, it } from 'vitest';
import { MAX_ZOOM, MIN_ZOOM } from './constants';
import { createMarkItem, createTextItem } from './createItem';
import {
  editorReducer,
  INITIAL_EDITOR_STATE,
  type EditorAction,
  type EditorState,
} from './editorReducer';
import { ItemKind } from './types';

const reduceAll = (actions: Array<EditorAction>): EditorState =>
  actions.reduce(editorReducer, INITIAL_EDITOR_STATE);

describe('editorReducer', () => {
  it('should select a newly added item', () => {
    const item = createTextItem(0, 10, 20, INITIAL_EDITOR_STATE.defaults);

    const state = editorReducer(INITIAL_EDITOR_STATE, {
      type: 'addItem',
      item,
    });

    expect(state.items).toEqual([item]);
    expect(state.selectedId).toBe(item.id);
  });

  it('should clear the selection when the selected item is removed', () => {
    const item = createMarkItem(0, 10, 20, INITIAL_EDITOR_STATE.defaults);
    const withItem = editorReducer(INITIAL_EDITOR_STATE, {
      type: 'addItem',
      item,
    });

    const state = editorReducer(withItem, { type: 'removeItem', id: item.id });

    expect(state.items).toEqual([]);
    expect(state.selectedId).toBeNull();
  });

  it('should keep the selection when a different item is removed', () => {
    const first = createTextItem(0, 10, 20, INITIAL_EDITOR_STATE.defaults);
    const second = createTextItem(0, 30, 40, INITIAL_EDITOR_STATE.defaults);
    const withBoth = reduceAll([
      { type: 'addItem', item: first },
      { type: 'addItem', item: second },
    ]);

    const state = editorReducer(withBoth, { type: 'removeItem', id: first.id });

    expect(state.items).toEqual([second]);
    expect(state.selectedId).toBe(second.id);
  });

  it('should remember font size and spacing of the last edited text for new items', () => {
    const item = createTextItem(0, 10, 20, INITIAL_EDITOR_STATE.defaults);

    const state = reduceAll([
      { type: 'addItem', item },
      {
        type: 'updateText',
        id: item.id,
        changes: { fontSize: 9, spacing: 14.5 },
      },
    ]);

    expect(state.defaults).toEqual({
      ...INITIAL_EDITOR_STATE.defaults,
      fontSize: 9,
      spacing: 14.5,
    });
    expect(createTextItem(1, 0, 0, state.defaults)).toMatchObject({
      fontSize: 9,
      spacing: 14.5,
    });
  });

  it('should ignore text changes addressed to a mark item', () => {
    const mark = createMarkItem(0, 10, 20, INITIAL_EDITOR_STATE.defaults);
    const withMark = editorReducer(INITIAL_EDITOR_STATE, {
      type: 'addItem',
      item: mark,
    });

    const state = editorReducer(withMark, {
      type: 'updateText',
      id: mark.id,
      changes: { text: 'ABC' },
    });

    expect(state).toBe(withMark);
    expect(state.items[0].kind).toBe(ItemKind.Mark);
  });

  it.each([
    [0.1, MIN_ZOOM],
    [10, MAX_ZOOM],
    [1.5, 1.5],
  ])('should clamp a requested zoom of %s to %s', (requested, expected) => {
    const state = editorReducer(INITIAL_EDITOR_STATE, {
      type: 'setZoom',
      zoom: requested,
    });

    expect(state.zoom).toBe(expected);
  });

  it('should return the same state when selecting the already selected item', () => {
    const item = createTextItem(0, 10, 20, INITIAL_EDITOR_STATE.defaults);
    const withItem = editorReducer(INITIAL_EDITOR_STATE, {
      type: 'addItem',
      item,
    });

    const state = editorReducer(withItem, { type: 'select', id: item.id });

    expect(state).toBe(withItem);
  });

  describe('undo and redo', () => {
    it('should undo adding an item', () => {
      const mark = createMarkItem(0, 10, 20, INITIAL_EDITOR_STATE.defaults);

      const state = reduceAll([
        { type: 'addItem', item: mark },
        { type: 'undo' },
      ]);

      expect(state.items).toEqual([]);
      expect(state.selectedId).toBeNull();
    });

    it('should redo an undone change', () => {
      const mark = createMarkItem(0, 10, 20, INITIAL_EDITOR_STATE.defaults);

      const state = reduceAll([
        { type: 'addItem', item: mark },
        { type: 'undo' },
        { type: 'redo' },
      ]);

      expect(state.items).toEqual([mark]);
      expect(state.selectedId).toBe(mark.id);
    });

    it('should collapse consecutive updates that share a batch into one undo step', () => {
      const text = createTextItem(0, 10, 20, INITIAL_EDITOR_STATE.defaults);
      const batch = `text-${text.id}`;

      const state = reduceAll([
        { type: 'addItem', item: text },
        { type: 'updateText', id: text.id, changes: { text: 'N' }, batch },
        { type: 'updateText', id: text.id, changes: { text: 'NO' }, batch },
        { type: 'updateText', id: text.id, changes: { text: 'NOV' }, batch },
        { type: 'undo' },
      ]);

      expect(state.items[0]).toMatchObject({ text: '' });
    });

    it('should start a new undo step when the batch key changes', () => {
      const text = createTextItem(0, 10, 20, INITIAL_EDITOR_STATE.defaults);

      const state = reduceAll([
        { type: 'addItem', item: text },
        {
          type: 'updateText',
          id: text.id,
          changes: { text: 'N' },
          batch: `text-${text.id}`,
        },
        {
          type: 'updateText',
          id: text.id,
          changes: { spacing: 14 },
          batch: `spacing-${text.id}`,
        },
        { type: 'undo' },
      ]);

      expect(state.items[0]).toMatchObject({
        text: 'N',
        spacing: INITIAL_EDITOR_STATE.defaults.spacing,
      });
    });

    it('should record separate undo steps for updates without a batch', () => {
      const mark = createMarkItem(0, 10, 20, INITIAL_EDITOR_STATE.defaults);

      const state = reduceAll([
        { type: 'addItem', item: mark },
        { type: 'updateMark', id: mark.id, changes: { x: 30 } },
        { type: 'updateMark', id: mark.id, changes: { x: 50 } },
        { type: 'undo' },
      ]);

      expect(state.items[0]).toMatchObject({ x: 30 });
    });

    it('should drop the redo history when a new change is made after undoing', () => {
      const first = createMarkItem(0, 10, 20, INITIAL_EDITOR_STATE.defaults);
      const second = createMarkItem(0, 30, 40, INITIAL_EDITOR_STATE.defaults);
      const afterNewChange = reduceAll([
        { type: 'addItem', item: first },
        { type: 'undo' },
        { type: 'addItem', item: second },
      ]);

      const state = editorReducer(afterNewChange, { type: 'redo' });

      expect(state).toBe(afterNewChange);
      expect(state.items).toEqual([second]);
    });

    it('should return the same state when there is nothing to undo or redo', () => {
      expect(editorReducer(INITIAL_EDITOR_STATE, { type: 'undo' })).toBe(
        INITIAL_EDITOR_STATE,
      );
      expect(editorReducer(INITIAL_EDITOR_STATE, { type: 'redo' })).toBe(
        INITIAL_EDITOR_STATE,
      );
    });

    it('should leave no undo step behind when an empty text item is removed right after being placed', () => {
      const text = createTextItem(0, 10, 20, INITIAL_EDITOR_STATE.defaults);

      const state = reduceAll([
        { type: 'addItem', item: text },
        { type: 'removeItem', id: text.id },
      ]);

      expect(state.items).toEqual([]);
      expect(state.past).toEqual([]);
      expect(editorReducer(state, { type: 'undo' })).toBe(state);
    });

    it('should keep an undo step when a filled text item is removed', () => {
      const text = createTextItem(0, 10, 20, INITIAL_EDITOR_STATE.defaults);

      const state = reduceAll([
        { type: 'addItem', item: text },
        { type: 'updateText', id: text.id, changes: { text: 'NOVÁK' } },
        { type: 'removeItem', id: text.id },
        { type: 'undo' },
      ]);

      expect(state.items).toEqual([{ ...text, text: 'NOVÁK' }]);
    });

    it('should not touch the history when removing an unknown item', () => {
      const mark = createMarkItem(0, 10, 20, INITIAL_EDITOR_STATE.defaults);
      const withMark = editorReducer(INITIAL_EDITOR_STATE, {
        type: 'addItem',
        item: mark,
      });

      const state = editorReducer(withMark, {
        type: 'removeItem',
        id: 'missing',
      });

      expect(state).toBe(withMark);
    });
  });
});
