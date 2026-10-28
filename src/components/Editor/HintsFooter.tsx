import type React from 'react';
import { useId, useState } from 'react';
import { css } from '@emotion/css';
import {
  ChevronUp,
  Copy,
  Download,
  Keyboard,
  MousePointerClick,
  MoveHorizontal,
  Undo2,
} from 'lucide-react';
import { useEditor } from '../../state/EditorContext';
import { ItemKind } from '../../state/types';
import { Kbd } from '../ui/Kbd';

export const HintsFooter: React.FC = () => {
  const { state } = useEditor();
  const [open, setOpen] = useState(false);
  const contentId = useId();

  return (
    <footer className={styles.root} data-section='hints'>
      <ul id={contentId} className={styles.tips} hidden={!open}>
        <li className={styles.tip}>
          <MousePointerClick size={14} />
          <span>
            Click a page to place{' '}
            {state.tool === ItemKind.Text ? 'text' : 'an X mark'}
          </span>
        </li>
        <li className={styles.tip}>
          <MoveHorizontal size={14} />
          <span>Drag the blue handle to stretch letters into the boxes</span>
        </li>
        <li className={styles.tip}>
          <Keyboard size={14} />
          <span>
            <Kbd>T</Kbd> text · <Kbd>X</Kbd> mark · <Kbd>Esc</Kbd> deselect
          </span>
        </li>
        <li className={styles.tip}>
          <Undo2 size={14} />
          <span>
            <Kbd>⌘Z</Kbd> undo · <Kbd>⇧⌘Z</Kbd> redo
          </span>
        </li>
        <li className={styles.tip}>
          <Copy size={14} />
          <span>
            <Kbd>⌘C</Kbd> <Kbd>⌘V</Kbd> duplicate a field under the cursor
          </span>
        </li>
        <li className={styles.tip}>
          <Download size={14} />
          <span>
            <Kbd>⌘S</Kbd> downloads the filled PDF
          </span>
        </li>
      </ul>
      <button
        type='button'
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((current) => !current)}
      >
        <Keyboard size={14} />
        <span className={styles.toggleLabel}>Shortcuts &amp; tips</span>
        <ChevronUp size={14} className={styles.chevron} />
      </button>
    </footer>
  );
};

const styles = {
  root: css`
    flex-shrink: 0;
    border-top: 1px solid var(--color-border);
    background: var(--color-bg);
  `,
  tips: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 16px 8px;

    &[hidden] {
      display: none;
    }
  `,
  tip: css`
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 13px;
    line-height: 1.45;
    color: var(--color-fg-muted);

    svg {
      flex-shrink: 0;
      margin-top: 3px;
      color: var(--color-fg-subtle);
    }
  `,
  toggle: css`
    width: 100%;
    height: 44px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 16px;
    font-size: 13px;
    color: var(--color-fg-muted);
    transition: color 120ms ease;

    &:hover {
      color: var(--color-fg);
    }
  `,
  toggleLabel: css`
    flex: 1;
    text-align: left;
  `,
  chevron: css`
    transition: transform 150ms ease;

    [aria-expanded='false'] > & {
      transform: rotate(180deg);
    }
  `,
};
