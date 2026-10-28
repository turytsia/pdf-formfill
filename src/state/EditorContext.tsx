import type React from 'react';
import { createContext, useContext, useReducer, type Dispatch } from 'react';
import type { DetectedField } from '../detection/types';
import type { LoadedFormFont } from '../utilities/formFont';
import type { LoadedPage, LoadedPdf } from '../utilities/loadPdf';
import {
  editorReducer,
  INITIAL_EDITOR_STATE,
  type EditorAction,
  type EditorState,
} from './editorReducer';
import { useDetectedFields } from './useDetectedFields';
import { usePdfPages } from './usePdfPages';

export interface EditorContextValue {
  state: EditorState;
  dispatch: Dispatch<EditorAction>;
  font: LoadedFormFont;
  pages: Array<LoadedPage>;
  requestPage: (index: number) => void;
  fieldsByPage: Map<number, Array<DetectedField>>;
  requestDetection: (page: LoadedPage) => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

interface EditorProviderProps {
  font: LoadedFormFont;
  pdf: LoadedPdf;
  children: React.ReactNode;
}

export const EditorProvider: React.FC<EditorProviderProps> = ({
  font,
  pdf,
  children,
}) => {
  const [state, dispatch] = useReducer(editorReducer, INITIAL_EDITOR_STATE);
  const { pages, requestPage } = usePdfPages(pdf);
  const { fieldsByPage, requestDetection } = useDetectedFields();

  return (
    <EditorContext
      value={{
        state,
        dispatch,
        font,
        pages,
        requestPage,
        fieldsByPage,
        requestDetection,
      }}
    >
      {children}
    </EditorContext>
  );
};

export function useEditor(): EditorContextValue {
  const context = useContext(EditorContext);

  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }

  return context;
}
