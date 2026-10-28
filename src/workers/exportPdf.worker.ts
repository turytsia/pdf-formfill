import { exportFilledPdf } from '../utilities/exportPdf';
import type { ExportRequest, ExportResponse } from './exportMessages';

// The project compiles against the DOM lib, so the worker scope is typed by hand.
interface ExportWorkerScope {
  addEventListener: (
    type: 'message',
    listener: (event: MessageEvent<ExportRequest>) => void,
  ) => void;
  postMessage: (message: ExportResponse, transfer: Array<Transferable>) => void;
}

const scope = self as unknown as ExportWorkerScope;

scope.addEventListener('message', (event) => {
  const { source, items, fontBytes } = event.data;

  exportFilledPdf(source, items, fontBytes)
    .then((saved) => {
      const bytes = new Uint8Array(
        saved.buffer as ArrayBuffer,
        saved.byteOffset,
        saved.byteLength,
      );
      scope.postMessage({ ok: true, bytes }, [bytes.buffer]);
    })
    .catch((error: unknown) => {
      scope.postMessage(
        {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : 'The PDF could not be exported.',
        },
        [],
      );
    });
});
