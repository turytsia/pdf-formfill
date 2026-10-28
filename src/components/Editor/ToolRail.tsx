import type React from 'react';
import { css } from '@emotion/css';
import { Type, X } from 'lucide-react';
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
}

export const ToolRail: React.FC<ToolRailProps> = ({ hiddenOnMobile }) => {
  const { state, dispatch } = useEditor();

  return (
    <div
      className={styles.root}
      role='radiogroup'
      aria-label='Tools'
      data-hidden-on-mobile={hiddenOnMobile}
    >
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
  );
};

const styles = {
  root: css`
    flex-shrink: 0;
    width: 64px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
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
  tool: css`
    width: 48px;
    height: 52px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;

    ${MOBILE_MEDIA} {
      flex-direction: row;
      width: auto;
      height: 40px;
      padding: 0 18px;
      gap: 8px;
    }
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

    &[aria-checked='true'] {
      background: var(--color-surface-active);
      color: var(--color-fg);
      box-shadow: inset 0 0 0 1px var(--color-border-strong);
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
};
