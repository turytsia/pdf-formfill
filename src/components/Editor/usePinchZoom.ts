import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { MAX_ZOOM, MIN_ZOOM } from '../../state/constants';
import { useEditor } from '../../state/EditorContext';
import type { Point } from '../../state/types';
import { clamp } from '../../utilities/geometry';

// Safari's non-standard trackpad pinch events, missing from the DOM typings.
interface SafariGestureEvent extends UIEvent {
  scale: number;
  clientX: number;
  clientY: number;
}

// Trackpad pinch arrives as small deltas, a mouse wheel notch as ~100.
const WHEEL_ZOOM_SENSITIVITY = 0.01;
const MAX_WHEEL_STEP = 50;

// A spot on a page (as fractions of its box) that must stay under the focus point.
interface ZoomAnchor {
  page: Element;
  fraction: Point;
  focus: Point;
}

export function usePinchZoom(
  scrollRef: RefObject<HTMLDivElement | null>,
): void {
  const { state, dispatch } = useEditor();
  const { zoom } = state;
  // Several gesture events can arrive before React re-renders, so the latest
  // requested zoom is tracked separately from the one in state.
  const requestedZoomRef = useRef(zoom);
  const pendingAnchorRef = useRef<ZoomAnchor | null>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    // Gesture events outpace rendering, so at most one zoom is applied per frame.
    let frame = 0;
    let queuedZoom: number | null = null;
    let queuedFocus: Point | null = null;

    const flushZoom = (): void => {
      frame = 0;
      if (queuedZoom === null || !queuedFocus) {
        return;
      }
      const next = queuedZoom;
      const focus = queuedFocus;
      queuedZoom = null;
      queuedFocus = null;
      if (Math.abs(next - requestedZoomRef.current) < 0.001) {
        return;
      }
      pendingAnchorRef.current = findAnchor(container, focus);
      requestedZoomRef.current = next;
      dispatch({ type: 'setZoom', zoom: next });
    };

    const currentZoom = (): number => queuedZoom ?? requestedZoomRef.current;

    const zoomAround = (requested: number, focus: Point): void => {
      queuedZoom = clamp(requested, MIN_ZOOM, MAX_ZOOM);
      queuedFocus = focus;
      if (frame === 0) {
        frame = requestAnimationFrame(flushZoom);
      }
    };

    const pointers = new Map<number, Point>();
    let pinchStartDistance = 0;
    let pinchStartZoom = 1;

    const handlePointerDown = (event: PointerEvent): void => {
      if (event.pointerType !== 'touch') {
        return;
      }
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size === 2) {
        pinchStartDistance = distanceBetween([...pointers.values()]);
        pinchStartZoom = currentZoom();
      }
    };

    const handlePointerMove = (event: PointerEvent): void => {
      if (!pointers.has(event.pointerId)) {
        return;
      }
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size !== 2 || pinchStartDistance === 0) {
        return;
      }
      const points = [...pointers.values()];
      zoomAround(
        (pinchStartZoom * distanceBetween(points)) / pinchStartDistance,
        midpointOf(points),
      );
    };

    const handlePointerEnd = (event: PointerEvent): void => {
      pointers.delete(event.pointerId);
      if (pointers.size < 2) {
        pinchStartDistance = 0;
      }
    };

    // Chrome, Edge and Firefox report a trackpad pinch (and Ctrl + wheel) this way.
    const handleWheel = (event: WheelEvent): void => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }
      event.preventDefault();
      const delta = clamp(event.deltaY, -MAX_WHEEL_STEP, MAX_WHEEL_STEP);
      zoomAround(currentZoom() * Math.exp(-delta * WHEEL_ZOOM_SENSITIVITY), {
        x: event.clientX,
        y: event.clientY,
      });
    };

    let gestureStartZoom = 1;

    const handleGestureStart = (event: Event): void => {
      event.preventDefault();
      gestureStartZoom = currentZoom();
    };

    const handleGestureChange = (event: Event): void => {
      event.preventDefault();
      const gesture = event as SafariGestureEvent;
      zoomAround(gestureStartZoom * gesture.scale, {
        x: gesture.clientX,
        y: gesture.clientY,
      });
    };

    const preventDefault = (event: Event): void => event.preventDefault();

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerEnd);
    container.addEventListener('pointercancel', handlePointerEnd);
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('gesturestart', handleGestureStart);
    container.addEventListener('gesturechange', handleGestureChange);
    container.addEventListener('gestureend', preventDefault);
    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerEnd);
      container.removeEventListener('pointercancel', handlePointerEnd);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('gesturestart', handleGestureStart);
      container.removeEventListener('gesturechange', handleGestureChange);
      container.removeEventListener('gestureend', preventDefault);
    };
  }, [scrollRef, dispatch]);

  useLayoutEffect(() => {
    requestedZoomRef.current = zoom;
    const container = scrollRef.current;
    const anchor = pendingAnchorRef.current;
    if (!container || !anchor) {
      return;
    }
    pendingAnchorRef.current = null;
    const rect = anchor.page.getBoundingClientRect();
    container.scrollLeft +=
      rect.left + anchor.fraction.x * rect.width - anchor.focus.x;
    container.scrollTop +=
      rect.top + anchor.fraction.y * rect.height - anchor.focus.y;
  }, [scrollRef, zoom]);
}

// Padding and page gaps don't scale with zoom, so the anchor is tied to a page.
function findAnchor(container: HTMLElement, focus: Point): ZoomAnchor | null {
  const pages = Array.from(container.querySelectorAll('[data-page-index]'));
  let best: { page: Element; rect: DOMRect; distance: number } | null = null;
  for (const page of pages) {
    const rect = page.getBoundingClientRect();
    const dy = Math.max(rect.top - focus.y, 0, focus.y - rect.bottom);
    if (!best || dy < best.distance) {
      best = { page, rect, distance: dy };
    }
  }
  if (!best) {
    return null;
  }
  return {
    page: best.page,
    fraction: {
      x: (focus.x - best.rect.left) / best.rect.width,
      y: (focus.y - best.rect.top) / best.rect.height,
    },
    focus,
  };
}

function distanceBetween(points: Array<Point>): number {
  return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
}

function midpointOf(points: Array<Point>): Point {
  return {
    x: (points[0].x + points[1].x) / 2,
    y: (points[0].y + points[1].y) / 2,
  };
}
