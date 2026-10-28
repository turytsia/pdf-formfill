// Axis-aligned box. In image space y grows downwards (top < bottom); in PDF space
// it grows upwards (top > bottom).
export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export enum FieldKind {
  BoxRow = 'boxRow',
  Box = 'box',
}

export interface DetectedBoxRow {
  kind: FieldKind.BoxRow;
  boxes: Array<Box>;
}

export interface DetectedBox {
  kind: FieldKind.Box;
  box: Box;
}

export type DetectedField = DetectedBoxRow | DetectedBox;

// A straight ink stroke. `start`/`end` run along the line, `low`/`high` across it.
export interface Line {
  start: number;
  end: number;
  low: number;
  high: number;
  position: number;
}

// Square cells that sit side by side, sharing their vertical edges.
export interface BoxRun {
  cells: Array<Box>;
}

// One parser per field type; each claims the box runs that match its shape.
export type FieldParser = (runs: Array<BoxRun>) => Array<DetectedField>;

// All sizes are in PDF points and converted with the raster's pixels-per-point.
export interface DetectionOptions {
  // How much darker than the paper (0–255 luminance) a pixel must be to count as ink.
  inkMargin: number;
  minLineLength: number;
  maxLineThickness: number;
  minBoxSize: number;
  maxBoxSize: number;
  minAspect: number;
  maxAspect: number;
  tolerance: number;
}
