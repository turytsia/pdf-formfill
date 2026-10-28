import type React from 'react';
import { css } from '@emotion/css';
import { LoaderCircle } from 'lucide-react';
import { SPIN } from '../../styles/animations';

export const LoadingScreen: React.FC = () => (
  <div className={styles.root} role='status' aria-live='polite'>
    <LoaderCircle size={18} className={styles.spinner} />
    <span>Preparing your document…</span>
  </div>
);

const styles = {
  root: css`
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: var(--color-fg-muted);
    font-size: 14px;
  `,
  spinner: css`
    animation: ${SPIN} 0.8s linear infinite;
  `,
};
