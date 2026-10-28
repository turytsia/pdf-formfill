import { useEffect, type RefObject } from 'react';
import { isOnPageField } from './useEditingOnPage';

// Breathing room between the field and whatever would cover it.
const VISIBLE_MARGIN = 16;
// The on-screen keyboard shrinks the visual viewport well below the layout viewport.
const KEYBOARD_HEIGHT_THRESHOLD = 120;

// When the keyboard opens (or a field is focused while it is open), the field being
// edited may end up under the keyboard or the properties sheet; scroll it back into view.
export function useKeepFocusedFieldVisible(
  scrollRef: RefObject<HTMLDivElement | null>,
): void {
  useEffect(() => {
    let frame = 0;

    const reveal = (): void => {
      frame = 0;
      const container = scrollRef.current;
      const field = document.activeElement;
      if (!container || !isOnPageField(field) || !container.contains(field)) {
        return;
      }
      const fieldRect = field.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const top = containerRect.top + VISIBLE_MARGIN;
      const bottom =
        Math.min(containerRect.bottom, coveringSheetTop(fieldRect)) -
        VISIBLE_MARGIN;
      const left = containerRect.left + VISIBLE_MARGIN;

      if (fieldRect.bottom > bottom) {
        container.scrollTop += fieldRect.bottom - bottom;
      } else if (fieldRect.top < top) {
        container.scrollTop -= top - fieldRect.top;
      }
      if (fieldRect.left < left) {
        container.scrollLeft -= left - fieldRect.left;
      }
    };

    // Runs after React has collapsed the sheet for the newly focused field.
    const schedule = (): void => {
      if (frame === 0) {
        frame = requestAnimationFrame(reveal);
      }
    };

    // Without a keyboard, whoever moved the focus owns the scroll position
    // (revealing a field from the list centres it with a smooth scroll).
    const handleFocusIn = (): void => {
      if (isKeyboardOpen()) {
        schedule();
      }
    };

    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    document.addEventListener('focusin', handleFocusIn);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener('resize', schedule);
      viewport?.removeEventListener('scroll', schedule);
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, [scrollRef]);
}

// On phones the properties sheet overlays the bottom of the canvas; on desktop it
// sits beside the canvas and never covers a field.
function coveringSheetTop(fieldRect: DOMRect): number {
  const sheet = document.querySelector('[data-properties-panel]');
  if (!sheet) {
    return Number.POSITIVE_INFINITY;
  }
  const rect = sheet.getBoundingClientRect();
  const overlapsHorizontally =
    rect.width > 0 &&
    rect.left < fieldRect.right &&
    rect.right > fieldRect.left;
  return overlapsHorizontally ? rect.top : Number.POSITIVE_INFINITY;
}

function isKeyboardOpen(): boolean {
  const viewport = window.visualViewport;
  return (
    viewport !== null &&
    window.innerHeight - viewport.height > KEYBOARD_HEIGHT_THRESHOLD
  );
}
