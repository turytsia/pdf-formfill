import { describe, expect, it } from 'vitest';
import { MAX_ZOOM, MIN_ZOOM } from '../state/constants';
import type { FontMetrics, PageGeometry } from '../state/types';
import {
  baselineFromCenter,
  fitZoom,
  getMinSpacing,
  toPdfPoint,
  toScreenPoint,
} from './geometry';

const A4: PageGeometry = {
  index: 0,
  x0: 0,
  y0: 0,
  x1: 595,
  y1: 842,
  width: 595,
  height: 842,
};

const METRICS: FontMetrics = { ascent: 1, descent: 0.5, advance: 0.6 };

describe('geometry', () => {
  it('should map the top-left corner of the page to the screen origin', () => {
    expect(toScreenPoint(A4, { x: 0, y: 842 }, 2)).toEqual({ x: 0, y: 0 });
  });

  it('should scale screen coordinates by the zoom level', () => {
    expect(toScreenPoint(A4, { x: 100, y: 742 }, 2)).toEqual({
      x: 200,
      y: 200,
    });
  });

  it('should honour a page box that does not start at the origin', () => {
    const offsetPage: PageGeometry = {
      ...A4,
      x0: 10,
      y0: 20,
      x1: 605,
      y1: 862,
    };

    expect(toScreenPoint(offsetPage, { x: 10, y: 862 }, 1)).toEqual({
      x: 0,
      y: 0,
    });
  });

  it('should round-trip a point through screen and PDF space', () => {
    const original = { x: 123.4, y: 567.8 };

    const screen = toScreenPoint(A4, original, 1.5);
    const back = toPdfPoint(A4, screen, 1.5);

    expect(back.x).toBeCloseTo(original.x);
    expect(back.y).toBeCloseTo(original.y);
  });

  it('should place the baseline below the cell center by half the ascent-descent difference', () => {
    expect(baselineFromCenter(100, 10, METRICS)).toBe(97.5);
  });

  it('should derive the minimum spacing from the glyph advance', () => {
    expect(getMinSpacing(10, METRICS)).toBe(6);
  });

  it('should fit the page into the container width minus the gutters', () => {
    expect(fitZoom(1200, 600, 100)).toBeCloseTo(1000 / 600);
  });

  it.each([
    [10000, MAX_ZOOM],
    [100, MIN_ZOOM],
  ])(
    'should clamp the fit zoom for a %spx container to %s',
    (width, expected) => {
      expect(fitZoom(width, 600, 48)).toBe(expected);
    },
  );
});
