import { useCallback, useRef, useState } from 'react';
import type { DetectedField } from '../detection/types';
import { detectPageFields } from '../utilities/detectPageFields';
import type { LoadedPage } from '../utilities/loadPdf';

export interface DetectedFields {
  fieldsByPage: Map<number, Array<DetectedField>>;
  requestDetection: (page: LoadedPage) => void;
}

export function useDetectedFields(): DetectedFields {
  const [fieldsByPage, setFieldsByPage] = useState(
    () => new Map<number, Array<DetectedField>>(),
  );
  const requestedRef = useRef(new Set<number>());
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  // Stable so page components can list it as an effect dependency.
  const requestDetection = useCallback((page: LoadedPage): void => {
    const { proxy, geometry } = page;
    if (!proxy || requestedRef.current.has(geometry.index)) {
      return;
    }
    requestedRef.current.add(geometry.index);
    // One page at a time, so detection never competes with rendering the visible pages.
    queueRef.current = queueRef.current.then(async () => {
      try {
        const fields = await detectPageFields(proxy, geometry);
        setFieldsByPage((current) =>
          new Map(current).set(geometry.index, fields),
        );
      } catch (error) {
        requestedRef.current.delete(geometry.index);
        console.error(error);
      }
    });
  }, []);

  return { fieldsByPage, requestDetection };
}
