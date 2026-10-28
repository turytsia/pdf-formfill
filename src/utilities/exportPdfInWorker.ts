import type { ExportRequest, ExportResponse } from '../workers/exportMessages';

const OUT_OF_MEMORY_MESSAGE =
  'The PDF could not be exported. The file may be too large for this device.';

// pdf-lib parses and re-serialises the whole file; off the main thread the UI stays responsive.
export function exportPdfInWorker(
  request: ExportRequest,
): Promise<Uint8Array<ArrayBuffer>> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('../workers/exportPdf.worker.ts', import.meta.url),
      { type: 'module' },
    );

    worker.addEventListener(
      'message',
      (event: MessageEvent<ExportResponse>) => {
        worker.terminate();
        if (event.data.ok) {
          resolve(event.data.bytes);
        } else {
          reject(new Error(event.data.message));
        }
      },
    );
    worker.addEventListener('error', (event) => {
      worker.terminate();
      reject(new Error(event.message || OUT_OF_MEMORY_MESSAGE));
    });

    // The source buffer is cloned, not transferred, so later exports can reuse it.
    worker.postMessage(request);
  });
}
