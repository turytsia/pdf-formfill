import type React from 'react';
import { Suspense, use, useState } from 'react';
import { Dropzone } from './components/Dropzone/Dropzone';
import { Editor } from './components/Editor/Editor';
import { LoadingScreen } from './components/LoadingScreen/LoadingScreen';
import { loadFormFont } from './utilities/formFont';
import { isPdfFile, loadPdf, type PdfLoadResult } from './utilities/loadPdf';

const SAMPLE_FORM_NAME = 'sample-form.pdf';
const SAMPLE_FORM_URL = `${import.meta.env.BASE_URL}samples/${SAMPLE_FORM_NAME}`;

interface Session {
  id: number;
  result: Promise<PdfLoadResult>;
}

export const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openFile = (file: File): void => {
    if (!isPdfFile(file)) {
      setError(`"${file.name}" is not a PDF. Only PDF files are supported.`);
      return;
    }
    setError(null);
    setSession({ id: Date.now(), result: loadPdf(file) });
  };

  const openSample = async (): Promise<void> => {
    const response = await fetch(SAMPLE_FORM_URL);
    const blob = await response.blob();
    openFile(new File([blob], SAMPLE_FORM_NAME, { type: 'application/pdf' }));
  };

  const close = (): void => setSession(null);

  if (!session) {
    return (
      <Dropzone onFile={openFile} onOpenSample={openSample} error={error} />
    );
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <DocumentGate
        key={session.id}
        result={session.result}
        onFile={openFile}
        onOpenSample={openSample}
        onClose={close}
      />
    </Suspense>
  );
};

interface DocumentGateProps {
  result: Promise<PdfLoadResult>;
  onFile: (file: File) => void;
  onOpenSample: () => void;
  onClose: () => void;
}

const DocumentGate: React.FC<DocumentGateProps> = ({
  result,
  onFile,
  onOpenSample,
  onClose,
}) => {
  const loaded = use(result);
  const font = use(loadFormFont());

  if (!loaded.ok) {
    return (
      <Dropzone
        onFile={onFile}
        onOpenSample={onOpenSample}
        error={loaded.message}
      />
    );
  }

  return <Editor pdf={loaded.pdf} font={font} onReplace={onClose} />;
};
