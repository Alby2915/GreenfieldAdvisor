import type { SensorSample } from '../types';

export interface ServerToClientEvents {
  // l’evento 'sensor' porta un payload conforme (o quasi) a SensorSample (anche partial)
  sensor: (payload: Partial<Record<keyof SensorSample, unknown>> & { ts?: number }) => void;
}

export interface ClientToServerEvents {
   ping: () => void;
}
