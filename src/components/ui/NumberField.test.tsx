import type React from 'react';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NumberField } from './NumberField';

describe('NumberField', () => {
  it('should report the typed value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledNumberField initialValue={10} onChange={onChange} />);

    const input = screen.getByLabelText('Size');
    await user.clear(input);
    await user.type(input, '12');

    expect(onChange).toHaveBeenLastCalledWith(12);
    expect(input).toHaveValue(12);
  });

  it('should clamp typed values to the allowed range', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ControlledNumberField
        initialValue={10}
        min={4}
        max={20}
        onChange={onChange}
      />,
    );

    const input = screen.getByLabelText('Size');
    await user.clear(input);
    await user.type(input, '1');

    expect(onChange).toHaveBeenLastCalledWith(4);
  });

  it('should keep showing what the user typed while it is being clamped', async () => {
    const user = userEvent.setup();
    render(<ControlledNumberField initialValue={10} min={4} max={20} />);

    const input = screen.getByLabelText('Size');
    await user.clear(input);
    await user.type(input, '1');

    expect(input).toHaveValue(1);
  });

  it('should not report anything while the field is empty', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledNumberField initialValue={10} onChange={onChange} />);

    await user.clear(screen.getByLabelText('Size'));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('should show a value that changed outside of the field', () => {
    const { rerender } = render(
      <NumberField label='Size' value={10} onChange={() => undefined} />,
    );

    rerender(
      <NumberField label='Size' value={14} onChange={() => undefined} />,
    );

    expect(screen.getByLabelText('Size')).toHaveValue(14);
  });

  it('should restore the current value when leaving an empty field', async () => {
    const user = userEvent.setup();
    render(<ControlledNumberField initialValue={10} />);

    const input = screen.getByLabelText('Size');
    await user.clear(input);
    await user.tab();

    expect(input).toHaveValue(10);
  });
});

interface ControlledNumberFieldProps {
  initialValue: number;
  min?: number;
  max?: number;
  onChange?: (value: number) => void;
}

function ControlledNumberField({
  initialValue,
  min,
  max,
  onChange,
}: ControlledNumberFieldProps): React.JSX.Element {
  const [value, setValue] = useState(initialValue);

  return (
    <NumberField
      label='Size'
      value={value}
      min={min}
      max={max}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}
