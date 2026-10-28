import type { Item } from '../state/types';

export interface ExportRequest {
  source: ArrayBuffer;
  items: Array<Item>;
  fontBytes: ArrayBuffer;
}

export type ExportResponse =
  { ok: true; bytes: Uint8Array<ArrayBuffer> } | { ok: false; message: string };
