import { FieldKind, type BoxRun, type DetectedBox } from '../types';

// A square box on its own: a checkbox that takes an X.
export function parseSingleBoxes(runs: Array<BoxRun>): Array<DetectedBox> {
  return runs
    .filter((run) => run.cells.length === 1)
    .map((run) => ({ kind: FieldKind.Box, box: run.cells[0] }));
}
