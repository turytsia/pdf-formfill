import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { css, cx } from '@emotion/css';
import { createMarkItem, createTextItem } from '../../state/createItem';
import { useEditor } from '../../state/EditorContext';
import { ItemKind } from '../../state/types';
import { baselineFromCenter, toPdfPoint } from '../../utilities/geometry';
import type { LoadedPage } from '../../utilities/loadPdf';
import { MarkItemView } from './MarkItemView';
import { TextItemView } from './TextItemView';

interface PageCanvasProps {
  page: LoadedPage;
  pageCount: number;
}

// Scanned forms carry no detail beyond this; it also keeps canvases within mobile Safari's limits.
const MAX_RASTER_PIXELS = 12_000_000;
// The bitmap is scaled by CSS while zooming and re-rendered once the zoom settles.
const RASTER_SETTLE_MS = 150;

export const PageCanvas: React.FC<PageCanvasProps> = ({ page, pageCount }) => {
  const { state, dispatch, font } = useEditor();
  const { zoom, tool, defaults } = state;
  const { proxy, geometry } = page;
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rasterZoom, setRasterZoom] = useState(zoom);
  const [nearViewport, setNearViewport] = useState(false);
  const width = geometry.width * zoom;
  const height = geometry.height * zoom;

  useEffect(() => {
    const timer = setTimeout(() => setRasterZoom(zoom), RASTER_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [zoom]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setNearViewport(entry.isIntersecting),
      { rootMargin: '50%' },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !nearViewport) {
      return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    const maxScale = Math.sqrt(
      MAX_RASTER_PIXELS / (geometry.width * geometry.height),
    );
    const viewport = proxy.getViewport({
      scale: Math.min(rasterZoom * pixelRatio, maxScale),
    });
    // Rendering off-screen keeps the previous bitmap visible until the new one is ready.
    const offscreen = document.createElement('canvas');
    offscreen.width = Math.floor(viewport.width);
    offscreen.height = Math.floor(viewport.height);

    let cancelled = false;
    const task = proxy.render({ canvas: offscreen, viewport });
    task.promise
      .then(() => {
        if (cancelled) {
          return;
        }
        canvas.width = offscreen.width;
        canvas.height = offscreen.height;
        canvas.getContext('2d')?.drawImage(offscreen, 0, 0);
      })
      .catch((error: unknown) => {
        if (!(
          error instanceof Error && error.name === 'RenderingCancelledException'
        )) {
          console.error(error);
        }
      });

    return () => {
      cancelled = true;
      task.cancel();
    };
  }, [proxy, rasterZoom, nearViewport, geometry.width, geometry.height]);

  const handleOverlayClick = (
    event: React.MouseEvent<HTMLDivElement>,
  ): void => {
    if (event.target !== event.currentTarget) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const point = toPdfPoint(
      geometry,
      { x: event.clientX - bounds.left, y: event.clientY - bounds.top },
      zoom,
    );
    const item =
      tool === ItemKind.Text
        ? createTextItem(
            geometry.index,
            point.x - defaults.spacing / 2,
            baselineFromCenter(point.y, defaults.fontSize, font.metrics),
            defaults,
          )
        : createMarkItem(geometry.index, point.x, point.y, defaults);

    dispatch({ type: 'addItem', item });
  };

  const items = state.items.filter((item) => item.pageIndex === geometry.index);

  return (
    <section
      ref={sectionRef}
      className={styles.page}
      data-page-index={geometry.index}
      style={{ width, height }}
      aria-label={`Page ${geometry.index + 1} of ${pageCount}`}
    >
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        style={{ width, height }}
      />
      <div
        className={cx(
          styles.overlay,
          tool === ItemKind.Text ? styles.textCursor : styles.markCursor,
        )}
        onClick={handleOverlayClick}
      >
        {items.map((item) =>
          item.kind === ItemKind.Text ? (
            <TextItemView key={item.id} item={item} geometry={geometry} />
          ) : (
            <MarkItemView key={item.id} item={item} geometry={geometry} />
          ),
        )}
      </div>
      <span className={styles.label}>
        {geometry.index + 1} / {pageCount}
      </span>
    </section>
  );
};

const styles = {
  page: css`
    position: relative;
    flex-shrink: 0;
    border-radius: 2px;
    background: #fff;
    box-shadow: var(--shadow-page);
  `,
  canvas: css`
    display: block;
  `,
  overlay: css`
    position: absolute;
    inset: 0;
  `,
  textCursor: css`
    cursor: text;
  `,
  markCursor: css`
    cursor: crosshair;
  `,
  label: css`
    position: absolute;
    left: 0;
    bottom: -26px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-fg-subtle);
  `,
};
