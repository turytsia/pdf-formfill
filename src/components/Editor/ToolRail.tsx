import type React from 'react';
import { css, cx } from '@emotion/css';
import { List, Magnet, Type, X } from 'lucide-react';
import { useEditor } from '../../state/EditorContext';
import { ItemKind } from '../../state/types';
import { MOBILE_MEDIA } from '../../styles/breakpoints';

interface ToolOption {
  kind: ItemKind;
  label: string;
  shortcut: string;
  icon: React.ReactNode;
}

const TOOLS: Array<ToolOption> = [
  {
    kind: ItemKind.Text,
    label: 'Text',
    shortcut: 'T',
    icon: <Type size={16} />,
  },
  { kind: ItemKind.Mark, label: 'Mark', shortcut: 'X', icon: <X size={16} /> },
];

interface ToolRailProps {
  hiddenOnMobile: boolean;
  // Phones open the field list from here; on wider screens it is always visible.
  fieldsOpen: boolean;
  onToggleFields: () => void;
}

export const ToolRail: React.FC<ToolRailProps> = ({
  hiddenOnMobile,
  fieldsOpen,
  onToggleFields,
}) => {
  const { state, dispatch } = useEditor();
  const fieldCount = state.items.length;

  return (
    <div
      className={styles.root}
      role='toolbar'
      aria-label='Tools'
      data-hidden-on-mobile={hiddenOnMobile}
    >
      <div className={styles.tools} role='radiogroup' aria-label='Insert tool'>
        {TOOLS.map((tool) => (
          <button
            key={tool.kind}
            type='button'
            role='radio'
            aria-checked={state.tool === tool.kind}
            title={`${tool.label} (${tool.shortcut})`}
            className={styles.tool}
            onClick={() => dispatch({ type: 'setTool', tool: tool.kind })}
          >
            {tool.icon}
            <span className={styles.label}>{tool.label}</span>
          </button>
        ))}
      </div>
      <span className={styles.divider} aria-hidden />
      <button
        type='button'
        className={cx(styles.tool, styles.snapToggle)}
        aria-pressed={state.snapToBoxes}
        aria-label='Snap to boxes'
        title='Snap to boxes: a row of boxes gets text, a single box gets an X'
        onClick={() =>
          dispatch({ type: 'setSnap', enabled: !state.snapToBoxes })
        }
      >
        <Magnet size={16} />
        <span className={styles.label}>Snap</span>
      </button>
      <button
        type='button'
        className={cx(styles.tool, styles.fieldsToggle)}
        aria-pressed={fieldsOpen}
        onClick={onToggleFields}
      >
        <List size={16} />
        <span className={styles.label}>Fields</span>
        {fieldCount > 0 && <span className={styles.count}>{fieldCount}</span>}
      </button>
    </div>
  );
};

const styles = {
  root: css`
    flex-shrink: 0;
    width: 64px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 8px;
    border-right: 1px solid var(--color-border);
    background: var(--color-bg);

    ${MOBILE_MEDIA} {
      order: 1;
      width: 100%;
      height: var(--mobile-rail-height);
      flex-direction: row;
      justify-content: center;
      gap: 8px;
      padding: 6px 12px calc(6px + env(safe-area-inset-bottom));
      border-right: 0;
      border-top: 1px solid var(--color-border);

      &[data-hidden-on-mobile='true'] {
        display: none;
      }
    }
  `,
  tools: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    ${MOBILE_MEDIA} {
      flex-direction: row;
      gap: 8px;
    }
  `,
  tool: css`
    width: 48px;
    height: 52px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-radius: var(--radius-md);
    color: var(--color-fg-muted);
    transition:
      background-color 120ms ease,
      color 120ms ease,
      box-shadow 120ms ease;

    &:hover {
      background: var(--color-surface-hover);
      color: var(--color-fg);
    }

    &[aria-checked='true'],
    &[aria-pressed='true'] {
      background: var(--color-surface-active);
      color: var(--color-fg);
      box-shadow: inset 0 0 0 1px var(--color-border-strong);
    }

    ${MOBILE_MEDIA} {
      flex-direction: row;
      width: auto;
      height: 40px;
      padding: 0 12px;
      gap: 8px;
    }
  `,
  divider: css`
    width: 32px;
    height: 1px;
    margin: 8px 0;
    background: var(--color-border);

    ${MOBILE_MEDIA} {
      width: 1px;
      height: 24px;
      margin: 0 2px;
    }
  `,
  // Icon only on phones, where the bottom bar has little room.
  snapToggle: css`
    ${MOBILE_MEDIA} {
      padding: 0 10px;

      & > span {
        display: none;
      }
    }
  `,
  fieldsToggle: css`
    display: none;

    ${MOBILE_MEDIA} {
      display: flex;
      padding: 0 14px;
    }
  `,
  label: css`
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.02em;
    line-height: 1;

    ${MOBILE_MEDIA} {
      font-size: 13px;
    }
  `,
  count: css`
    min-width: 18px;
    padding: 1px 5px;
    border-radius: 999px;
    background: var(--color-surface-active);
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 16px;
    text-align: center;
    color: var(--color-fg-muted);
  `,
};
