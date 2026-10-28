import type React from 'react';
import { createContext, useContext, useReducer, type Dispatch } from 'react';
import type { LoadedFormFont } from '../utilities/formFont';
import type { LoadedPage } from '../utilities/loadPdf';
import {
  editorReducer,
  INITIAL_EDITOR_STATE,
  type EditorAction,
  type EditorState,
} from './editorReducer';

export interface EditorContextValue {
  state: EditorState;
  dispatch: Dispatch<EditorAction>;
  font: LoadedFormFont;
  pages: Array<LoadedPage>;
}

const EditorContext = createContext<EditorContextValue | null>(null);

interface EditorProviderProps {
  font: LoadedFormFont;
  pages: Array<LoadedPage>;
  children: React.ReactNode;
}

export const EditorProvider: React.FC<EditorProviderProps> = ({
  font,
  pages,
  children,
}) => {
  const [state, dispatch] = useReducer(editorReducer, INITIAL_EDITOR_STATE);

  return (
    <EditorContext value={{ state, dispatch, font, pages }}>
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
