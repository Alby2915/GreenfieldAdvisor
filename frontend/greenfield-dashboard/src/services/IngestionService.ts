
import { io, type Socket } from 'socket.io-client';
import type { SensorSample, CropStage } from '../types';



export type Unsubscribe = () => void;
export type Subscriber = (s: SensorSample) => void;

export interface IngestionPort {
  /** Sottoscrive agli eventi sensore; restituisce una funzione di unsubscribe */
  subscribe(cb: Subscriber): Unsubscribe;
  /** (opzionale) Avvia la sorgente */
  start?(): Promise<void> | void;
  /** (opzionale) Ferma la sorgente */
  stop?(): Promise<void> | void;
  /** Nome sorgente (mock/ws) */
  readonly name?: string;
  /** Stato connessione (se disponibile) */
  readonly isConnected?: boolean;
  /** Ultimo errore (se disponibile) */
  readonly lastError?: string | null;
}

/** MOCK: genera dati simulati finché il backend non è pronto */
export class MockIngestion implements IngestionPort {
  readonly name = 'mock';
  private subs = new Set<Subscriber>();
  private timer: number | null = null;
  isConnected = false;
  lastError: string | null = null;

  start() {
    // evita duplicazioni
    if (this.timer !== null) return;
    this.isConnected = true;
    this.timer = window.setInterval(() => {
      try {
        const sample = fakeSample();
        for (const s of this.subs) s(sample);
      } 
catch (e: unknown) {
  // raffinamento sicuro
  const message =
    e instanceof Error ? e.message :
    typeof e === 'string' ? e :
    JSON.stringify(e);

  this.lastError = message;
}

    }, 1200);
  }

  stop() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isConnected = false;
  }

  subscribe(cb: Subscriber): Unsubscribe {
    this.subs.add(cb);
    // auto-start se non attivo
    if (this.timer === null) this.start?.();

    return () => {
      this.subs.delete(cb);
      if (this.subs.size === 0) this.stop?.();
    };
  }
}


export class WsIngestion implements IngestionPort {
  readonly name = 'ws';
  private url: string;
  private subs = new Set<Subscriber>();
  private socket?: Socket;
  isConnected = false;
  lastError: string | null = null;


constructor(url?: string) {
    this.url = url ?? String(import.meta.env.VITE_INGESTION_WS_URL ?? '');
  }
  start() {
    if (this.socket) return; 
    this.socket = io(this.url, { transports: ['websocket'], autoConnect: true });

    this.socket.on('connect', () => { this.isConnected = true; });
    this.socket.on('disconnect', () => { this.isConnected = false; });
    this.socket.on('connect_error', (err) => { this.lastError = err?.message ?? String(err); });

    
this.socket.on('sensor', (payload: unknown) => {
  try {
    const obj = (payload && typeof payload === 'object') ? payload as Record<string, unknown> : {};
    const sample = normalizeFromUnknown(obj);
    for (const sub of this.subs) sub(sample);
  } catch (e: unknown) {
    this.lastError = e instanceof Error ? e.message : typeof e === 'string' ? e : JSON.stringify(e);
  }
});

function normalizeFromUnknown(obj: Record<string, unknown>): SensorSample {
  const n = (k: string, d = 0) => {
    const v = obj[k];
    return typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : d;
  };
  const s = (k: string, d = '') => (typeof obj[k] === 'string' ? (obj[k] as string) : d);

  return {
    ts: n('ts', Date.now()) || n('timestamp', Date.now()),
    Temperature_C: n('Temperature_C') || n('temperature') || n('temp'),
    Humidity_pct: n('Humidity_pct') || n('humidity'),
    Soil_moisture_pct: n('Soil_moisture_pct') || n('soilMoisture'),
    Reference_ET_mm: n('Reference_ET_mm') || n('referenceEt'),
    Evapotranspiration_mm: n('Evapotranspiration_mm') || n('evapotranspiration') || n('et'),
    Crop_Coefficient: n('Crop_Coefficient') || n('kc'),
    Crop_stage: (s('Crop_stage') || s('cropStage') || 'Mid stage') as CropStage,
    Nitrogen_mg_kg: n('Nitrogen_mg_kg') || n('nitrogen') || n('n'),
    Phosphorus_mg_kg: n('Phosphorus_mg_kg') || n('phosphorus') || n('p'),
    Potassium_mg_kg: n('Potassium_mg_kg') || n('potassium') || n('k'),
    Solar_Radiation_ghi: n('Solar_Radiation_ghi') || n('ghi') || n('solar'),
    Wind_Speed: n('Wind_Speed') || n('wind'),
    Days_planted: n('Days_planted') || n('daysPlanted'),
    pH: n('pH') || n('ph'),
    Precipitation_mm: n('Precipitation_mm') || n('rain') || n('precipitation'),
  };
};
  }

  stop() {
    if (this.socket) {
      this.socket.removeAllListeners();
      if (this.socket.connected) this.socket.disconnect();
      this.socket = undefined;
    }
    this.isConnected = false;
  }

  subscribe(cb: Subscriber): Unsubscribe {
    this.subs.add(cb);
    if (!this.socket) this.start?.();

    return () => {
      this.subs.delete(cb);
      if (this.subs.size === 0) this.stop?.();
    };
  }
}

/** Helper: sample casuale ma plausibile */
function fakeSample(): SensorSample {
  const now = Date.now();
  const rand = (min: number, max: number) => +(min + Math.random() * (max - min)).toFixed(2);
  return {
    ts: now,
    Temperature_C: rand(18, 32),
    Humidity_pct: rand(60, 98),
    Soil_moisture_pct: rand(20, 60),
    Reference_ET_mm: rand(0.1, 9.8),
    Evapotranspiration_mm: rand(0.0, 9.7),
    Crop_Coefficient: rand(0.42, 1.5),
    Crop_stage: 'Mid stage',
    Nitrogen_mg_kg: rand(40, 120),
    Phosphorus_mg_kg: rand(20, 100),
    Potassium_mg_kg: rand(40, 140),
    Solar_Radiation_ghi: rand(50, 800),
    Wind_Speed: rand(0.5, 4.2),
    Days_planted: Math.floor(rand(1, 130)),
    pH: rand(3.5, 7.5),
    Precipitation_mm: Math.random() < 0.4 ? 0 : rand(0.1, 10),
  };
}