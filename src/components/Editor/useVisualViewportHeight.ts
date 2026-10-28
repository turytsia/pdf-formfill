import { useEffect } from 'react';

export const APP_HEIGHT_VARIABLE = '--app-height';

// Mobile keyboards shrink the visual viewport but not the layout viewport;
// publishing the visible height lets the editor stay above the keyboard.
export function useVisualViewportHeight(): void {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }
    const root = document.documentElement;
    const update = (): void => {
      root.style.setProperty(APP_HEIGHT_VARIABLE, `${viewport.height}px`);
    };
    update();
    viewport.addEventListener('resize', update);
    return () => {
      viewport.removeEventListener('resize', update);
      root.style.removeProperty(APP_HEIGHT_VARIABLE);
    };
  }, []);
}
