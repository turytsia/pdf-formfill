import { describe, expect, it } from 'vitest';
import { formatBytes, isLargeFile, LARGE_FILE_BYTES } from './fileSize';

describe('fileSize', () => {
  it.each([
    [512, '512 B'],
    [1536, '1.5 KB'],
    [52_428_800, '50 MB'],
    [190_840_832, '182 MB'],
    [1_610_612_736, '1.5 GB'],
  ])('should format %s bytes as "%s"', (bytes, expected) => {
    expect(formatBytes(bytes)).toBe(expected);
  });

  it('should treat files at the threshold as large', () => {
    expect(isLargeFile(LARGE_FILE_BYTES)).toBe(true);
  });

  it('should not treat files below the threshold as large', () => {
    expect(isLargeFile(LARGE_FILE_BYTES - 1)).toBe(false);
  });
});
