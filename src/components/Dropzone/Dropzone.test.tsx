import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Dropzone } from './Dropzone';

describe('Dropzone', () => {
  it('should pass the chosen file to onFile', async () => {
    const user = userEvent.setup();
    const onFile = vi.fn();
    render(
      <Dropzone onFile={onFile} onOpenSample={() => undefined} error={null} />,
    );
    const file = new File(['%PDF-1.4'], 'form.pdf', {
      type: 'application/pdf',
    });

    await user.upload(screen.getByLabelText('Choose a PDF file'), file);

    expect(onFile).toHaveBeenCalledWith(file);
  });

  it('should open the sample form when requested', async () => {
    const user = userEvent.setup();
    const onOpenSample = vi.fn();
    render(
      <Dropzone
        onFile={() => undefined}
        onOpenSample={onOpenSample}
        error={null}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Try with the sample form' }),
    );

    expect(onOpenSample).toHaveBeenCalledTimes(1);
  });

  describe('when an error is provided', () => {
    it('should announce the error message', () => {
      render(
        <Dropzone
          onFile={() => undefined}
          onOpenSample={() => undefined}
          error='Only PDF files are supported.'
        />,
      );

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Only PDF files are supported.',
      );
    });
  });
});
