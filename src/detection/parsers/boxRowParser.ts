import { FieldKind, type BoxRun, type DetectedBoxRow } from '../types';

// Two or more square boxes side by side: a field written one character per box.
export function parseBoxRows(runs: Array<BoxRun>): Array<DetectedBoxRow> {
  return runs
    .filter((run) => run.cells.length >= 2)
    .map((run) => ({ kind: FieldKind.BoxRow, boxes: run.cells }));
}
