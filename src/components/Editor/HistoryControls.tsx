import type React from 'react';
import { css } from '@emotion/css';
import { Redo2, Undo2 } from 'lucide-react';
import { useEditor } from '../../state/EditorContext';
import { IconButton } from '../ui/IconButton';

export const HistoryControls: React.FC = () => {
  const { state, dispatch } = useEditor();

  return (
    <div className={styles.root} role='group' aria-label='History'>
      <IconButton
        aria-label='Undo'
        title='Undo (⌘Z)'
        disabled={state.past.length === 0}
        onClick={() => dispatch({ type: 'undo' })}
      >
        <Undo2 size={14} />
      </IconButton>
      <IconButton
        aria-label='Redo'
        title='Redo (⇧⌘Z)'
        disabled={state.future.length === 0}
        onClick={() => dispatch({ type: 'redo' })}
      >
        <Redo2 size={14} />
      </IconButton>
    </div>
  );
};

const styles = {
  root: css`
    display: flex;
    align-items: center;
    gap: 2px;
  `,
};
