import { useEffect, useRef } from 'react';
import { PASTE_OFFSET } from '../../state/constants';
import { offsetItem, placeItemAt } from '../../state/createItem';
import { findFieldAt, snapPastedItem } from '../../state/snapItem';
import { useEditor } from '../../state/EditorContext';
import { ItemKind, type Item, type Point } from '../../state/types';
import {
  ITEM_CLIPBOARD_TYPE,
  parseClipboardItem,
  serializeItem,
} from '../../utilities/clipboard';
import { toPdfPoint } from '../../utilities/geometry';

export function useEditorClipboard(): void {
  const { state, dispatch, pages, font, fieldsByPage } = useEditor();
  const pointerRef = useRef<Point | null>(null);

  useEffect(() => {
    const trackPointer = (event: PointerEvent): void => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
    };
    window.addEventListener('pointermove', trackPointer);
    return () => window.removeEventListener('pointermove', trackPointer);
  }, []);

  useEffect(() => {
    const selected = state.items.find((item) => item.id === state.selectedId);

    const writeSelection = (event: ClipboardEvent): boolean => {
      if (!selected || !event.clipboardData || isInsidePanel(event.target)) {
        return false;
      }
      event.preventDefault();
      event.clipboardData.setData(ITEM_CLIPBOARD_TYPE, serializeItem(selected));
      event.clipboardData.setData(
        'text/plain',
        selected.kind === ItemKind.Text ? selected.text : 'X',
      );
      return true;
    };

    // Paste lands under the pointer when it is over a page, otherwise next to the original.
    const positionPaste = (item: Item): Item => {
      const pointer = pointerRef.current;
      const pageElement = pointer
        ? document
            .elementFromPoint(pointer.x, pointer.y)
            ?.closest('[data-page-index]')
        : null;
      const page = pageElement
        ? pages[Number(pageElement.getAttribute('data-page-index'))]
        : undefined;

      if (!pointer || !pageElement || !page) {
        const pageIndex = Math.min(item.pageIndex, pages.length - 1);
        return offsetItem({ ...item, pageIndex }, PASTE_OFFSET);
      }

      const bounds = pageElement.getBoundingClientRect();
      const center = toPdfPoint(
        page.geometry,
        { x: pointer.x - bounds.left, y: pointer.y - bounds.top },
        state.zoom,
      );
      const target = state.snapToBoxes
        ? findFieldAt(fieldsByPage.get(page.geometry.index) ?? [], center)
        : null;
      const snapped =
        target &&
        snapPastedItem(item, target, page.geometry.index, font.metrics);
      return (
        snapped ?? placeItemAt(item, page.geometry.index, center, font.metrics)
      );
    };

    const handleCopy = (event: ClipboardEvent): void => {
      writeSelection(event);
    };

    const handleCut = (event: ClipboardEvent): void => {
      if (writeSelection(event) && selected) {
        dispatch({ type: 'removeItem', id: selected.id });
      }
    };

    const handlePaste = (event: ClipboardEvent): void => {
      if (isInsidePanel(event.target)) {
        return;
      }
      const payload = event.clipboardData?.getData(ITEM_CLIPBOARD_TYPE);
      if (!payload) {
        return;
      }
      const item = parseClipboardItem(payload);
      if (!item) {
        return;
      }
      event.preventDefault();
      dispatch({ type: 'addItem', item: positionPaste(item) });
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
    };
  }, [
    state.items,
    state.selectedId,
    state.zoom,
    state.snapToBoxes,
    pages,
    font,
    fieldsByPage,
    dispatch,
  ]);
}

function isInsidePanel(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest('[data-properties-panel]') !== null
  );
}
