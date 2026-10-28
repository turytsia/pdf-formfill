import type React from 'react';
import { css, cx } from '@emotion/css';
import { LoaderCircle } from 'lucide-react';
import { SPIN } from '../../styles/animations';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon,
  loading = false,
  disabled,
  className,
  children,
  ...rest
}) => (
  <button
    type='button'
    className={cx(
      styles.base,
      variantStyles[variant],
      sizeStyles[size],
      className,
    )}
    disabled={disabled || loading}
    {...rest}
  >
    {loading ? <LoaderCircle size={14} className={styles.spinner} /> : icon}
    {children}
  </button>
);

const styles = {
  base: css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: var(--radius-sm);
    font-weight: 500;
    white-space: nowrap;
    transition:
      background-color 120ms ease,
      border-color 120ms ease,
      color 120ms ease,
      opacity 120ms ease;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,
  spinner: css`
    animation: ${SPIN} 0.8s linear infinite;
  `,
};

const variantStyles: Record<ButtonVariant, string> = {
  primary: css`
    background: var(--color-fg);
    color: #000;
    border: 1px solid var(--color-fg);

    &:hover:not(:disabled) {
      background: #cccccc;
      border-color: #cccccc;
    }
  `,
  secondary: css`
    background: var(--color-bg-elevated);
    color: var(--color-fg);
    border: 1px solid var(--color-border);

    &:hover:not(:disabled) {
      background: var(--color-surface-hover);
      border-color: var(--color-border-strong);
    }
  `,
  ghost: css`
    background: transparent;
    color: var(--color-fg-muted);
    border: 1px solid transparent;

    &:hover:not(:disabled) {
      background: var(--color-surface-hover);
      color: var(--color-fg);
    }
  `,
  danger: css`
    background: transparent;
    color: var(--color-danger);
    border: 1px solid var(--color-border);

    &:hover:not(:disabled) {
      background: var(--color-danger-faint);
      border-color: var(--color-danger);
    }
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: css`
    height: 32px;
    padding: 0 12px;
    font-size: 13px;
  `,
  md: css`
    height: 36px;
    padding: 0 14px;
    font-size: 14px;
  `,
};
