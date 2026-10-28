import type React from 'react';
import { css } from '@emotion/css';
import { Download, FileText, FolderOpen } from 'lucide-react';
import { MOBILE_MEDIA } from '../../styles/breakpoints';
import { Button } from '../ui/Button';
import { GithubLink } from '../ui/GithubLink';
import { Wordmark } from '../ui/Wordmark';
import { HistoryControls } from './HistoryControls';

interface EditorHeaderProps {
  fileName: string;
  pageCount: number;
  itemCount: number;
  exporting: boolean;
  exportError: string | null;
  onDownload: () => void;
  onReplace: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  fileName,
  pageCount,
  itemCount,
  exporting,
  exportError,
  onDownload,
  onReplace,
}) => (
  <header className={styles.root}>
    <div className={styles.left}>
      <Wordmark compactOnMobile />
      <span className={styles.divider} />
      <HistoryControls />
    </div>

    <div className={styles.center}>
      <FileText size={14} className={styles.fileIcon} />
      <span className={styles.fileName} title={fileName}>
        {fileName}
      </span>
      <span className={styles.meta}>
        {pluralize(pageCount, 'page')} · {pluralize(itemCount, 'field')}
      </span>
    </div>

    <div className={styles.right}>
      <GithubLink className={styles.wideOnly} />
      {exportError && (
        <span role='alert' className={styles.error}>
          {exportError}
        </span>
      )}
      <Button
        size='sm'
        icon={<FolderOpen size={14} />}
        aria-label='Open another PDF'
        onClick={onReplace}
      >
        <span className={styles.wideOnly}>Open another</span>
      </Button>
      <Button
        size='sm'
        variant='primary'
        icon={<Download size={14} />}
        loading={exporting}
        onClick={onDownload}
      >
        Download PDF
      </Button>
    </div>
  </header>
);

function pluralize(count: number, noun: string): string {
  return `${count} ${count === 1 ? noun : `${noun}s`}`;
}

const styles = {
  root: css`
    flex-shrink: 0;
    height: var(--header-height);
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 16px;
    padding: 0 16px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg);

    ${MOBILE_MEDIA} {
      grid-template-columns: auto 1fr;
      gap: 8px;
      padding: 0 12px;
    }
  `,
  left: css`
    display: flex;
    align-items: center;
    gap: 12px;
  `,
  wideOnly: css`
    ${MOBILE_MEDIA} {
      display: none;
    }
  `,
  divider: css`
    width: 1px;
    height: 20px;
    background: var(--color-border);
  `,
  center: css`
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    max-width: 520px;
    font-size: 13px;
    color: var(--color-fg-muted);

    ${MOBILE_MEDIA} {
      display: none;
    }
  `,
  fileIcon: css`
    flex-shrink: 0;
  `,
  fileName: css`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
    color: var(--color-fg);
  `,
  meta: css`
    flex-shrink: 0;
    color: var(--color-fg-subtle);
  `,
  right: css`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
  `,
  error: css`
    font-size: 12px;
    color: var(--color-danger);
  `,
};
