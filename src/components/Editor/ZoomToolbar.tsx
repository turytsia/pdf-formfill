import type React from 'react';
import { css } from '@emotion/css';
import { Maximize, Minus, Plus } from 'lucide-react';
import { MAX_ZOOM, MIN_ZOOM, ZOOM_STEP } from '../../state/constants';
import { useEditor } from '../../state/EditorContext';
import { MOBILE_MEDIA } from '../../styles/breakpoints';
import { roundZoom } from '../../utilities/geometry';
import { IconButton } from '../ui/IconButton';

interface ZoomToolbarProps {
  onFit: () => void;
  // The properties sheet covers this spot on phones; pinch still zooms.
  hiddenOnMobile: boolean;
}

export const ZoomToolbar: React.FC<ZoomToolbarProps> = ({
  onFit,
  hiddenOnMobile,
}) => {
  const { state, dispatch } = useEditor();
  const setZoom = (zoom: number): void =>
    dispatch({ type: 'setZoom', zoom: roundZoom(zoom) });

  return (
    <div
      className={styles.root}
      role='toolbar'
      aria-label='Zoom'
      data-hidden-on-mobile={hiddenOnMobile}
    >
      <IconButton
        aria-label='Zoom out'
        disabled={state.zoom <= MIN_ZOOM}
        onClick={() => setZoom(state.zoom - ZOOM_STEP)}
      >
        <Minus size={14} />
      </IconButton>
      <button
        type='button'
        className={styles.zoomValue}
        title='Reset zoom'
        onClick={() => setZoom(1)}
      >
        {Math.round(state.zoom * 100)}%
      </button>
      <IconButton
        aria-label='Zoom in'
        disabled={state.zoom >= MAX_ZOOM}
        onClick={() => setZoom(state.zoom + ZOOM_STEP)}
      >
        <Plus size={14} />
      </IconButton>
      <span className={styles.divider} />
      <IconButton
        aria-label='Fit to width'
        title='Fit to width'
        onClick={onFit}
      >
        <Maximize size={14} />
      </IconButton>
    </div>
  );
};

const styles = {
  root: css`
    position: absolute;
    left: 50%;
    bottom: 20px;
    z-index: 2;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 6px;
    border-radius: 14px;
    background: rgba(10, 10, 10, 0.85);
    backdrop-filter: blur(16px);
    box-shadow: var(--shadow-floating);

    ${MOBILE_MEDIA} {
      &[data-hidden-on-mobile='true'] {
        display: none;
      }
    }
  `,
  divider: css`
    width: 1px;
    height: 20px;
    margin: 0 4px;
    background: var(--color-border);
  `,
  zoomValue: css`
    min-width: 48px;
    height: 32px;
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--color-fg-muted);

    &:hover {
      background: var(--color-surface-hover);
      color: var(--color-fg);
    }
  `,
};
