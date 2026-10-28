import type React from 'react';
import { useId, useState } from 'react';
import { css } from '@emotion/css';
import { clamp } from '../../utilities/geometry';

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

const formatNumber = (value: number): string =>
  String(Math.round(value * 100) / 100);

export const NumberField: React.FC<NumberFieldProps> = ({
  label,
  value,
  onChange,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  unit,
}) => {
  const id = useId();
  const formatted = formatNumber(value);
  const [draft, setDraft] = useState(formatted);
  const [synced, setSynced] = useState(formatted);

  // Adopt external changes without discarding what the user is typing.
  if (formatted !== synced) {
    setSynced(formatted);
    setDraft(formatted);
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const text = event.target.value;
    setDraft(text);

    const parsed = Number(text);
    if (text.trim() === '' || !Number.isFinite(parsed)) {
      return;
    }

    const next = clamp(parsed, min, max);
    setSynced(formatNumber(next));
    onChange(next);
  };

  return (
    <div className={styles.root}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.control}>
        <input
          id={id}
          type='number'
          inputMode='decimal'
          className={styles.input}
          value={draft}
          min={Number.isFinite(min) ? min : undefined}
          max={Number.isFinite(max) ? max : undefined}
          step={step}
          onChange={handleChange}
          onBlur={() => setDraft(formatted)}
        />
        {unit && (
          <span className={styles.unit} aria-hidden>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};

const styles = {
  root: css`
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  `,
  label: css`
    font-size: 12px;
    color: var(--color-fg-muted);
  `,
  control: css`
    position: relative;
    display: flex;
    align-items: center;
  `,
  input: css`
    width: 100%;
    height: 32px;
    padding: 0 28px 0 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-bg-elevated);
    font-family: var(--font-mono);
    font-size: 13px;
    -moz-appearance: textfield;
    appearance: textfield;

    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    &:focus {
      outline: none;
      border-color: var(--color-accent);
      box-shadow: 0 0 0 3px var(--color-accent-faint);
    }
  `,
  unit: css`
    position: absolute;
    right: 10px;
    font-size: 11px;
    color: var(--color-fg-subtle);
    pointer-events: none;
  `,
};
