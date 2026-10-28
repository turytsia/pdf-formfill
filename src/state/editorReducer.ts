import { clamp } from '../utilities/geometry';
import { INITIAL_ITEM_DEFAULTS, MAX_ZOOM, MIN_ZOOM } from './constants';
import {
  ItemKind,
  type Item,
  type ItemDefaults,
  type MarkItem,
  type TextItem,
} from './types';

export interface HistorySnapshot {
  items: Array<Item>;
  selectedId: string | null;
}

export interface EditorState {
  items: Array<Item>;
  selectedId: string | null;
  tool: ItemKind;
  zoom: number;
  defaults: ItemDefaults;
  past: Array<HistorySnapshot>;
  future: Array<HistorySnapshot>;
  // Consecutive updates that share a batch key collapse into a single undo step.
  lastBatch: string | null;
}

export type TextChanges = Partial<Omit<TextItem, 'id' | 'kind' | 'pageIndex'>>;
export type MarkChanges = Partial<Omit<MarkItem, 'id' | 'kind' | 'pageIndex'>>;

export type EditorAction =
  | { type: 'addItem'; item: Item }
  | { type: 'updateText'; id: string; changes: TextChanges; batch?: string }
  | { type: 'updateMark'; id: string; changes: MarkChanges; batch?: string }
  | { type: 'removeItem'; id: string }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'select'; id: string | null }
  | { type: 'setTool'; tool: ItemKind }
  | { type: 'setZoom'; zoom: number };

export const HISTORY_LIMIT = 100;

export const INITIAL_EDITOR_STATE: EditorState = {
  items: [],
  selectedId: null,
  tool: ItemKind.Text,
  zoom: 1,
  defaults: INITIAL_ITEM_DEFAULTS,
  past: [],
  future: [],
  lastBatch: null,
};

type HistoryFields = Pick<EditorState, 'past' | 'future' | 'lastBatch'>;

const snapshot = (state: EditorState): HistorySnapshot => ({
  items: state.items,
  selectedId: state.selectedId,
});

const isEmptyText = (item: Item): boolean =>
  item.kind === ItemKind.Text && item.text.trim() === '';

function record(state: EditorState, batch: string | null): HistoryFields {
  if (batch !== null && batch === state.lastBatch) {
    return { past: state.past, future: state.future, lastBatch: batch };
  }

  return {
    past: [...state.past, snapshot(state)].slice(-HISTORY_LIMIT),
    future: [],
    lastBatch: batch,
  };
}

export function editorReducer(
  state: EditorState,
  action: EditorAction,
): EditorState {
  switch (action.type) {
    case 'addItem':
      return {
        ...state,
        ...record(state, null),
        items: [...state.items, action.item],
        selectedId: action.item.id,
      };
    case 'updateText': {
      const item = state.items.find((candidate) => candidate.id === action.id);
      if (!item || item.kind !== ItemKind.Text) {
        return state;
      }
      return {
        ...state,
        ...record(state, action.batch ?? null),
        items: state.items.map((candidate) =>
          candidate === item ? { ...item, ...action.changes } : candidate,
        ),
        defaults: {
          ...state.defaults,
          fontSize: action.changes.fontSize ?? state.defaults.fontSize,
          spacing: action.changes.spacing ?? state.defaults.spacing,
        },
      };
    }
    case 'updateMark': {
      const item = state.items.find((candidate) => candidate.id === action.id);
      if (!item || item.kind !== ItemKind.Mark) {
        return state;
      }
      return {
        ...state,
        ...record(state, action.batch ?? null),
        items: state.items.map((candidate) =>
          candidate === item ? { ...item, ...action.changes } : candidate,
        ),
        defaults: {
          ...state.defaults,
          markSize: action.changes.size ?? state.defaults.markSize,
        },
      };
    }
    case 'removeItem': {
      const item = state.items.find((candidate) => candidate.id === action.id);
      if (!item) {
        return state;
      }
      const items = state.items.filter((candidate) => candidate !== item);
      const selectedId = state.selectedId === item.id ? null : state.selectedId;
      const previous = state.past.at(-1);
      const cancelsAdd =
        isEmptyText(item) &&
        previous !== undefined &&
        !previous.items.some((candidate) => candidate.id === item.id);

      // Placing a text item and leaving it empty nets out to nothing, so drop the step.
      if (cancelsAdd) {
        return {
          ...state,
          items,
          selectedId,
          past: state.past.slice(0, -1),
          lastBatch: null,
        };
      }
      return { ...state, ...record(state, null), items, selectedId };
    }
    case 'undo': {
      const previous = state.past.at(-1);
      if (!previous) {
        return state;
      }
      return {
        ...state,
        items: previous.items,
        selectedId: previous.selectedId,
        past: state.past.slice(0, -1),
        future: [snapshot(state), ...state.future],
        lastBatch: null,
      };
    }
    case 'redo': {
      const [next, ...future] = state.future;
      if (!next) {
        return state;
      }
      return {
        ...state,
        items: next.items,
        selectedId: next.selectedId,
        past: [...state.past, snapshot(state)],
        future,
        lastBatch: null,
      };
    }
    case 'select':
      return state.selectedId === action.id
        ? state
        : { ...state, selectedId: action.id, lastBatch: null };
    case 'setTool':
      return { ...state, tool: action.tool };
    case 'setZoom':
      return { ...state, zoom: clamp(action.zoom, MIN_ZOOM, MAX_ZOOM) };
  }
}
