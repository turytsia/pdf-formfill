import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Dialog } from './Dialog';

describe('Dialog', () => {
  it('should open as a modal with its title and content', () => {
    render(
      <Dialog
        open
        title='Open another PDF?'
        actions={<button type='button'>Cancel</button>}
        onClose={() => undefined}
      >
        Your fields are not saved.
      </Dialog>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Open another PDF?' });
    expect(dialog).toHaveProperty('open', true);
    expect(dialog).toHaveTextContent('Your fields are not saved.');
  });

  it('should close when it is no longer open', () => {
    const { rerender } = render(
      <Dialog open title='Title' actions={null} onClose={() => undefined}>
        Body
      </Dialog>,
    );

    rerender(
      <Dialog
        open={false}
        title='Title'
        actions={null}
        onClose={() => undefined}
      >
        Body
      </Dialog>,
    );

    expect(screen.getByRole('dialog', { hidden: true })).toHaveProperty(
      'open',
      false,
    );
  });

  it('should report a click on the backdrop', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Dialog open title='Title' actions={null} onClose={onClose}>
        Body
      </Dialog>,
    );

    await user.click(screen.getByRole('dialog'));

    expect(onClose).toHaveBeenCalled();
  });

  it('should not close when the content is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Dialog open title='Title' actions={null} onClose={onClose}>
        Body
      </Dialog>,
    );

    await user.click(screen.getByText('Body'));

    expect(onClose).not.toHaveBeenCalled();
  });
});
