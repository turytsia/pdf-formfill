import type React from 'react';
import { css } from '@emotion/css';

interface KbdProps {
  children: React.ReactNode;
}

export const Kbd: React.FC<KbdProps> = ({ children }) => (
  <kbd className={styles.root}>{children}</kbd>
);

const styles = {
  root: css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 4px;
    border: 1px solid var(--color-border-strong);
    background: var(--color-surface-active);
    color: var(--color-fg-muted);
    font-family: var(--font-sans);
    font-size: 11px;
    line-height: 1;
  `,
};
