
export enum Status {
  Idle = 'idle',
  Identifying = 'identifying',
  Fetching = 'fetching',
  Narrating = 'narrating',
  Done = 'done',
  Error = 'error',
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

// Component Props Interfaces
export interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  isProcessing: boolean;
}

export interface InlineLoaderProps {
  text: string;
}

export interface AnalysisResultProps {
  imageUrl: string;
  landmarkName: string;
  landmarkInfo: string;
  audioData: string;
  sources: GroundingChunk[];
  onReset: () => void;
  status: Status;
}

export interface ErrorDisplayProps {
  error: string;
  onReset: () => void;
}
