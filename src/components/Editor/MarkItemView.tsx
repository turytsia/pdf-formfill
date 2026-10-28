import type React from 'react';
import { css } from '@emotion/css';
import { MARK_STROKE_RATIO } from '../../state/constants';
import { useEditor } from '../../state/EditorContext';
import type { MarkItem, PageGeometry } from '../../state/types';
import { toScreenPoint } from '../../utilities/geometry';
import { startPointerDrag } from '../../utilities/pointerDrag';
import { COARSE_POINTER_MEDIA } from '../../styles/breakpoints';

interface MarkItemViewProps {
  item: MarkItem;
  geometry: PageGeometry;
}

const HIT_PADDING = 4;

export const MarkItemView: React.FC<MarkItemViewProps> = ({
  item,
  geometry,
}) => {
  const { state, dispatch } = useEditor();
  const { zoom } = state;
  const selected = state.selectedId === item.id;
  const size = item.size * zoom;
  const topLeft = toScreenPoint(
    geometry,
    { x: item.x - item.size / 2, y: item.y + item.size / 2 },
    zoom,
  );

  const handlePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
  ): void => {
    event.currentTarget.focus();
    dispatch({ type: 'select', id: item.id });
    const { x, y } = item;
    const batch = `move-${item.id}-${event.timeStamp}`;
    startPointerDrag(event, {
      onMove: (delta) =>
        dispatch({
          type: 'updateMark',
          id: item.id,
          changes: { x: x + delta.x / zoom, y: y - delta.y / zoom },
          batch,
        }),
    });
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
  ): void => {
    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      dispatch({ type: 'removeItem', id: item.id });
    }
    if (event.key === 'Escape') {
      event.currentTarget.blur();
    }
  };

  return (
    <button
      type='button'
      className={styles.mark}
      data-selected={selected}
      aria-label='X mark'
      style={{
        left: topLeft.x - HIT_PADDING,
        top: topLeft.y - HIT_PADDING,
        width: size + HIT_PADDING * 2,
        height: size + HIT_PADDING * 2,
      }}
      onPointerDown={handlePointerDown}
      onFocus={() => dispatch({ type: 'select', id: item.id })}
      onKeyDown={handleKeyDown}
    >
      <svg viewBox='0 0 1 1' className={styles.glyph} aria-hidden>
        <line x1={0} y1={0} x2={1} y2={1} />
        <line x1={0} y1={1} x2={1} y2={0} />
      </svg>
    </button>
  );
};

const styles = {
  mark: css`
    position: absolute;
    display: block;
    padding: ${HIT_PADDING}px;
    border-radius: 3px;
    outline: 1px solid transparent;
    line-height: 0;
    cursor: grab;
    touch-action: none;
    transition: outline-color 100ms ease;

    &:hover {
      outline-color: var(--color-accent-muted);
    }

    &[data-selected='true'] {
      outline-color: var(--color-accent);
    }

    &:active {
      cursor: grabbing;
    }

    ${COARSE_POINTER_MEDIA} {
      &::before {
        content: '';
        position: absolute;
        inset: -12px;
      }
    }
  `,
  glyph: css`
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
    fill: none;
    stroke: var(--color-ink);
    stroke-width: ${MARK_STROKE_RATIO};
    stroke-linecap: round;
  `,
};
