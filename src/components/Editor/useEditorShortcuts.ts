import { useEffect } from 'react';
import { useEditor } from '../../state/EditorContext';
import { ItemKind } from '../../state/types';

export function useEditorShortcuts(onDownload: () => void): void {
  const { dispatch } = useEditor();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const key = event.key.toLowerCase();
      const withModifier = event.metaKey || event.ctrlKey;

      if (withModifier && key === 's') {
        event.preventDefault();
        onDownload();
        return;
      }

      if (withModifier && key === 'z') {
        event.preventDefault();
        dispatch({ type: event.shiftKey ? 'redo' : 'undo' });
        return;
      }

      if (withModifier && key === 'y') {
        event.preventDefault();
        dispatch({ type: 'redo' });
        return;
      }

      if (event.key === 'Escape') {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        dispatch({ type: 'select', id: null });
        return;
      }

      if (isEditableTarget(event.target) || withModifier || event.altKey) {
        return;
      }

      if (key === 't') {
        dispatch({ type: 'setTool', tool: ItemKind.Text });
      }
      if (key === 'x') {
        dispatch({ type: 'setTool', tool: ItemKind.Mark });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, onDownload]);
}

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable)
  );
}
