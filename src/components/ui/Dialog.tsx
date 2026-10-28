import type React from 'react';
import { useEffect, useId, useRef } from 'react';
import { css } from '@emotion/css';
import { MOBILE_MEDIA } from '../../styles/breakpoints';

interface DialogProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  actions: React.ReactNode;
  onClose: () => void;
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  title,
  children,
  actions,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // The native dialog gives focus trapping, Escape and the top layer for free.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleClick = (event: React.MouseEvent<HTMLDialogElement>): void => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.root}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={handleClick}
    >
      <div className={styles.content}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <div className={styles.body}>{children}</div>
        <div className={styles.actions}>{actions}</div>
      </div>
    </dialog>
  );
};

const styles = {
  root: css`
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--color-fg);
    max-width: none;

    &::backdrop {
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
    }
  `,
  content: css`
    width: min(440px, calc(100vw - 32px));
    padding: 24px;
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
    background: var(--color-bg-elevated);
    box-shadow: var(--shadow-floating);
  `,
  title: css`
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.01em;
  `,
  body: css`
    margin-top: 8px;
    font-size: 14px;
    line-height: 1.55;
    color: var(--color-fg-muted);
  `,
  actions: css`
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 24px;

    ${MOBILE_MEDIA} {
      flex-direction: column-reverse;
      align-items: stretch;
    }
  `,
};
