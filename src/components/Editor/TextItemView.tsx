import type React from 'react';
import { css } from '@emotion/css';
import { GripVertical } from 'lucide-react';
import { MAX_SPACING } from '../../state/constants';
import { useEditor } from '../../state/EditorContext';
import type { TextChanges } from '../../state/editorReducer';
import type { PageGeometry, TextItem } from '../../state/types';
import {
  clamp,
  getMinSpacing,
  getTextCellCount,
  toScreenPoint,
} from '../../utilities/geometry';
import { startPointerDrag } from '../../utilities/pointerDrag';
import { COARSE_POINTER_MEDIA } from '../../styles/breakpoints';

interface TextItemViewProps {
  item: TextItem;
  geometry: PageGeometry;
}

export const TextItemView: React.FC<TextItemViewProps> = ({
  item,
  geometry,
}) => {
  const { state, dispatch, font } = useEditor();
  const { zoom } = state;
  const { metrics, family } = font;
  const selected = state.selectedId === item.id;

  const cellCount = getTextCellCount(item);
  const cell = item.spacing * zoom;
  const glyphAdvance = metrics.advance * item.fontSize * zoom;
  const height = (metrics.ascent + metrics.descent) * item.fontSize * zoom;
  const width = cellCount * cell;
  const topLeft = toScreenPoint(
    geometry,
    { x: item.x, y: item.baseline + metrics.ascent * item.fontSize },
    zoom,
  );

  const update = (changes: TextChanges, batch: string): void =>
    dispatch({ type: 'updateText', id: item.id, changes, batch });
  const remove = (): void => dispatch({ type: 'removeItem', id: item.id });

  const handleMoveStart = (event: React.PointerEvent<HTMLElement>): void => {
    const { x, baseline } = item;
    const batch = `move-${item.id}-${event.timeStamp}`;
    startPointerDrag(event, {
      onMove: (delta) =>
        update(
          { x: x + delta.x / zoom, baseline: baseline - delta.y / zoom },
          batch,
        ),
    });
  };

  const handleStretchStart = (event: React.PointerEvent<HTMLElement>): void => {
    const startSpacing = item.spacing;
    const minSpacing = getMinSpacing(item.fontSize, metrics);
    const batch = `stretch-${item.id}-${event.timeStamp}`;
    startPointerDrag(event, {
      onMove: (delta) =>
        update(
          {
            spacing: clamp(
              startSpacing + delta.x / zoom / cellCount,
              minSpacing,
              MAX_SPACING,
            ),
          },
          batch,
        ),
    });
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>): void => {
    const movesToPanel =
      event.relatedTarget instanceof Element &&
      event.relatedTarget.closest('[data-properties-panel]') !== null;
    if (item.text.trim() === '' && !movesToPanel) {
      remove();
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ): void => {
    if (event.key === 'Escape') {
      event.currentTarget.blur();
    }
    if (event.key === 'Backspace' && item.text === '') {
      event.preventDefault();
      remove();
    }
  };

  return (
    <div
      className={styles.item}
      data-selected={selected}
      style={{
        left: topLeft.x,
        top: topLeft.y,
        width,
        height,
        backgroundSize: `${cell}px 100%`,
      }}
    >
      <input
        className={styles.input}
        style={{
          fontFamily: `'${family}', monospace`,
          fontSize: item.fontSize * zoom,
          lineHeight: `${height}px`,
          height,
          width: width + cell,
          paddingLeft: (cell - glyphAdvance) / 2,
          letterSpacing: cell - glyphAdvance,
        }}
        value={item.text}
        autoFocus
        spellCheck={false}
        autoComplete='off'
        aria-label='Form text'
        onChange={(event) =>
          update({ text: event.target.value }, `text-${item.id}`)
        }
        onFocus={() => dispatch({ type: 'select', id: item.id })}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
      {selected && (
        <>
          <button
            type='button'
            className={styles.grip}
            aria-label='Move text'
            onPointerDown={handleMoveStart}
          >
            <GripVertical size={10} />
          </button>
          <button
            type='button'
            className={styles.stretchHandle}
            aria-label='Adjust letter spacing'
            onPointerDown={handleStretchStart}
          />
        </>
      )}
    </div>
  );
};

const styles = {
  item: css`
    position: absolute;
    outline: 1px solid transparent;
    background-repeat: repeat-x;
    transition: outline-color 100ms ease;

    &:hover {
      outline-color: var(--color-accent-muted);
    }

    &[data-selected='true'] {
      outline-color: var(--color-accent);
      background-image: linear-gradient(
        to right,
        var(--color-accent-muted) 1px,
        transparent 1px
      );
      box-shadow: inset -1px 0 0 var(--color-accent-muted);
    }
  `,
  input: css`
    position: absolute;
    left: 0;
    top: 0;
    display: block;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--color-ink);
    outline: none;
    white-space: pre;
    overflow: hidden;
    caret-color: var(--color-accent);

    &::selection {
      background: rgba(0, 112, 243, 0.25);
    }
  `,
  grip: css`
    position: absolute;
    left: -22px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 24px;
    border-radius: 5px;
    border: 1px solid var(--color-border-strong);
    background: var(--color-surface);
    color: var(--color-fg-muted);
    cursor: grab;
    touch-action: none;

    &:hover {
      color: var(--color-fg);
      border-color: var(--color-fg-subtle);
    }

    &:active {
      cursor: grabbing;
    }

    ${COARSE_POINTER_MEDIA} {
      left: -36px;
      width: 28px;
      height: 40px;
    }
  `,
  stretchHandle: css`
    position: absolute;
    right: -12px;
    top: -4px;
    bottom: -4px;
    width: 8px;
    border-radius: 4px;
    border: 1px solid var(--color-bg-elevated);
    background: var(--color-accent);
    box-shadow: 0 0 0 1px var(--color-accent-muted);
    cursor: ew-resize;
    touch-action: none;

    /* Invisible hit area so the slim pill stays easy to grab. */
    &::before {
      content: '';
      position: absolute;
      inset: -6px -5px;
    }

    &:hover {
      background: #3291ff;
    }

    ${COARSE_POINTER_MEDIA} {
      right: -20px;
      top: -8px;
      bottom: -8px;
      width: 12px;

      &::before {
        inset: -12px -14px;
      }
    }
  `,
};
