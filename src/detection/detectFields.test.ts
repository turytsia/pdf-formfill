import { describe, expect, it } from 'vitest';
import { detectFields } from './detectFields';
import { parseBoxRows } from './parsers/boxRowParser';
import { parseSingleBoxes } from './parsers/singleBoxParser';
import { FieldKind, type BoxRun } from './types';

// Two pixels per point, like the app's detection raster.
const PIXELS_PER_POINT = 2;
// A 12 × 16 pt box.
const BOX_WIDTH = 24;
const BOX_HEIGHT = 32;
const LINE = 2;
const INK = 120;

describe('detectFields', () => {
  it('should find a row of boxes', () => {
    const page = blankPage(400, 300);
    drawBoxRow(page, 40, 40, 5);

    const fields = detectFields(
      page.rgba,
      page.width,
      page.height,
      PIXELS_PER_POINT,
    );

    expect(fields).toHaveLength(1);
    expect(fields[0].kind).toBe(FieldKind.BoxRow);
    if (fields[0].kind === FieldKind.BoxRow) {
      expect(fields[0].boxes).toHaveLength(5);
      // Edges sit on the middle of the 2px lines drawn at x = 40.
      expect(fields[0].boxes[0].left).toBeCloseTo(40.5, 1);
      expect(fields[0].boxes[4].right).toBeCloseTo(40.5 + 5 * BOX_WIDTH, 1);
    }
  });

  it('should find a single box', () => {
    const page = blankPage(400, 300);
    drawBoxRow(page, 200, 150, 1);

    const fields = detectFields(
      page.rgba,
      page.width,
      page.height,
      PIXELS_PER_POINT,
    );

    expect(fields.map((field) => field.kind)).toEqual([FieldKind.Box]);
  });

  it('should keep a row whole when one of its inner edges did not scan', () => {
    const page = blankPage(400, 300);
    drawBoxRow(page, 40, 40, 6, { skipEdge: 3 });

    const fields = detectFields(
      page.rgba,
      page.width,
      page.height,
      PIXELS_PER_POINT,
    );

    expect(fields).toHaveLength(1);
    expect(fields[0].kind === FieldKind.BoxRow && fields[0].boxes).toHaveLength(
      6,
    );
  });

  it('should ignore table cells and writing lines that are much wider than tall', () => {
    const page = blankPage(500, 300);
    drawRect(page, 20, 40, 400, LINE);
    drawRect(page, 20, 40 + BOX_HEIGHT, 400, LINE);
    for (const x of [20, 160, 300, 418]) {
      drawRect(page, x, 40, LINE, BOX_HEIGHT + LINE);
    }

    expect(
      detectFields(page.rgba, page.width, page.height, PIXELS_PER_POINT),
    ).toEqual([]);
  });

  it('should ignore filled bars and text-sized marks', () => {
    const page = blankPage(500, 300);
    drawRect(page, 20, 20, 450, 30);
    drawRect(page, 50, 120, 3, 12);
    drawRect(page, 60, 120, 8, 3);

    expect(
      detectFields(page.rgba, page.width, page.height, PIXELS_PER_POINT),
    ).toEqual([]);
  });

  it('should find separate rows on the same page', () => {
    const page = blankPage(500, 300);
    drawBoxRow(page, 40, 40, 4);
    drawBoxRow(page, 40, 140, 3);
    drawBoxRow(page, 300, 140, 1);

    const kinds = detectFields(
      page.rgba,
      page.width,
      page.height,
      PIXELS_PER_POINT,
    )
      .map((field) =>
        field.kind === FieldKind.BoxRow
          ? `row of ${field.boxes.length}`
          : 'box',
      )
      .sort();

    expect(kinds).toEqual(['box', 'row of 3', 'row of 4']);
  });
});

describe('field parsers', () => {
  const run = (count: number): BoxRun => ({
    cells: Array.from({ length: count }, (_, index) => ({
      left: index * 10,
      right: (index + 1) * 10,
      top: 0,
      bottom: 14,
    })),
  });

  it('should treat runs of two or more boxes as box rows', () => {
    expect(
      parseBoxRows([run(1), run(2), run(7)]).map((row) => row.boxes.length),
    ).toEqual([2, 7]);
  });

  it('should treat lone boxes as single boxes', () => {
    expect(parseSingleBoxes([run(1), run(2), run(1)])).toHaveLength(2);
  });
});

interface Page {
  rgba: Uint8ClampedArray;
  width: number;
  height: number;
}

function blankPage(width: number, height: number): Page {
  return {
    rgba: new Uint8ClampedArray(width * height * 4).fill(255),
    width,
    height,
  };
}

function drawRect(
  page: Page,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  for (let row = y; row < y + height; row += 1) {
    for (let column = x; column < x + width; column += 1) {
      const offset = (row * page.width + column) * 4;
      page.rgba[offset] = INK;
      page.rgba[offset + 1] = INK;
      page.rgba[offset + 2] = INK;
    }
  }
}

function drawBoxRow(
  page: Page,
  x: number,
  y: number,
  count: number,
  { skipEdge }: { skipEdge?: number } = {},
): void {
  const width = count * BOX_WIDTH + LINE;
  drawRect(page, x, y, width, LINE);
  drawRect(page, x, y + BOX_HEIGHT, width, LINE);
  for (let edge = 0; edge <= count; edge += 1) {
    if (edge !== skipEdge) {
      drawRect(page, x + edge * BOX_WIDTH, y, LINE, BOX_HEIGHT + LINE);
    }
  }
}
