import type React from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { PAGE_GUTTER } from '../../state/constants';
import { EditorProvider, useEditor } from '../../state/EditorContext';
import {
  downloadBytes,
  getFilledFileName,
} from '../../utilities/downloadBytes';
import { exportPdfInWorker } from '../../utilities/exportPdfInWorker';
import type { LoadedFormFont } from '../../utilities/formFont';
import { fitZoom } from '../../utilities/geometry';
import type { LoadedPdf } from '../../utilities/loadPdf';
import { MOBILE_MEDIA } from '../../styles/breakpoints';
import { EditorHeader } from './EditorHeader';
import { LargeFileNotice } from './LargeFileNotice';
import { PageCanvas } from './PageCanvas';
import { PropertiesPanel } from './PropertiesPanel';
import { ToolRail } from './ToolRail';
import { useEditingOnPage } from './useEditingOnPage';
import { useEditorClipboard } from './useEditorClipboard';
import { useEditorShortcuts } from './useEditorShortcuts';
import { useKeepFocusedFieldVisible } from './useKeepFocusedFieldVisible';
import { usePinchZoom } from './usePinchZoom';
import { useVisualViewport } from './useVisualViewport';
import { ZoomToolbar } from './ZoomToolbar';

interface EditorProps {
  pdf: LoadedPdf;
  font: LoadedFormFont;
  onReplace: () => void;
}

export const Editor: React.FC<EditorProps> = ({ pdf, font, onReplace }) => (
  <EditorProvider font={font} pdf={pdf}>
    <EditorWorkspace pdf={pdf} onReplace={onReplace} />
  </EditorProvider>
);

interface EditorWorkspaceProps {
  pdf: LoadedPdf;
  onReplace: () => void;
}

const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({
  pdf,
  onReplace,
}) => {
  const { state, dispatch, font, pages } = useEditor();
  const scrollRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const widestPage = Math.max(...pages.map((page) => page.geometry.width));
  // Later pages load lazily; the initial fit must not jump when they arrive.
  const initialPageWidth = pdf.firstPage.geometry.width;

  // The gutter comes from the stylesheet so the fit follows the responsive padding.
  const measureGutter = (): number => {
    const pages = pagesRef.current;
    const padding = pages
      ? parseFloat(getComputedStyle(pages).paddingLeft)
      : Number.NaN;
    return Number.isFinite(padding) ? padding : PAGE_GUTTER;
  };

  const fitToWidth = (): void => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }
    dispatch({
      type: 'setZoom',
      zoom: fitZoom(container.clientWidth, widestPage, measureGutter()),
    });
  };

  useLayoutEffect(() => {
    const container = scrollRef.current;
    const pages = pagesRef.current;
    if (!container || !pages) {
      return;
    }
    const gutter = parseFloat(getComputedStyle(pages).paddingLeft);
    dispatch({
      type: 'setZoom',
      zoom: fitZoom(
        container.clientWidth,
        initialPageWidth,
        Number.isFinite(gutter) ? gutter : PAGE_GUTTER,
      ),
    });
  }, [dispatch, initialPageWidth]);

  usePinchZoom(scrollRef);
  useVisualViewport();
  useKeepFocusedFieldVisible(scrollRef);
  const editingOnPage = useEditingOnPage();

  const handleDownload = async (): Promise<void> => {
    setExporting(true);
    setExportError(null);
    try {
      const bytes = await exportPdfInWorker({
        source: pdf.bytes,
        items: state.items,
        fontBytes: font.bytes,
      });
      downloadBytes(bytes, getFilledFileName(pdf.name));
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : 'The PDF could not be exported.',
      );
    } finally {
      setExporting(false);
    }
  };

  useEditorShortcuts(handleDownload);
  useEditorClipboard();

  const handleBackgroundPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ): void => {
    if (
      event.target instanceof Element &&
      event.target.closest('[data-page-index]')
    ) {
      return;
    }
    dispatch({ type: 'select', id: null });
  };

  return (
    <div className={styles.root}>
      <EditorHeader
        fileName={pdf.name}
        pageCount={pdf.pageCount}
        itemCount={state.items.length}
        exporting={exporting}
        exportError={exportError}
        onDownload={handleDownload}
        onReplace={onReplace}
      />
      <div className={styles.body}>
        <ToolRail hiddenOnMobile={editingOnPage} />
        <div className={styles.canvasArea}>
          <div
            ref={scrollRef}
            className={styles.scroll}
            onPointerDown={handleBackgroundPointerDown}
          >
            <div ref={pagesRef} className={styles.pages}>
              {pages.map((page) => (
                <PageCanvas
                  key={page.geometry.index}
                  page={page}
                  pageCount={pdf.pageCount}
                />
              ))}
            </div>
          </div>
          <LargeFileNotice byteLength={pdf.bytes.byteLength} />
          <ZoomToolbar
            onFit={fitToWidth}
            hiddenOnMobile={state.selectedId !== null}
          />
        </div>
        <PropertiesPanel collapsedOnMobile={editingOnPage} />
      </div>
    </div>
  );
};

const styles = {
  root: css`
    height: var(--app-height, 100%);
    display: flex;
    flex-direction: column;
    overflow: hidden;

    /* Follows the visual viewport so the editor stays in the area above the keyboard. */
    ${MOBILE_MEDIA} {
      position: fixed;
      left: 0;
      right: 0;
      top: var(--app-top, 0px);
    }
  `,
  body: css`
    flex: 1;
    min-height: 0;
    display: flex;

    ${MOBILE_MEDIA} {
      position: relative;
      flex-direction: column;
    }
  `,
  canvasArea: css`
    position: relative;
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
  `,
  scroll: css`
    flex: 1;
    overflow: auto;
    /* The browser pans; usePinchZoom handles two-finger zoom. */
    touch-action: pan-x pan-y;
    background-color: var(--color-bg-elevated);
    background-image: radial-gradient(var(--color-border) 1px, transparent 1px);
    background-size: 24px 24px;
  `,
  pages: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 40px;
    width: max-content;
    min-width: 100%;
    padding: 32px ${PAGE_GUTTER}px 120px;

    ${MOBILE_MEDIA} {
      gap: 24px;
      padding: 16px 16px 120px;
    }
  `,
};
