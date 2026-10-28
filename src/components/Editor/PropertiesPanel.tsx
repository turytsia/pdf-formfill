import type React from 'react';
import { css } from '@emotion/css';
import {
  Copy,
  Download,
  Keyboard,
  MousePointerClick,
  MoveHorizontal,
  Trash,
  Undo2,
  X,
} from 'lucide-react';
import {
  MAX_FONT_SIZE,
  MAX_MARK_SIZE,
  MAX_SPACING,
  MIN_FONT_SIZE,
  MIN_MARK_SIZE,
} from '../../state/constants';
import { useEditor } from '../../state/EditorContext';
import type { MarkChanges, TextChanges } from '../../state/editorReducer';
import {
  ItemKind,
  type Item,
  type MarkItem,
  type PageGeometry,
  type TextItem,
} from '../../state/types';
import { MOBILE_MEDIA } from '../../styles/breakpoints';
import { getMinSpacing } from '../../utilities/geometry';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Kbd } from '../ui/Kbd';
import { NumberField } from '../ui/NumberField';

const getTitle = (item: Item | undefined): string => {
  if (!item) {
    return 'Properties';
  }
  return item.kind === ItemKind.Text ? 'Text' : 'Mark';
};

export const PropertiesPanel: React.FC = () => {
  const { state, dispatch, pages } = useEditor();
  const selected = state.items.find((item) => item.id === state.selectedId);

  const finishEditing = (): void => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    dispatch({ type: 'select', id: null });
  };

  return (
    <aside
      className={styles.root}
      aria-label='Properties'
      data-properties-panel
      data-open={selected !== undefined}
    >
      <header className={styles.header}>
        <h2 className={styles.title}>{getTitle(selected)}</h2>
        {selected && (
          <div className={styles.headerActions}>
            <span className={styles.badge}>Page {selected.pageIndex + 1}</span>
            <IconButton
              aria-label='Done editing'
              className={styles.closeButton}
              onClick={finishEditing}
            >
              <X size={16} />
            </IconButton>
          </div>
        )}
      </header>

      {!selected && <EmptyHint tool={state.tool} />}
      {selected?.kind === ItemKind.Text && (
        <TextProperties
          item={selected}
          page={pages[selected.pageIndex].geometry}
        />
      )}
      {selected?.kind === ItemKind.Mark && (
        <MarkProperties
          item={selected}
          page={pages[selected.pageIndex].geometry}
        />
      )}
    </aside>
  );
};

interface EmptyHintProps {
  tool: ItemKind;
}

const EmptyHint: React.FC<EmptyHintProps> = ({ tool }) => (
  <div className={styles.empty}>
    <p className={styles.emptyTitle}>Nothing selected</p>
    <ul className={styles.tips}>
      <li className={styles.tip}>
        <MousePointerClick size={14} />
        <span>
          Click a page to place {tool === ItemKind.Text ? 'text' : 'an X mark'}
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
  </div>
);

interface TextPropertiesProps {
  item: TextItem;
  page: PageGeometry;
}

const TextProperties: React.FC<TextPropertiesProps> = ({ item, page }) => {
  const { dispatch, font } = useEditor();
  const update = (changes: TextChanges, field: string): void =>
    dispatch({
      type: 'updateText',
      id: item.id,
      changes,
      batch: `${field}-${item.id}`,
    });
  const minSpacing = getMinSpacing(item.fontSize, font.metrics);

  return (
    <div className={styles.section}>
      <div className={styles.field}>
        <label htmlFor='text-content' className={styles.label}>
          Content
        </label>
        <input
          id='text-content'
          className={styles.textInput}
          value={item.text}
          placeholder='Type here'
          spellCheck={false}
          onChange={(event) => update({ text: event.target.value }, 'text')}
        />
      </div>

      <div className={styles.row}>
        <NumberField
          label='Font size'
          unit='pt'
          value={item.fontSize}
          min={MIN_FONT_SIZE}
          max={MAX_FONT_SIZE}
          step={0.5}
          onChange={(fontSize) =>
            update(
              {
                fontSize,
                spacing: Math.max(
                  item.spacing,
                  getMinSpacing(fontSize, font.metrics),
                ),
              },
              'fontSize',
            )
          }
        />
        <NumberField
          label='Spacing'
          unit='pt'
          value={item.spacing}
          min={minSpacing}
          max={MAX_SPACING}
          step={0.1}
          onChange={(spacing) => update({ spacing }, 'spacing')}
        />
      </div>

      <div className={styles.field}>
        <div className={styles.labelRow}>
          <label htmlFor='text-stretch' className={styles.label}>
            Stretch
          </label>
          <span className={styles.hint}>match the boxes</span>
        </div>
        <input
          id='text-stretch'
          type='range'
          className={styles.range}
          min={minSpacing}
          max={MAX_SPACING}
          step={0.1}
          value={item.spacing}
          onChange={(event) =>
            update({ spacing: event.target.valueAsNumber }, 'spacing')
          }
        />
      </div>

      <div className={styles.row}>
        <NumberField
          label='X'
          unit='pt'
          value={item.x - page.x0}
          step={0.5}
          onChange={(x) => update({ x: x + page.x0 }, 'x')}
        />
        <NumberField
          label='Y'
          unit='pt'
          value={page.y1 - item.baseline}
          step={0.5}
          onChange={(y) => update({ baseline: page.y1 - y }, 'y')}
        />
      </div>

      <Button
        variant='danger'
        size='sm'
        icon={<Trash size={14} />}
        onClick={() => dispatch({ type: 'removeItem', id: item.id })}
      >
        Remove
      </Button>
    </div>
  );
};

