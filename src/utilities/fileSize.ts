// Above this, opening pages and exporting get noticeably slow, especially on phones.
export const LARGE_FILE_BYTES = 50 * 1024 * 1024;

const UNITS = ['B', 'KB', 'MB', 'GB'] as const;

export function formatBytes(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = value >= 10 || unit === 0 ? 0 : 1;
  return `${value.toFixed(digits)} ${UNITS[unit]}`;
}

export const isLargeFile = (bytes: number): boolean =>
  bytes >= LARGE_FILE_BYTES;
