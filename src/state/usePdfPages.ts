import { useCallback, useRef, useState } from 'react';
import {
  createInitialPages,
  toLoadedPage,
  type LoadedPage,
  type LoadedPdf,
} from '../utilities/loadPdf';

export interface PdfPages {
  pages: Array<LoadedPage>;
  requestPage: (index: number) => void;
}

export function usePdfPages(pdf: LoadedPdf): PdfPages {
  const [pages, setPages] = useState(() => createInitialPages(pdf));
  const requestedRef = useRef(new Set<number>([0]));

  // Stable so page components can list it as an effect dependency.
  const requestPage = useCallback(
    (index: number): void => {
      if (requestedRef.current.has(index)) {
        return;
      }
      requestedRef.current.add(index);
      pdf.document
        .getPage(index + 1)
        .then((proxy) => {
          setPages((current) =>
            current.map((page) =>
              page.geometry.index === index ? toLoadedPage(proxy, index) : page,
            ),
          );
        })
        .catch((error: unknown) => {
          requestedRef.current.delete(index);
          console.error(error);
        });
    },
    [pdf.document],
  );

  return { pages, requestPage };
}
