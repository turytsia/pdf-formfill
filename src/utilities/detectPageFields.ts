import type { PDFPageProxy } from 'pdfjs-dist';
import { fieldToPdfSpace } from '../detection/toPdfSpace';
import type { DetectedField } from '../detection/types';
import type { PageGeometry } from '../state/types';
import type { DetectRequest, DetectResponse } from '../workers/detectMessages';

// Box edges on scanned forms are a pixel or two wide at this resolution.
const DETECTION_PIXELS_PER_POINT = 2;

// Renders the page at a fixed resolution and finds its fields off the main thread.
// The result is in PDF user space.
export async function detectPageFields(
  proxy: PDFPageProxy,
  page: PageGeometry,
): Promise<Array<DetectedField>> {
  const viewport = proxy.getViewport({ scale: DETECTION_PIXELS_PER_POINT });
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  await proxy.render({ canvas, viewport }).promise;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D context is not available');
  }
  const { data, width, height } = context.getImageData(
    0,
    0,
    canvas.width,
    canvas.height,
  );
  canvas.width = 0;
  canvas.height = 0;

  const fields = await runDetection({
    rgba: data,
    width,
    height,
    pixelsPerPoint: DETECTION_PIXELS_PER_POINT,
  });
  return fields.map((field) =>
    fieldToPdfSpace(field, page, DETECTION_PIXELS_PER_POINT),
  );
}

function runDetection(request: DetectRequest): Promise<Array<DetectedField>> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('../workers/detectFields.worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker.addEventListener(
      'message',
      (event: MessageEvent<DetectResponse>) => {
        worker.terminate();
        if (event.data.ok) {
          resolve(event.data.fields);
        } else {
          reject(new Error(event.data.message));
        }
      },
    );
    worker.addEventListener('error', (event) => {
      worker.terminate();
      reject(new Error(event.message || 'Field detection failed.'));
    });
    worker.postMessage(request, [request.rgba.buffer]);
  });
}
