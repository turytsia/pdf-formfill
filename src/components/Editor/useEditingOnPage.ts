import { useEffect, useState } from 'react';

const isOnPageField = (target: EventTarget | null): boolean =>
  target instanceof HTMLInputElement &&
  target.closest('[data-page-index]') !== null;

// True while a text field placed on a page has focus, i.e. the on-screen keyboard is up on phones.
export function useEditingOnPage(): boolean {
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const handleFocusIn = (event: FocusEvent): void => {
      setEditing(isOnPageField(event.target));
    };
    const handleFocusOut = (event: FocusEvent): void => {
      setEditing(isOnPageField(event.relatedTarget));
    };
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return editing;
}
