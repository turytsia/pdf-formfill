import fontUrl from '../assets/fonts/JetBrainsMono-Regular.ttf?url';
import type { FontMetrics } from '../state/types';

export const FORM_FONT_FAMILY = 'JetBrains Mono';

export interface LoadedFormFont {
  family: string;
  bytes: ArrayBuffer;
  metrics: FontMetrics;
}

let formFontPromise: Promise<LoadedFormFont> | null = null;

export function loadFormFont(): Promise<LoadedFormFont> {
  formFontPromise ??= fetchFormFont();
  return formFontPromise;
}

async function fetchFormFont(): Promise<LoadedFormFont> {
  const response = await fetch(fontUrl);

  if (!response.ok) {
    throw new Error(`Failed to load the form font (${response.status})`);
  }

  const bytes = await response.arrayBuffer();
  const face = new FontFace(FORM_FONT_FAMILY, bytes);
  await face.load();
  document.fonts.add(face);

  return {
    family: FORM_FONT_FAMILY,
    bytes,
    metrics: measureFontMetrics(FORM_FONT_FAMILY),
  };
}

const METRIC_SAMPLE_SIZE = 100;

export function measureFontMetrics(family: string): FontMetrics {
  const context = document.createElement('canvas').getContext('2d');

  if (!context) {
    throw new Error('Canvas 2D context is not available');
  }

  context.font = `${METRIC_SAMPLE_SIZE}px "${family}"`;
  const metrics = context.measureText('0');

  return {
    ascent: metrics.fontBoundingBoxAscent / METRIC_SAMPLE_SIZE,
    descent: metrics.fontBoundingBoxDescent / METRIC_SAMPLE_SIZE,
    advance: metrics.width / METRIC_SAMPLE_SIZE,
  };
}
