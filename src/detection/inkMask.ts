// Every n-th pixel is enough to find the paper colour.
const PAPER_SAMPLE_STEP = 7;

// Ink is anything noticeably darker than the paper. Scans differ in paper tone,
// so the threshold follows the page's median brightness (most of a form is paper).
export function estimateInkThreshold(
  rgba: Uint8ClampedArray,
  margin: number,
): number {
  const histogram = new Uint32Array(256);
  let samples = 0;
  for (let offset = 0; offset < rgba.length; offset += 4 * PAPER_SAMPLE_STEP) {
    histogram[Math.round(luminanceAt(rgba, offset))] += 1;
    samples += 1;
  }
  let seen = 0;
  for (let level = 0; level < 256; level += 1) {
    seen += histogram[level];
    if (seen >= samples / 2) {
      return level - margin;
    }
  }
  return 255 - margin;
}

// 1 where the pixel is darker than `threshold` (0–255 luminance), 0 elsewhere.
export function toInkMask(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number,
): Uint8Array {
  const mask = new Uint8Array(width * height);
  for (let index = 0, offset = 0; index < mask.length; index += 1) {
    mask[index] = luminanceAt(rgba, offset) < threshold ? 1 : 0;
    offset += 4;
  }
  return mask;
}

function luminanceAt(rgba: Uint8ClampedArray, offset: number): number {
  return (
    (rgba[offset] * 299 + rgba[offset + 1] * 587 + rgba[offset + 2] * 114) /
    1000
  );
}
