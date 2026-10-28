import type React from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { PAGE_GUTTER } from '../../state/constants';
import { EditorProvider, useEditor } from '../../state/EditorContext';
import {
  downloadBytes,
  getFilledFileName,
} from '../../utilities/downloadBytes';
import { exportFilledPdf } from '../../utilities/exportPdf';
import type { LoadedFormFont } from '../../utilities/formFont';
import { fitZoom } from '../../utilities/geometry';
import type { LoadedPdf } from '../../utilities/loadPdf';
import { EditorHeader } from './EditorHeader';
import { PageCanvas } from './PageCanvas';
import { PropertiesPanel } from './PropertiesPanel';
import { ToolRail } from './ToolRail';
import { useEditorClipboard } from './useEditorClipboard';
import { useEditorShortcuts } from './useEditorShortcuts';
import { ZoomToolbar } from './ZoomToolbar';

interface EditorProps {
  pdf: LoadedPdf;
  font: LoadedFormFont;
  onReplace: () => void;
}

export const Editor: React.FC<EditorProps> = ({ pdf, font, onReplace }) => (
  <EditorProvider font={font} pages={pdf.pages}>
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
  const { state, dispatch, font } = useEditor();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const widestPage = Math.max(...pdf.pages.map((page) => page.geometry.width));

  const fitToWidth = (): void => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }
    dispatch({
      type: 'setZoom',
      zoom: fitZoom(container.clientWidth, widestPage, PAGE_GUTTER),
    });
  };

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }
    dispatch({
      type: 'setZoom',
      zoom: fitZoom(container.clientWidth, widestPage, PAGE_GUTTER),
    });
  }, [dispatch, widestPage]);

  const handleDownload = async (): Promise<void> => {
    setExporting(true);
    setExportError(null);
    try {
      const bytes = await exportFilledPdf(pdf.bytes, state.items, font.bytes);
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
        pageCount={pdf.pages.length}
        itemCount={state.items.length}
        exporting={exporting}
        exportError={exportError}
        onDownload={handleDownload}
        onReplace={onReplace}
      />
      <div className={styles.body}>
        <ToolRail />
        <div className={styles.canvasArea}>
          <div
            ref={scrollRef}
            className={styles.scroll}
            onPointerDown={handleBackgroundPointerDown}
          >
            <div className={styles.pages}>
              {pdf.pages.map((page) => (
                <PageCanvas
                  key={page.geometry.index}
                  page={page}
                  pageCount={pdf.pages.length}
                />
              ))}
            </div>
          </div>
          <ZoomToolbar onFit={fitToWidth} />
        </div>
        <PropertiesPanel />
      </div>
    </div>
  );
};

const styles = {
  root: css`
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `,
  body: css`
    flex: 1;
    min-height: 0;
    display: flex;
  `,
  canvasArea: css`
    position: relative;
    flex: 1;
    min-width: 0;
    display: flex;
  `,
  scroll: css`
    flex: 1;
    overflow: auto;
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
  `,
};
