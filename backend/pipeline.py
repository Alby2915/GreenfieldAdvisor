import pandas as pd
import numpy as np

class Handler:
    def __init__(self, next_handler=None):
        self.next = next_handler
    def handle(self, df):
        if self.next:
            return self.next.handle(df)
        return df

class DataCleaner(Handler):
    def handle(self, df_raw):
        df = df_raw.copy()
        targets = ['Irrigation', 'Fertilization', 'Energy']
        for col in targets:
            if col in df.columns:
                df[col] = df[col].astype(str).str.strip().str.upper().map({'SI': 1, 'NO': 0})
        
        mapping = {"Initial Stage": 0, "Development Stage": 1, "Mid stage": 2, "Last stage": 3, "Mid Season": 2, "Late Season": 3}
        if 'Crop_stage' in df.columns:
            df['Crop_stage_encoded'] = df['Crop_stage'].astype(str).str.strip().map(mapping)
        
        df = df.dropna()
        if 'Soil_moisture_pct' in df.columns:
            df = df[(df['Soil_moisture_pct'] >= 0) & (df['Soil_moisture_pct'] <= 100)]
        if 'Temperature_C' in df.columns:
            df = df[(df['Temperature_C'] > -10) & (df['Temperature_C'] < 55)]
        return super().handle(df)

class FeatureEngineer(Handler):
    def handle(self, df):
        df = df.copy()
        if 'Soil_moisture_pct' in df.columns: df['water_stress'] = df['Soil_moisture_pct'] < 30
        if 'Solar_Radiation_ghi' in df.columns: df['solar_stress'] = df['Solar_Radiation_ghi'] > df['Solar_Radiation_ghi'].median()
        if 'Nitrogen_mg_kg' in df.columns: df['low_nitrogen'] = df['Nitrogen_mg_kg'] < 40
        if 'Phosphorus_mg_kg' in df.columns: df['low_phosphorus'] = df['Phosphorus_mg_kg'] < 20
        if 'Potassium_mg_kg' in df.columns: df['low_potassium'] = df['Potassium_mg_kg'] < 40
        if 'Temperature_C' in df.columns: df['heat_stress'] = df['Temperature_C'] > 30
        if 'Evapotranspiration_mm' in df.columns:
            df['ET_ratio'] = (df['Evapotranspiration_mm'] / df['Reference_ET_mm']).replace([np.inf, -np.inf], 0).fillna(0)
        return super().handle(df)

class ModelEstimator(Handler):
    def __init__(self, strategy, features, target_name):
        super().__init__()
        self.strategy = strategy
        self.features = features
        self.target_name = target_name

    def handle(self, df):
        df = df.copy()
        df[f"{self.target_name}_Predicted"] = self.strategy.predict(df, self.features)
        return super().handle(df)