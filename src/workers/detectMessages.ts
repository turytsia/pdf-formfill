import type { DetectedField } from '../detection/types';

export interface DetectRequest {
  rgba: Uint8ClampedArray<ArrayBuffer>;
  width: number;
  height: number;
  pixelsPerPoint: number;
}

export type DetectResponse =
  { ok: true; fields: Array<DetectedField> } | { ok: false; message: string };
