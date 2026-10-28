export function downloadBytes(bytes: Uint8Array, fileName: string): void {
  const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  // Revoking synchronously cancels the download in Safari.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const getFilledFileName = (sourceName: string): string =>
  `${sourceName.replace(/\.pdf$/i, '')}-filled.pdf`;
