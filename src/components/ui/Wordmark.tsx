import type React from 'react';
import { css } from '@emotion/css';
import { PenLine } from 'lucide-react';

export const Wordmark: React.FC = () => (
  <div className={styles.root}>
    <span className={styles.mark} aria-hidden>
      <PenLine size={12} strokeWidth={2.5} />
    </span>
    <span className={styles.name}>Formfill</span>
  </div>
);

const styles = {
  root: css`
    display: inline-flex;
    align-items: center;
    gap: 10px;
  `,
  mark: css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 6px;
    background: var(--color-fg);
    color: #000;
  `,
  name: css`
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.02em;
  `,
};
