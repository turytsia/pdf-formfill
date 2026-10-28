import { useEffect } from 'react';

// A pinch-zoomed page also shrinks the visual viewport; only keyboard changes keep scale at 1.
const UNZOOMED_TOLERANCE = 0.01;

// Mobile keyboards shrink the visual viewport, and iOS also pans it to reveal the
// focused field. Publishing its size and offset lets the editor pin itself to the
// visible area, so the collapsed properties header sits right above the keyboard.
export function useVisualViewport(): void {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }
    const root = document.documentElement;
    const update = (): void => {
      if (Math.abs(viewport.scale - 1) > UNZOOMED_TOLERANCE) {
        clearVariables(root);
        return;
      }
      root.style.setProperty('--app-height', `${viewport.height}px`);
      root.style.setProperty('--app-top', `${viewport.offsetTop}px`);
    };
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      clearVariables(root);
    };
  }, []);
}

function clearVariables(root: HTMLElement): void {
  root.style.removeProperty('--app-height');
  root.style.removeProperty('--app-top');
}
