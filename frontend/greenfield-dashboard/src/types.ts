
export type CropStage = 'Initial Stage' | 'Development Stage' | 'Mid stage' | 'Last stage';

export interface SensorSample {
  ts: number;                   // epoch ms
  Temperature_C: number;
  Humidity_pct: number;
  Soil_moisture_pct: number;
  Reference_ET_mm: number;
  Evapotranspiration_mm: number;
  Crop_Coefficient: number;
  Crop_stage: CropStage;
  Nitrogen_mg_kg: number;
  Phosphorus_mg_kg: number;
  Potassium_mg_kg: number;
  Solar_Radiation_ghi: number;
  Wind_Speed: number;
  Days_planted: number;
  pH: number;
  Precipitation_mm: number;
}

export interface PredictionInput {
  current: SensorSample;
  window?: SensorSample[];   
}

export interface Prediction {
  modelId: string;
  irrigation: 0 | 1;
  fertilization?: 0 | 1;
  energy?: 0 | 1;
  confidence?: number;      
  rationale?: string;        
}

export interface AiModelInfo {
  id: string;
  name: string;
  description: string;
}

export interface VisionAdvice {
  title: string;
  severity: 'error' | 'warning' | 'success' | 'info';
  description: string;
  actions: string[];
  prevention: string;
  confidence_score: number;
}

export interface VisionResponse {
  category: string;
  advice: VisionAdvice;
}