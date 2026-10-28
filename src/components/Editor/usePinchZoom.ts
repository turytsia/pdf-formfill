import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { MAX_ZOOM, MIN_ZOOM } from '../../state/constants';
import { useEditor } from '../../state/EditorContext';
import type { Point } from '../../state/types';
import { clamp } from '../../utilities/geometry';

// Safari's non-standard pinch events, missing from the DOM typings.
interface SafariGestureEvent extends UIEvent {
  scale: number;
  clientX: number;
  clientY: number;
}

// A spot on a page (as fractions of its box) that must stay under the focus point.
interface ZoomAnchor {
  page: Element;
  fraction: Point;
  focus: Point;
}

// The gesture's effect so far, shown as a transform of the page stack.
interface ZoomPreview {
  scale: number;
  x: number;
  y: number;
  focus: Point;
}

interface TouchPinch {
  distance: number;
  scale: number;
  // The pinch-start midpoint relative to the untransformed content origin, in preview units.
  anchor: Point;
}

// Trackpad pinch arrives as small deltas, a mouse wheel notch as ~100.
const WHEEL_ZOOM_SENSITIVITY = 0.01;
const MAX_WHEEL_STEP = 50;
// Wheel and trackpad gestures have no end event; the zoom commits once they pause.
const WHEEL_COMMIT_DELAY_MS = 120;