interface MarkPropertiesProps {
  item: MarkItem;
  page: PageGeometry;
}

const MarkProperties: React.FC<MarkPropertiesProps> = ({ item, page }) => {
  const { dispatch } = useEditor();
  const update = (changes: MarkChanges, field: string): void =>
    dispatch({
      type: 'updateMark',
      id: item.id,
      changes,
      batch: `${field}-${item.id}`,
    });

  return (
    <div className={styles.section}>
      <NumberField
        label='Size'
        unit='pt'
        value={item.size}
        min={MIN_MARK_SIZE}
        max={MAX_MARK_SIZE}
        step={0.5}
        onChange={(size) => update({ size }, 'size')}
      />

      <div className={styles.row}>
        <NumberField
          label='X'
          unit='pt'
          value={item.x - page.x0}
          step={0.5}
          onChange={(x) => update({ x: x + page.x0 }, 'x')}
        />
        <NumberField
          label='Y'
          unit='pt'
          value={page.y1 - item.y}
          step={0.5}
          onChange={(y) => update({ y: page.y1 - y }, 'y')}
        />
      </div>

      <Button
        variant='danger'
        size='sm'
        icon={<Trash size={14} />}
        onClick={() => dispatch({ type: 'removeItem', id: item.id })}
      >
        Remove
      </Button>
    </div>
  );
};

const styles = {
  root: css`
    flex-shrink: 0;
    width: var(--panel-width);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    border-left: 1px solid var(--color-border);
    background: var(--color-bg);

    ${MOBILE_MEDIA} {
      position: absolute;
      left: 0;
      right: 0;
      bottom: var(--mobile-rail-height);
      z-index: 3;
      width: auto;
      max-height: 55%;
      border-left: 0;
      border-top: 1px solid var(--color-border);
      border-radius: 16px 16px 0 0;
      box-shadow: 0 -16px 48px rgba(0, 0, 0, 0.6);

      &[data-open='false'] {
        display: none;
      }
    }
  `,
  header: css`
    position: sticky;
    top: 0;
    z-index: 1;
    flex-shrink: 0;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg);
  `,
  headerActions: css`
    display: flex;
    align-items: center;
    gap: 8px;
  `,
  closeButton: css`
    display: none;

    ${MOBILE_MEDIA} {
      display: inline-flex;
    }
  `,
  title: css`
    font-size: 13px;
    font-weight: 500;
  `,
  badge: css`
    padding: 1px 8px;
    border-radius: 999px;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    font-size: 11px;
    color: var(--color-fg-muted);
  `,
  section: css`
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  `,
  row: css`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  `,
  field: css`
    display: flex;
    flex-direction: column;
    gap: 6px;
  `,
  labelRow: css`
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  `,
  label: css`
    font-size: 12px;
    color: var(--color-fg-muted);
  `,
  hint: css`
    font-size: 11px;
    color: var(--color-fg-subtle);
  `,
  textInput: css`
    height: 32px;
    padding: 0 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-bg-elevated);
    font-family: var(--font-mono);
    font-size: 13px;

    &::placeholder {
      color: var(--color-fg-subtle);
    }

    &:focus {
      outline: none;
      border-color: var(--color-accent);
      box-shadow: 0 0 0 3px var(--color-accent-faint);
    }
  `,
  range: css`
    width: 100%;
    height: 4px;
    margin: 10px 0;
    border-radius: 2px;
    background: var(--color-border-strong);
    appearance: none;
    -webkit-appearance: none;
    outline: none;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--color-fg);
      border: 2px solid var(--color-bg);
      box-shadow: 0 0 0 1px var(--color-border-strong);
      cursor: pointer;
    }

    &::-moz-range-thumb {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--color-fg);
      border: 2px solid var(--color-bg);
      box-shadow: 0 0 0 1px var(--color-border-strong);
      cursor: pointer;
    }
  `,
  empty: css`
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 20px 16px;
  `,
  emptyTitle: css`
    font-size: 13px;
    color: var(--color-fg-muted);
  `,
  tips: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
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
};
