import type React from 'react';
import type { Point } from '../state/types';

export interface PointerDragHandlers {
  onMove: (delta: Point) => void;
  onEnd?: () => void;
}

export function startPointerDrag(
  event: React.PointerEvent<HTMLElement>,
  handlers: PointerDragHandlers,
): void {
  event.preventDefault();
  event.stopPropagation();

  const target = event.currentTarget;
  const origin: Point = { x: event.clientX, y: event.clientY };
  target.setPointerCapture(event.pointerId);

  const handleMove = (moveEvent: PointerEvent): void => {
    handlers.onMove({
      x: moveEvent.clientX - origin.x,
      y: moveEvent.clientY - origin.y,
    });
  };

  const finish = (): void => {
    target.removeEventListener('pointermove', handleMove);
    target.removeEventListener('pointerup', finish);
    target.removeEventListener('pointercancel', finish);
    handlers.onEnd?.();
  };

  target.addEventListener('pointermove', handleMove);
  target.addEventListener('pointerup', finish);
  target.addEventListener('pointercancel', finish);
}
