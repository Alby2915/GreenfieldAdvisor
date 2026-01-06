import type { Prediction, PredictionInput, AiModelInfo } from '../types';

export interface ModelProvider {
  id: string;
  name: string;
  description: string;
  predict(input: PredictionInput): Promise<Prediction>;
}



/// <reference types="vite/client" />

export class RestModelProvider implements ModelProvider {
  public id: string;
  public name: string;
  public description: string;
  private base: string;

  constructor(id: string, name: string, description: string, base?: string) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.base = base ?? import.meta.env.VITE_AI_API_BASE; 
  }

  async predict(input: PredictionInput): Promise<Prediction> {
    const res = await fetch(`${this.base}/predict?model=${this.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`AI error: ${res.status}`);
    const p = await res.json();
    return { modelId: this.id, ...p };
  }
}



export class RuleBasedProvider implements ModelProvider {
  id = 'rules';
  name = 'Rule Based Suggestion';
  description = 'operational suggestion based on shared standards';
  async predict(input: PredictionInput): Promise<Prediction> {
    const s = input.current;
    const ETc = s.Crop_Coefficient * s.Reference_ET_mm;
    const deficit = Math.max(0, ETc - s.Precipitation_mm);
    const lowMoist = s.Soil_moisture_pct < 30;
    const irrigate = deficit > 0.5 && lowMoist ? 1 : 0;
    return {
      modelId: this.id,
      irrigation: irrigate,
      confidence: irrigate ? Math.min(1, (deficit/10) + (lowMoist?0.3:0)) : 0.5,
      rationale: `ETc=${ETc.toFixed(2)}mm, Rain=${s.Precipitation_mm.toFixed(2)}mm, Deficit=${deficit.toFixed(2)}mm, Soil=${s.Soil_moisture_pct}%`
    };
  }
}


export const ModelRegistry: ModelProvider[] = [
  new RuleBasedProvider(),
  new RestModelProvider('logreg', 'Ai Suggestion', 'Logistic regression model trained with dataset'),
];

export const modelsInfo: AiModelInfo[] = ModelRegistry.map(m => ({ id: m.id, name: m.name, description: m.description }));
