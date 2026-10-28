import type { Box, BoxRun, Line } from './types';

interface BoxOptions {
  minSize: number;
  maxSize: number;
  minAspect: number;
  maxAspect: number;
  tolerance: number;
}

interface Band {
  top: Line;
  bottom: Line;
  edges: Array<number>;
}

// How far a gap may stray from a whole number of box widths.
const PITCH_TOLERANCE = 0.2;
// A gap may hide up to this many lost vertical strokes (faint scans).
const MAX_BOXES_PER_GAP = 4;

// Box-shaped cells enclosed by two horizontal lines and vertical lines spanning
// between them, grouped into runs of cells that share their vertical edges.
// Wide or tall cells (table rows, writing lines, frames) never qualify.
export function findBoxRuns(
  horizontal: Array<Line>,
  vertical: Array<Line>,
  options: BoxOptions,
): Array<BoxRun> {
  const runs: Array<BoxRun> = [];

  for (const band of collectBands(horizontal, vertical, options).values()) {
    const edges = mergeClose(
      band.edges.sort((a, b) => a - b),
      options.tolerance,
    );
    const height = band.bottom.position - band.top.position;
    const isBoxShaped = (width: number): boolean =>
      width / height >= options.minAspect &&
      width / height <= options.maxAspect;
    const pitch = median(
      gapsBetween(edges).filter((width) => isBoxShaped(width)),
    );
    if (pitch === null) {
      continue;
    }

    let cells: Array<Box> = [];
    const flush = (): void => {
      if (cells.length > 0) {
        runs.push({ cells });
      }
      cells = [];
    };

    for (let index = 0; index < edges.length - 1; index += 1) {
      const left = edges[index];
      const right = edges[index + 1];
      const width = right - left;
      const count = Math.round(width / pitch);
      const fits =
        count >= 1 &&
        count <= MAX_BOXES_PER_GAP &&
        Math.abs(width - count * pitch) <= PITCH_TOLERANCE * pitch * count &&
        isBoxShaped(width / count) &&
        spans(band.top, left, right, options.tolerance) &&
        spans(band.bottom, left, right, options.tolerance);
      if (!fits) {
        flush();
        continue;
      }
      for (let part = 0; part < count; part += 1) {
        cells.push({
          left: left + (width * part) / count,
          right: left + (width * (part + 1)) / count,
          top: band.top.position,
          bottom: band.bottom.position,
        });
      }
    }
    flush();
  }

  return runs;
}

// Groups vertical edges by the pair of horizontal lines they connect. A vertical
// line crossing several horizontal lines (a grid) contributes to each pair.
function collectBands(
  horizontal: Array<Line>,
  vertical: Array<Line>,
  { minSize, maxSize, tolerance }: BoxOptions,
): Map<string, Band> {
  const bands = new Map<string, Band>();

  for (const edge of vertical) {
    const touching = horizontal
      .map((line, index) => ({ line, index }))
      .filter(
        ({ line }) =>
          line.high + tolerance >= edge.start &&
          line.low - tolerance <= edge.end &&
          edge.high + tolerance >= line.start &&
          edge.low - tolerance <= line.end,
      )
      .sort((a, b) => a.line.position - b.line.position);

    for (let index = 0; index < touching.length - 1; index += 1) {
      const top = touching[index];
      const bottom = touching[index + 1];
      const gap = bottom.line.position - top.line.position;
      const spansGap =
        edge.start <= top.line.position + tolerance &&
        edge.end >= bottom.line.position - tolerance;
      if (gap < minSize || gap > maxSize || !spansGap) {
        continue;
      }
      const key = `${top.index}:${bottom.index}`;
      const band = bands.get(key) ?? {
        top: top.line,
        bottom: bottom.line,
        edges: [],
      };
      band.edges.push(edge.position);
      bands.set(key, band);
    }
  }

  return bands;
}

function spans(
  line: Line,
  from: number,
  to: number,
  tolerance: number,
): boolean {
  return line.start <= from + tolerance && line.end >= to - tolerance;
}

function gapsBetween(edges: Array<number>): Array<number> {
  return edges.slice(1).map((edge, index) => edge - edges[index]);
}

function median(values: Array<number>): number | null {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

// Double-drawn or thick edges show up as several positions a pixel or two apart.
function mergeClose(values: Array<number>, tolerance: number): Array<number> {
  const merged: Array<number> = [];
  let group: Array<number> = [];
  for (const value of values) {
    if (group.length > 0 && value - group[group.length - 1] > tolerance) {
      merged.push(average(group));
      group = [];
    }
    group.push(value);
  }
  if (group.length > 0) {
    merged.push(average(group));
  }
  return merged;
}

function average(values: Array<number>): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
