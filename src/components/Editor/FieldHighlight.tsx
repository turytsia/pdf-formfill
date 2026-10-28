import type React from 'react';
import { css } from '@emotion/css';
import { FieldKind, type Box } from '../../detection/types';
import { boxesOf, type FieldTarget } from '../../state/snapItem';
import type { PageGeometry } from '../../state/types';
import { toScreenPoint } from '../../utilities/geometry';

interface FieldHighlightProps {
  target: FieldTarget;
  geometry: PageGeometry;
  zoom: number;
}

// Shows which detected field a click would snap to, and for rows the box typing starts in.
export const FieldHighlight: React.FC<FieldHighlightProps> = ({
  target,
  geometry,
  zoom,
}) => {
  const boxes = boxesOf(target.field);

  return (
    <>
      <div
        className={styles.field}
        style={toScreenRect(unionOf(boxes), geometry, zoom)}
        aria-hidden
      />
      {target.field.kind === FieldKind.BoxRow && (
        <div
          className={styles.start}
          style={toScreenRect(boxes[target.boxIndex], geometry, zoom)}
          aria-hidden
        />
      )}
    </>
  );
};

function unionOf(boxes: Array<Box>): Box {
  return {
    left: Math.min(...boxes.map((box) => box.left)),
    right: Math.max(...boxes.map((box) => box.right)),
    top: Math.max(...boxes.map((box) => box.top)),
    bottom: Math.min(...boxes.map((box) => box.bottom)),
  };
}

function toScreenRect(
  box: Box,
  geometry: PageGeometry,
  zoom: number,
): React.CSSProperties {
  const topLeft = toScreenPoint(geometry, { x: box.left, y: box.top }, zoom);
  return {
    left: topLeft.x,
    top: topLeft.y,
    width: (box.right - box.left) * zoom,
    height: (box.top - box.bottom) * zoom,
  };
}

const styles = {
  field: css`
    position: absolute;
    border-radius: 2px;
    background: var(--color-accent-faint);
    box-shadow: 0 0 0 1.5px var(--color-accent-muted);
    pointer-events: none;
  `,
  start: css`
    position: absolute;
    border-radius: 2px;
    background: rgba(0, 112, 243, 0.22);
    pointer-events: none;
  `,
};
