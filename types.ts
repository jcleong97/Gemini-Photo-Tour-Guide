
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
