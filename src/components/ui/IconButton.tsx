import type React from 'react';
import { css, cx } from '@emotion/css';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  className,
  children,
  ...rest
}) => (
  <button type='button' className={cx(styles.root, className)} {...rest}>
    {children}
  </button>
);

const styles = {
  root: css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    color: var(--color-fg-muted);
    transition:
      background-color 120ms ease,
      color 120ms ease;

    &:hover:not(:disabled) {
      background: var(--color-surface-hover);
      color: var(--color-fg);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  `,
};
