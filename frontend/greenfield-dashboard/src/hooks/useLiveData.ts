import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface SensorData {
  ts: number;
  Temperature_C: number;
  Humidity_pct: number;
  Soil_moisture_pct: number;
  Nitrogen_mg_kg?: number;
  Phosphorus_mg_kg?: number;
  Potassium_mg_kg?: number;
  pH?: number;
  _row_id?: number;
}

export interface AdviceDetails {
  irrigation: { status: string; reason: string; confidence?: number };
  fertilization: { N: string; P: string; K: string; reason: string };
  energy: { status: string; reason: string };
}

export interface FullAdvice {
  rules: AdviceDetails;
  ai: AdviceDetails;
  ts: number;
}

export function useLiveData(maxPoints: number = 50) {
  const [latest, setLatest] = useState<SensorData | null>(null);
  const [series, setSeries] = useState<SensorData[]>([]);
  const [advice, setAdvice] = useState<FullAdvice | null>(null); 
  const [isConnected, setIsConnected] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {

    const wsUrl = 'http://localhost:8080';
    
    console.log(`🔌 [useLiveData] Tentativo connessione WebSocket verso: ${wsUrl}`);

    socketRef.current = io(wsUrl, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ WebSocket Connesso!');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket Disconnesso');
      setIsConnected(false);
    });

    // 1. Ascolto Dati Sensori (Grafici)
    socket.on('sensor', (data: SensorData) => {
      const point = { ...data, ts: data.ts || Date.now() };
      setLatest(point);
      setSeries(prev => {
        const newSeries = [...prev, point];
        if (newSeries.length > maxPoints) {
          return newSeries.slice(newSeries.length - maxPoints);
        }
        return newSeries;
      });
    });

    // 2. Ascolto Consigli Intelligenti (AI + Rules)
    socket.on('ai_advice', (data: FullAdvice) => {
      setAdvice(data);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [maxPoints]);

  return { latest, series, advice, isConnected };
}