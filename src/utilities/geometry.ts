import { MAX_ZOOM, MIN_ZOOM } from '../state/constants';
import type {
  FontMetrics,
  PageGeometry,
  Point,
  TextItem,
} from '../state/types';

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

// Pages are assumed unrotated: screen space is PDF space scaled, with the y axis flipped.
export const toScreenPoint = (
  page: PageGeometry,
  point: Point,
  zoom: number,
): Point => ({
  x: (point.x - page.x0) * zoom,
  y: (page.y1 - point.y) * zoom,
});

export const toPdfPoint = (
  page: PageGeometry,
  point: Point,
  zoom: number,
): Point => ({
  x: point.x / zoom + page.x0,
  y: page.y1 - point.y / zoom,
});

export const getMinSpacing = (fontSize: number, metrics: FontMetrics): number =>
  metrics.advance * fontSize;

export const getTextCellCount = (item: TextItem): number =>
  Math.max(1, Array.from(item.text).length);

// The visual center of a text cell sits halfway between the ascent and descent lines.
export const baselineFromCenter = (
  centerY: number,
  fontSize: number,
  metrics: FontMetrics,
): number => centerY - ((metrics.ascent - metrics.descent) / 2) * fontSize;

export const fitZoom = (
  containerWidth: number,
  pageWidth: number,
  gutter: number,
): number =>
  clamp((containerWidth - gutter * 2) / pageWidth, MIN_ZOOM, MAX_ZOOM);

export const roundZoom = (zoom: number): number => Math.round(zoom * 100) / 100;
