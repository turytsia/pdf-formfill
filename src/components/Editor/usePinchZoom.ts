import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { MAX_ZOOM, MIN_ZOOM } from '../../state/constants';
import { useEditor } from '../../state/EditorContext';
import type { Point } from '../../state/types';
import { clamp } from '../../utilities/geometry';

interface PinchGesture {
  pointers: Map<number, Point>;
  startDistance: number;
  startZoom: number;
  // Scroll offsets that keep the pinch midpoint still once the zoomed layout is in place.
  pendingScroll: Point | null;
}

const distanceBetween = (points: Array<Point>): number =>
  Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);

const midpointOf = (points: Array<Point>): Point => ({
  x: (points[0].x + points[1].x) / 2,
  y: (points[0].y + points[1].y) / 2,
});

export function usePinchZoom(
  scrollRef: RefObject<HTMLDivElement | null>,
): void {
  const { state, dispatch } = useEditor();
  const { zoom } = state;
  const gestureRef = useRef<PinchGesture>({
    pointers: new Map(),
    startDistance: 0,
    startZoom: 1,
    pendingScroll: null,
  });

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }
    const gesture = gestureRef.current;

    const handlePointerDown = (event: PointerEvent): void => {
      if (event.pointerType !== 'touch') {
        return;
      }
      gesture.pointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      if (gesture.pointers.size === 2) {
        gesture.startDistance = distanceBetween([...gesture.pointers.values()]);
        gesture.startZoom = zoom;
      }
    };

    const handlePointerMove = (event: PointerEvent): void => {
      if (!gesture.pointers.has(event.pointerId)) {
        return;
      }
      gesture.pointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      if (gesture.pointers.size !== 2 || gesture.startDistance === 0) {
        return;
      }

      const points = [...gesture.pointers.values()];
      const next = clamp(
        (gesture.startZoom * distanceBetween(points)) / gesture.startDistance,
        MIN_ZOOM,
        MAX_ZOOM,
      );
      if (Math.abs(next - zoom) < 0.01) {
        return;
      }

      const bounds = container.getBoundingClientRect();
      const focus = midpointOf(points);
      const focusX = focus.x - bounds.left;
      const focusY = focus.y - bounds.top;
      const scale = next / zoom;
      gesture.pendingScroll = {
        x: (container.scrollLeft + focusX) * scale - focusX,
        y: (container.scrollTop + focusY) * scale - focusY,
      };
      dispatch({ type: 'setZoom', zoom: next });
    };

    const handlePointerEnd = (event: PointerEvent): void => {
      gesture.pointers.delete(event.pointerId);
      if (gesture.pointers.size < 2) {
        gesture.startDistance = 0;
      }
    };

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerEnd);
    container.addEventListener('pointercancel', handlePointerEnd);
    return () => {
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerEnd);
      container.removeEventListener('pointercancel', handlePointerEnd);
    };
  }, [scrollRef, zoom, dispatch]);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    const pending = gestureRef.current.pendingScroll;
    if (!container || !pending) {
      return;
    }
    gestureRef.current.pendingScroll = null;
    container.scrollLeft = pending.x;
    container.scrollTop = pending.y;
  }, [scrollRef, zoom]);
}
