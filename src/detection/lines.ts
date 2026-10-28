import type { Line } from './types';

export enum Orientation {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

interface LineOptions {
  minLength: number;
  maxThickness: number;
}

interface Run {
  start: number;
  end: number;
  component: number;
}

interface Component {
  start: number;
  end: number;
  low: number;
  high: number;
  pixels: number;
}

// Long ink runs along one axis, joined across neighbouring rows (or columns) into
// lines. Joining tolerates slightly skewed scans; filled areas are rejected by
// their average thickness.
export function findLines(
  mask: Uint8Array,
  width: number,
  height: number,
  orientation: Orientation,
  { minLength, maxThickness }: LineOptions,
): Array<Line> {
  const horizontal = orientation === Orientation.Horizontal;
  const length = horizontal ? width : height;
  const depth = horizontal ? height : width;
  const at = horizontal
    ? (along: number, across: number): number => mask[across * width + along]
    : (along: number, across: number): number => mask[along * width + across];

  const parents: Array<number> = [];
  const components: Array<Component> = [];
  let previous: Array<Run> = [];

  for (let across = 0; across < depth; across += 1) {
    const current: Array<Run> = [];
    let along = 0;
    while (along < length) {
      if (at(along, across) === 0) {
        along += 1;
        continue;
      }
      const start = along;
      while (along < length && at(along, across) === 1) {
        along += 1;
      }
      const end = along - 1;
      if (end - start + 1 < minLength) {
        continue;
      }
      const component = components.length;
      components.push({
        start,
        end,
        low: across,
        high: across,
        pixels: end - start + 1,
      });
      parents.push(component);
      current.push({ start, end, component });
    }

    // Runs in neighbouring rows that overlap (or touch diagonally) belong together.
    let p = 0;
    for (const run of current) {
      while (p < previous.length && previous[p].end < run.start - 1) {
        p += 1;
      }
      for (
        let q = p;
        q < previous.length && previous[q].start <= run.end + 1;
        q += 1
      ) {
        union(parents, components, previous[q].component, run.component);
      }
    }
    previous = current;
  }

  const lines: Array<Line> = [];
  components.forEach((component, index) => {
    if (find(parents, index) !== index) {
      return;
    }
    const span = component.end - component.start + 1;
    if (component.pixels / span > maxThickness) {
      return;
    }
    lines.push({
      start: component.start,
      end: component.end,
      low: component.low,
      high: component.high,
      position: (component.low + component.high) / 2,
    });
  });
  return lines;
}

function find(parents: Array<number>, index: number): number {
  let root = index;
  while (parents[root] !== root) {
    root = parents[root];
  }
  let node = index;
  while (parents[node] !== root) {
    const next = parents[node];
    parents[node] = root;
    node = next;
  }
  return root;
}

function union(
  parents: Array<number>,
  components: Array<Component>,
  a: number,
  b: number,
): void {
  const rootA = find(parents, a);
  const rootB = find(parents, b);
  if (rootA === rootB) {
    return;
  }
  parents[rootB] = rootA;
  const target = components[rootA];
  const source = components[rootB];
  target.start = Math.min(target.start, source.start);
  target.end = Math.max(target.end, source.end);
  target.low = Math.min(target.low, source.low);
  target.high = Math.max(target.high, source.high);
  target.pixels += source.pixels;
}
