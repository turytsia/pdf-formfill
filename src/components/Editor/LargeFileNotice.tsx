import type React from 'react';
import { useState } from 'react';
import { css } from '@emotion/css';
import { TriangleAlert, X } from 'lucide-react';
import { MOBILE_MEDIA } from '../../styles/breakpoints';
import { formatBytes, isLargeFile } from '../../utilities/fileSize';
import { IconButton } from '../ui/IconButton';

interface LargeFileNoticeProps {
  byteLength: number;
}

export const LargeFileNotice: React.FC<LargeFileNoticeProps> = ({
  byteLength,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !isLargeFile(byteLength)) {
    return null;
  }

  return (
    <div className={styles.root} role='status'>
      <TriangleAlert size={16} className={styles.icon} />
      <p className={styles.text}>
        This PDF is {formatBytes(byteLength)}. Pages may load slowly and
        downloading can take a while, especially on phones.
      </p>
      <IconButton aria-label='Dismiss' onClick={() => setDismissed(true)}>
        <X size={14} />
      </IconButton>
    </div>
  );
};

const styles = {
  root: css`
    position: absolute;
    top: 12px;
    left: 50%;
    z-index: 2;
    transform: translateX(-50%);
    width: max-content;
    max-width: calc(100% - 24px);
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 6px 6px 14px;
    border-radius: var(--radius-lg);
    background: rgba(10, 10, 10, 0.9);
    backdrop-filter: blur(16px);
    box-shadow: var(--shadow-floating);

    ${MOBILE_MEDIA} {
      top: 8px;
    }
  `,
  icon: css`
    flex-shrink: 0;
    color: #f5a524;
  `,
  text: css`
    font-size: 13px;
    color: var(--color-fg-muted);
  `,
};
