import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { INITIAL_ITEM_DEFAULTS } from '../../state/constants';
import { createMarkItem, createTextItem } from '../../state/createItem';
import { FieldList } from './FieldList';

describe('FieldList', () => {
  it('should list fields in reading order', () => {
    const secondPage = {
      ...createTextItem(1, 50, 700, INITIAL_ITEM_DEFAULTS),
      text: 'PRAHA',
    };
    const lowerOnFirst = createMarkItem(0, 300, 200, INITIAL_ITEM_DEFAULTS);
    const topOfFirst = {
      ...createTextItem(0, 50, 700, INITIAL_ITEM_DEFAULTS),
      text: 'NOVÁK',
    };
    render(
      <FieldList
        items={[secondPage, lowerOnFirst, topOfFirst]}
        selectedId={null}
        onReveal={() => undefined}
        onClose={() => undefined}
      />,
    );

    const entries = within(screen.getByRole('list')).getAllByRole('button');

    expect(entries.map((entry) => entry.textContent)).toEqual([
      'NOVÁKPage 1',
      'X markPage 1',
      'PRAHAPage 2',
    ]);
  });

  it('should reveal a field when its entry is clicked', async () => {
    const user = userEvent.setup();
    const onReveal = vi.fn();
    const field = {
      ...createTextItem(0, 50, 700, INITIAL_ITEM_DEFAULTS),
      text: 'NOVÁK',
    };
    render(
      <FieldList
        items={[field]}
        selectedId={null}
        onReveal={onReveal}
        onClose={() => undefined}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'NOVÁK, page 1' }));

    expect(onReveal).toHaveBeenCalledWith(field.id);
  });

  it('should mark the selected field as current', () => {
    const selected = createMarkItem(0, 300, 200, INITIAL_ITEM_DEFAULTS);
    const other = createMarkItem(0, 300, 100, INITIAL_ITEM_DEFAULTS);
    render(
      <FieldList
        items={[selected, other]}
        selectedId={selected.id}
        onReveal={() => undefined}
        onClose={() => undefined}
      />,
    );

    const [first, second] = within(screen.getByRole('list')).getAllByRole(
      'button',
    );

    expect(first).toHaveAttribute('aria-current', 'true');
    expect(second).not.toHaveAttribute('aria-current');
  });

  it('should label a text field without content as empty', () => {
    render(
      <FieldList
        items={[createTextItem(0, 50, 700, INITIAL_ITEM_DEFAULTS)]}
        selectedId={null}
        onReveal={() => undefined}
        onClose={() => undefined}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Empty text, page 1' }),
    ).toBeVisible();
  });

  it('should show the number of fields in the heading area', () => {
    render(
      <FieldList
        items={[
          createMarkItem(0, 300, 200, INITIAL_ITEM_DEFAULTS),
          createMarkItem(0, 300, 100, INITIAL_ITEM_DEFAULTS),
        ]}
        selectedId={null}
        onReveal={() => undefined}
        onClose={() => undefined}
      />,
    );

    expect(screen.getByRole('region', { name: 'Fields' })).toHaveTextContent(
      'Fields2',
    );
  });

  describe('when there are no fields', () => {
    it('should explain where fields will appear', () => {
      render(
        <FieldList
          items={[]}
          selectedId={null}
          onReveal={() => undefined}
          onClose={() => undefined}
        />,
      );

      expect(
        screen.getByText(
          'Fields you add appear here. Click one to jump to it in the document.',
        ),
      ).toBeVisible();
      expect(screen.queryByRole('list')).toBeNull();
    });
  });
});
