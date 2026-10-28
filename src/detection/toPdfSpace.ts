import type { PageGeometry } from '../state/types';
import { FieldKind, type Box, type DetectedField } from './types';

// Converts a field found on a raster of `page` (y down, pixels) to PDF user space (y up, points).
export function fieldToPdfSpace(
  field: DetectedField,
  page: PageGeometry,
  pixelsPerPoint: number,
): DetectedField {
  const convert = (box: Box): Box => ({
    left: page.x0 + box.left / pixelsPerPoint,
    right: page.x0 + box.right / pixelsPerPoint,
    top: page.y1 - box.top / pixelsPerPoint,
    bottom: page.y1 - box.bottom / pixelsPerPoint,
  });

  if (field.kind === FieldKind.BoxRow) {
    return { kind: FieldKind.BoxRow, boxes: field.boxes.map(convert) };
  }
  return { kind: FieldKind.Box, box: convert(field.box) };
}