// While a gesture runs, the page stack is only scaled and moved with a compositor
// transform, so nothing is laid out or scrolled per frame and the content stays
// glued to the fingers or cursor. The real zoom is committed once, when the gesture
// ends, anchored so the committed layout lands exactly where the preview was.
export function usePinchZoom(
  scrollRef: RefObject<HTMLDivElement | null>,
  contentRef: RefObject<HTMLDivElement | null>,
): void {
  const { state, dispatch } = useEditor();
  const { zoom } = state;
  const committedZoomRef = useRef(zoom);
  const pendingAnchorRef = useRef<ZoomAnchor | null>(null);

  useEffect(() => {
    const container = scrollRef.current;
    const content = contentRef.current;
    if (!container || !content) {
      return;
    }

    let preview: ZoomPreview | null = null;
    let pinch: TouchPinch | null = null;
    // Safari's last reported gesture scale while one of its trackpad gestures runs.
    let gestureScale: number | null = null;
    let activeTouches = 0;
    let commitTimer = 0;

    const startPreview = (): ZoomPreview => {
      if (!preview) {
        preview = { scale: 1, x: 0, y: 0, focus: { x: 0, y: 0 } };
        content.style.transformOrigin = '0 0';
        content.style.willChange = 'transform';
      }
      return preview;
    };

    const show = (current: ZoomPreview): void => {
      content.style.transform = `translate(${current.x}px, ${current.y}px) scale(${current.scale})`;
    };

    // Where the content's top-left corner would be without the preview transform.
    const originOf = (current: ZoomPreview): Point => {
      const rect = content.getBoundingClientRect();
      return { x: rect.left - current.x, y: rect.top - current.y };
    };

    const clampScale = (scale: number): number =>
      clamp(
        scale,
        MIN_ZOOM / committedZoomRef.current,
        MAX_ZOOM / committedZoomRef.current,
      );

    const scaleAround = (factor: number, focus: Point): void => {
      const current = startPreview();
      const origin = originOf(current);
      const scale = clampScale(current.scale * factor);
      const step = scale / current.scale;
      const fx = focus.x - origin.x;
      const fy = focus.y - origin.y;
      current.x = fx + step * (current.x - fx);
      current.y = fy + step * (current.y - fy);
      current.scale = scale;
      current.focus = focus;
      show(current);
    };

    const commit = (): void => {
      window.clearTimeout(commitTimer);
      const current = preview;
      if (!current) {
        return;
      }
      preview = null;
      const nextZoom = clamp(
        committedZoomRef.current * current.scale,
        MIN_ZOOM,
        MAX_ZOOM,
      );
      if (Math.abs(nextZoom - committedZoomRef.current) < 0.001) {
        // Only moved: hand the translation over to the scroll position.
        clearTransform(content);
        container.scrollLeft -= current.x;
        container.scrollTop -= current.y;
        return;
      }
      // Measured while the preview is still on screen.
      pendingAnchorRef.current = findAnchor(container, current.focus);
      committedZoomRef.current = nextZoom;
      dispatch({ type: 'setZoom', zoom: nextZoom });
    };

    const handleTouchStart = (event: TouchEvent): void => {
      activeTouches = event.touches.length;
      if (event.touches.length !== 2) {
        return;
      }
      // Touch input drives the pinch even if Safari already started a gesture for it.
      gestureScale = null;
      const current = startPreview();
      const [a, b] = firstTwoPoints(event.touches);
      const midpoint = midpointOf(a, b);
      const origin = originOf(current);
      pinch = {
        distance: distanceBetween(a, b),
        scale: current.scale,
        anchor: {
          x: midpoint.x - origin.x - current.x,
          y: midpoint.y - origin.y - current.y,
        },
      };
    };

    const handleTouchMove = (event: TouchEvent): void => {
      if (!pinch || !preview || event.touches.length < 2) {
        return;
      }
      // Keeps the browser from panning underneath the pinch.
      if (event.cancelable) {
        event.preventDefault();
      }
      const [a, b] = firstTwoPoints(event.touches);
      const midpoint = midpointOf(a, b);
      const origin = originOf(preview);
      const scale = clampScale(
        (pinch.scale * distanceBetween(a, b)) / pinch.distance,
      );
      const step = scale / pinch.scale;
      // The content that started under the fingers follows their midpoint.
      preview.x = midpoint.x - origin.x - step * pinch.anchor.x;
      preview.y = midpoint.y - origin.y - step * pinch.anchor.y;
      preview.scale = scale;
      preview.focus = midpoint;
      show(preview);
    };

    const handleTouchEnd = (event: TouchEvent): void => {
      activeTouches = event.touches.length;
      if (pinch && event.touches.length < 2) {
        pinch = null;
        commit();
      }
    };

    // Chrome, Edge and Firefox report a trackpad pinch (and Ctrl + wheel) this way.
    const handleWheel = (event: WheelEvent): void => {
      if (!event.ctrlKey && !event.metaKey) {
        // Plain scrolling should move the real layout, not a preview.
        commit();
        return;
      }
      event.preventDefault();
      if (gestureScale !== null) {
        return;
      }
      const delta = clamp(event.deltaY, -MAX_WHEEL_STEP, MAX_WHEEL_STEP);
      scaleAround(Math.exp(-delta * WHEEL_ZOOM_SENSITIVITY), {
        x: event.clientX,
        y: event.clientY,
      });
      window.clearTimeout(commitTimer);
      commitTimer = window.setTimeout(commit, WHEEL_COMMIT_DELAY_MS);
    };

    const handleGestureStart = (event: Event): void => {
      event.preventDefault();
      // iOS also reports touch pinches as gestures; the touch handlers own those.
      if (activeTouches === 0) {
        gestureScale = 1;
      }
    };

    const handleGestureChange = (event: Event): void => {
      event.preventDefault();
      if (gestureScale === null) {
        return;
      }
      const gesture = event as SafariGestureEvent;
      scaleAround(gesture.scale / gestureScale, {
        x: gesture.clientX,
        y: gesture.clientY,
      });
      gestureScale = gesture.scale;
    };

    const handleGestureEnd = (event: Event): void => {
      event.preventDefault();
      if (gestureScale === null) {
        return;
      }
      gestureScale = null;
      commit();
    };

    // Clicking or dragging must see the committed layout.
    const handlePointerDown = (event: PointerEvent): void => {
      if (event.pointerType !== 'touch') {
        commit();
      }
    };

    container.addEventListener('touchstart', handleTouchStart, {
      passive: true,
    });
    container.addEventListener('touchmove', handleTouchMove, {
      passive: false,
    });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('gesturestart', handleGestureStart);
    container.addEventListener('gesturechange', handleGestureChange);
    container.addEventListener('gestureend', handleGestureEnd);
    container.addEventListener('pointerdown', handlePointerDown, {
      capture: true,
    });
    return () => {
      window.clearTimeout(commitTimer);
      clearTransform(content);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('gesturestart', handleGestureStart);
      container.removeEventListener('gesturechange', handleGestureChange);
      container.removeEventListener('gestureend', handleGestureEnd);
      container.removeEventListener('pointerdown', handlePointerDown, {
        capture: true,
      });
    };
  }, [scrollRef, contentRef, dispatch]);

  // The new layout and the removal of the preview land in the same frame.
  useLayoutEffect(() => {
    committedZoomRef.current = zoom;
    const container = scrollRef.current;
    const content = contentRef.current;
    const anchor = pendingAnchorRef.current;
    if (!container || !content || !anchor) {
      return;
    }
    pendingAnchorRef.current = null;
    clearTransform(content);
    const rect = anchor.page.getBoundingClientRect();
    container.scrollLeft +=
      rect.left + anchor.fraction.x * rect.width - anchor.focus.x;
    container.scrollTop +=
      rect.top + anchor.fraction.y * rect.height - anchor.focus.y;
  }, [scrollRef, contentRef, zoom]);
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

function clearTransform(element: HTMLElement): void {
  element.style.transform = '';
  element.style.willChange = '';
}

function firstTwoPoints(touches: TouchList): [Point, Point] {
  return [
    { x: touches[0].clientX, y: touches[0].clientY },
    { x: touches[1].clientX, y: touches[1].clientY },
  ];
}

function distanceBetween(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpointOf(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
