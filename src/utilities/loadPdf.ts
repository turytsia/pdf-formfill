import {
  getDocument,
  GlobalWorkerOptions,
  type PDFPageProxy,
} from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { PageGeometry } from '../state/types';

GlobalWorkerOptions.workerSrc = workerUrl;

export interface LoadedPage {
  proxy: PDFPageProxy;
  geometry: PageGeometry;
}

export interface LoadedPdf {
  name: string;
  bytes: ArrayBuffer;
  pages: Array<LoadedPage>;
}

export type PdfLoadResult =
  { ok: true; pdf: LoadedPdf } | { ok: false; message: string };

export async function loadPdf(file: File): Promise<PdfLoadResult> {
  const bytes = await file.arrayBuffer();

  try {
    // pdf.js transfers the buffer to its worker, so it gets a copy and the original stays usable for export.
    const pdfDocument = await getDocument({
      data: new Uint8Array(bytes.slice(0)),
    }).promise;
    const proxies = await Promise.all(
      Array.from({ length: pdfDocument.numPages }, (_, index) =>
        pdfDocument.getPage(index + 1),
      ),
    );

    return {
      ok: true,
      pdf: { name: file.name, bytes, pages: proxies.map(toLoadedPage) },
    };
  } catch (error) {
    return { ok: false, message: describeLoadError(error) };
  }
}

export const isPdfFile = (file: File): boolean =>
  file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

function toLoadedPage(proxy: PDFPageProxy, index: number): LoadedPage {
  const [x0, y0, x1, y1] = proxy.view;

  return {
    proxy,
    geometry: { index, x0, y0, x1, y1, width: x1 - x0, height: y1 - y0 },
  };
}

function describeLoadError(error: unknown): string {
  const name = error instanceof Error ? error.name : '';

  if (name === 'PasswordException') {
    return 'This PDF is password protected. Remove the password and try again.';
  }

  if (name === 'InvalidPDFException') {
    return 'This file is not a valid PDF.';
  }

  return 'The file could not be opened. Try a different PDF.';
}
