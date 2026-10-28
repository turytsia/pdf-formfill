import type React from 'react';
import { useId } from 'react';
import { css, cx } from '@emotion/css';
import { Type, X } from 'lucide-react';
import { sortByDocumentOrder } from '../../state/itemOrder';
import { ItemKind, type Item } from '../../state/types';
import { MOBILE_MEDIA } from '../../styles/breakpoints';
import { IconButton } from '../ui/IconButton';

interface FieldListProps {
  items: Array<Item>;
  selectedId: string | null;
  onReveal: (id: string) => void;
  // Phones show the list as a sheet that can be dismissed.
  onClose: () => void;
}

export const FieldList: React.FC<FieldListProps> = ({
  items,
  selectedId,
  onReveal,
  onClose,
}) => {
  const headingId = useId();
  const ordered = sortByDocumentOrder(items);

  return (
    <section
      className={styles.root}
      aria-labelledby={headingId}
      data-section='fields'
    >
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h2 id={headingId} className={styles.title}>
            Fields
          </h2>
          <span className={styles.count}>{items.length}</span>
        </div>
        <IconButton
          aria-label='Close field list'
          className={styles.closeButton}
          onClick={onClose}
        >
          <X size={16} />
        </IconButton>
      </header>

      {ordered.length === 0 ? (
        <p className={styles.empty}>
          Fields you add appear here. Click one to jump to it in the document.
        </p>
      ) : (
        <ul className={styles.list}>
          {ordered.map((item) => (
            <li key={item.id}>
              <button
                type='button'
                className={styles.entry}
                aria-label={`${describeField(item)}, page ${item.pageIndex + 1}`}
                aria-current={item.id === selectedId ? 'true' : undefined}
                onClick={() => onReveal(item.id)}
              >
                <span className={styles.icon} aria-hidden>
                  {item.kind === ItemKind.Text ? (
                    <Type size={14} />
                  ) : (
                    <X size={14} />
                  )}
                </span>
                <FieldLabel item={item} />
                <span className={styles.page}>Page {item.pageIndex + 1}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

interface FieldLabelProps {
  item: Item;
}

const FieldLabel: React.FC<FieldLabelProps> = ({ item }) => {
  if (item.kind === ItemKind.Mark) {
    return <span className={styles.label}>{describeField(item)}</span>;
  }
  if (item.text.trim() === '') {
    return (
      <span className={cx(styles.label, styles.placeholder)}>
        {describeField(item)}
      </span>
    );
  }
  return (
    <span className={cx(styles.label, styles.text)}>{describeField(item)}</span>
  );
};

function describeField(item: Item): string {
  if (item.kind === ItemKind.Mark) {
    return 'X mark';
  }
  return item.text.trim() === '' ? 'Empty text' : item.text;
}

const styles = {
  root: css`
    flex: 1 1 0;
    min-height: 140px;
    display: flex;
    flex-direction: column;

    ${MOBILE_MEDIA} {
      flex: none;
      min-height: 0;
    }
  `,
  header: css`
    position: sticky;
    top: 0;
    z-index: 1;
    flex-shrink: 0;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg);
  `,
  titleRow: css`
    display: flex;
    align-items: center;
    gap: 8px;
  `,
  title: css`
    font-size: 13px;
    font-weight: 500;
  `,
  count: css`
    min-width: 20px;
    padding: 1px 6px;
    border-radius: 999px;
    background: var(--color-surface-active);
    font-family: var(--font-mono);
    font-size: 11px;
    text-align: center;
    color: var(--color-fg-muted);
  `,
  closeButton: css`
    display: none;

    ${MOBILE_MEDIA} {
      display: inline-flex;
    }
  `,
  empty: css`
    padding: 16px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--color-fg-subtle);
  `,
  list: css`
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 6px;

    ${MOBILE_MEDIA} {
      overflow: visible;
    }
  `,
  entry: css`
    width: 100%;
    height: 34px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 10px;
    border-radius: var(--radius-sm);
    color: var(--color-fg-muted);
    text-align: left;
    transition:
      background-color 100ms ease,
      color 100ms ease;

    &:hover {
      background: var(--color-surface-hover);
      color: var(--color-fg);
    }

    &[aria-current='true'] {
      background: var(--color-accent-faint);
      color: var(--color-fg);
      box-shadow: inset 2px 0 0 var(--color-accent);
    }

    ${MOBILE_MEDIA} {
      height: 44px;
    }
  `,
  icon: css`
    display: inline-flex;
    flex-shrink: 0;
    color: var(--color-fg-subtle);
  `,
  label: css`
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
  `,
  text: css`
    font-family: var(--font-mono);
    font-size: 12px;
  `,
  placeholder: css`
    font-style: italic;
    color: var(--color-fg-subtle);
  `,
  page: css`
    flex-shrink: 0;
    font-size: 11px;
    color: var(--color-fg-subtle);
  `,
};
