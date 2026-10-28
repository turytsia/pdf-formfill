import { findBoxRuns } from './boxes';
import { estimateInkThreshold, toInkMask } from './inkMask';
import { findLines, Orientation } from './lines';
import { parseSingleBoxes } from './parsers/singleBoxParser';
import { parseBoxRows } from './parsers/boxRowParser';
import type { DetectedField, DetectionOptions, FieldParser } from './types';

// Add a parser here to recognise a new kind of field.
export const FIELD_PARSERS: Array<FieldParser> = [
  parseBoxRows,
  parseSingleBoxes,
];

export const DEFAULT_DETECTION_OPTIONS: DetectionOptions = {
  inkMargin: 18,
  minLineLength: 4,
  maxLineThickness: 2.5,
  minBoxSize: 6,
  maxBoxSize: 30,
  // Form boxes are often taller than wide; writing lines and table cells are far wider.
  minAspect: 0.55,
  maxAspect: 1.6,
  tolerance: 1.5,
} as const;

// Finds fillable fields on a rendered page. Coordinates are image pixels.
export function detectFields(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  pixelsPerPoint: number,
  options: DetectionOptions = DEFAULT_DETECTION_OPTIONS,
): Array<DetectedField> {
  const px = (points: number): number => points * pixelsPerPoint;
  const threshold = estimateInkThreshold(rgba, options.inkMargin);
  const mask = toInkMask(rgba, width, height, threshold);
  const lineOptions = {
    minLength: px(options.minLineLength),
    maxThickness: px(options.maxLineThickness),
  };
  const horizontal = findLines(
    mask,
    width,
    height,
    Orientation.Horizontal,
    lineOptions,
  );
  const vertical = findLines(
    mask,
    width,
    height,
    Orientation.Vertical,
    lineOptions,
  );
  const runs = findBoxRuns(horizontal, vertical, {
    minSize: px(options.minBoxSize),
    maxSize: px(options.maxBoxSize),
    minAspect: options.minAspect,
    maxAspect: options.maxAspect,
    tolerance: px(options.tolerance),
  });

  return FIELD_PARSERS.flatMap((parse) => parse(runs));
}
