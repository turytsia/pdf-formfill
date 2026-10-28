/// <reference types="node" />
/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// GitHub Pages serves the app from /<repo>/; the deploy workflow sets BASE_PATH.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  worker: { format: 'es' },
  // Only the export worker imports these; without pre-bundling, the dev server
  // discovers them mid-export and rejects the worker's imports with 504s.
  optimizeDeps: { include: ['pdf-lib', '@pdf-lib/fontkit'] },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    css: false,
  },
});
