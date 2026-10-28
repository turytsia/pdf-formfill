import type React from 'react';
import { useRef, useState } from 'react';
import { css } from '@emotion/css';
import { Download, FileText, Lock, MoveHorizontal, Upload } from 'lucide-react';
import { MOBILE_MEDIA } from '../../styles/breakpoints';
import { Button } from '../ui/Button';
import { Wordmark } from '../ui/Wordmark';

interface DropzoneProps {
  onFile: (file: File) => void;
  onOpenSample: () => void;
  error: string | null;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFile,
  onOpenSample,
  error,
}) => {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (event: React.DragEvent<HTMLElement>): void => {
    event.preventDefault();
    if (!dragging) {
      setDragging(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLElement>): void => {
    const stillInside =
      event.relatedTarget instanceof Node &&
      event.currentTarget.contains(event.relatedTarget);
    if (!stillInside) {
      setDragging(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLElement>): void => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files.item(0);
    if (file) {
      onFile(file);
    }
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const file = event.target.files?.item(0);
    if (file) {
      onFile(file);
    }
    event.target.value = '';
  };

  return (
    <main
      className={styles.root}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <header className={styles.header}>
        <Wordmark />
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>Local-first PDF form filler</p>
        <h1 className={styles.title}>
          Fill scanned forms without the printer.
        </h1>
        <p className={styles.subtitle}>
          Drop a PDF, type into the boxes, stretch the letters to fit, download.
          Everything runs in your browser.
        </p>

        <button
          type='button'
          className={styles.drop}
          data-dragging={dragging}
          onClick={() => inputRef.current?.click()}
        >
          <span className={styles.dropIcon}>
            <Upload size={18} />
          </span>
          <span className={styles.dropTitle}>
            {dragging ? 'Release to open' : 'Drop your PDF here'}
          </span>
          <span className={styles.dropHint}>or browse your files</span>
        </button>
        <input
          ref={inputRef}
          type='file'
          accept='application/pdf,.pdf'
          className={styles.fileInput}
          aria-label='Choose a PDF file'
          onChange={handleInputChange}
        />

        {error && (
          <p role='alert' className={styles.error}>
            {error}
          </p>
        )}

        <Button
          variant='ghost'
          size='sm'
          icon={<FileText size={14} />}
          onClick={onOpenSample}
        >
          Try with the sample form
        </Button>
      </section>

      <ul className={styles.features}>
        <li className={styles.feature}>
          <Lock size={14} />
          Files never leave your device
        </li>
        <li className={styles.feature}>
          <MoveHorizontal size={14} />
          Stretch text to match the boxes
        </li>
        <li className={styles.feature}>
          <Download size={14} />
          Download a flattened PDF
        </li>
      </ul>
    </main>
  );
};

const styles = {
  root: css`
    position: relative;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-image: radial-gradient(var(--color-border) 1px, transparent 1px);
    background-size: 24px 24px;

    &::before {
      content: '';
      position: absolute;
      inset: -30% 0 auto 0;
      height: 70%;
      background: radial-gradient(
        ellipse at 50% 0%,
        rgba(0, 112, 243, 0.2),
        transparent 60%
      );
      pointer-events: none;
    }
  `,
  header: css`
    position: relative;
    height: var(--header-height);
    display: flex;
    align-items: center;
    padding: 0 24px;
  `,
  hero: css`
    position: relative;
    flex: 1;
    width: 100%;
    max-width: 620px;
    margin: 0 auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    text-align: center;
  `,
  eyebrow: css`
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-fg-subtle);
  `,
  title: css`
    font-size: 44px;
    line-height: 1.1;
    font-weight: 600;
    letter-spacing: -0.03em;
    background: linear-gradient(180deg, #ffffff 0%, #a1a1a1 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;

    ${MOBILE_MEDIA} {
      font-size: 32px;
    }
  `,
  subtitle: css`
    max-width: 460px;
    font-size: 16px;
    color: var(--color-fg-muted);
  `,
  drop: css`
    margin-top: 16px;
    width: 100%;
    padding: 40px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    border: 1px dashed var(--color-border-strong);
    border-radius: var(--radius-lg);
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    transition:
      border-color 150ms ease,
      background-color 150ms ease,
      transform 150ms ease;

    &:hover {
      border-color: var(--color-fg-subtle);
      background: var(--color-bg-elevated);
    }

    &[data-dragging='true'] {
      border-color: var(--color-accent);
      background: var(--color-accent-faint);
      transform: scale(1.01);
    }

    ${MOBILE_MEDIA} {
      padding: 32px 16px;
    }
  `,
  dropIcon: css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    margin-bottom: 4px;
    border-radius: 50%;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-fg-muted);
  `,
  dropTitle: css`
    font-size: 15px;
    font-weight: 500;
  `,
  dropHint: css`
    font-size: 13px;
    color: var(--color-fg-subtle);
  `,
  fileInput: css`
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  `,
  error: css`
    font-size: 13px;
    color: var(--color-danger);
  `,
  features: css`
    position: relative;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 32px;
    padding: 24px;
    font-size: 13px;
    color: var(--color-fg-subtle);

    ${MOBILE_MEDIA} {
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 16px 24px calc(24px + env(safe-area-inset-bottom));
    }
  `,
  feature: css`
    display: flex;
    align-items: center;
    gap: 8px;
  `,
};
