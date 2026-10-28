// Focusing selects the item (its view handles onFocus); scrolling brings it into view.
export function revealItem(id: string): void {
  const element = document.querySelector<HTMLElement>(
    `[data-item-id="${CSS.escape(id)}"]`,
  );
  if (!element) {
    return;
  }
  const target = element.matches('input, button')
    ? element
    : element.querySelector<HTMLElement>('input');
  target?.focus({ preventScroll: true });
  element.scrollIntoView({
    block: 'center',
    inline: 'center',
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
