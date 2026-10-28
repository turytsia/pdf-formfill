import { detectFields } from '../detection/detectFields';
import type { DetectRequest, DetectResponse } from './detectMessages';

// The project compiles against the DOM lib, so the worker scope is typed by hand.
interface DetectWorkerScope {
  addEventListener: (
    type: 'message',
    listener: (event: MessageEvent<DetectRequest>) => void,
  ) => void;
  postMessage: (message: DetectResponse) => void;
}

const scope = self as unknown as DetectWorkerScope;

scope.addEventListener('message', (event) => {
  const { rgba, width, height, pixelsPerPoint } = event.data;
  try {
    scope.postMessage({
      ok: true,
      fields: detectFields(rgba, width, height, pixelsPerPoint),
    });
  } catch (error) {
    scope.postMessage({
      ok: false,
      message: error instanceof Error ? error.message : 'Detection failed.',
    });
  }
});
