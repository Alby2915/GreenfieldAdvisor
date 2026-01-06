import pandas as pd
import numpy as np
import warnings

warnings.filterwarnings('ignore', category=pd.errors.SettingWithCopyWarning)

INPUT_FILE = "dataset/tomato_irrigation_dataset_modificato.csv"
OUTPUT_FILE = "dataset/enriched_tomato_irrigation_dataset.csv"

# Configurazione Logica Scientifica e Energetica 
IRRIGATION_THRESHOLD = 60.0 # % VWC
N_MIN = 50.0  # mg/kg 
P_MIN = 30.0  # mg/kg 
K_MIN = 100.0  # mg/kg 
PH_MIN = 6.2  
PH_MAX = 6.8  

# NUOVE SOGLIE ENERGETICHE
TEMP_OPTIMAL_MIN = 21.0 # °C
TEMP_OPTIMAL_MAX = 28.0 # °C
HUMIDITY_OPTIMAL_MAX = 80.0 # %


def clean_and_convert(series, is_italian_format=True, is_percentage=False):
    series_str = series.astype(str)
    if is_percentage:
        series_str = series_str.str.replace('%', '', regex=False)
    if is_italian_format:
        series_str = series_str.str.replace('.', '', regex=False)
        series_str = series_str.str.replace(',', '.', regex=False)
    else:
        series_str = series_str.str.replace(',', '', regex=False)
    return pd.to_numeric(series_str, errors='coerce')


def enrich_dataset_final_robust_energy_fix():
    """Carica, pulisce, arricchisce e salva il dataset con logica Energy corretta."""
    try:
        df = pd.read_csv(INPUT_FILE, delimiter=';')
        original_rows = len(df)

        # 1. Rinomina Colonne
        df.columns = [
            'Temperature_C', 'Humidity_pct', 'Soil_moisture_pct', 'Reference_ET_mm',
            'Evapotranspiration_mm', 'Crop_Coefficient', 'Crop_stage',
            'Nitrogen_mg_kg', 'Phosphorus_mg_kg', 'Potassium_mg_kg',
            'Solar_Radiation_ghi', 'Wind_Speed', 'Days_planted', 'pH'
        ]

        # 2. Pulizia e Conversione a Float (Robusta)
        df['Soil_moisture_pct'] = clean_and_convert(df['Soil_moisture_pct'], is_percentage=True)
        df['Reference_ET_mm'] = clean_and_convert(df['Reference_ET_mm'], is_italian_format=True)
        df['Evapotranspiration_mm'] = clean_and_convert(df['Evapotranspiration_mm'], is_italian_format=True)
        df['Wind_Speed'] = clean_and_convert(df['Wind_Speed'], is_italian_format=False)
        
        df.dropna(subset=['Soil_moisture_pct', 'Reference_ET_mm', 'Evapotranspiration_mm', 'Wind_Speed'], inplace=True)
        cleaned_rows = len(df)
        if original_rows != cleaned_rows:
            print(f"ATTENZIONE: Rimosse {original_rows - cleaned_rows} righe a causa di dati numerici corrotti.")

        # 3. Arrotondamento
        df['Reference_ET_mm'] = df['Reference_ET_mm'].round(2)
        df['Evapotranspiration_mm'] = df['Evapotranspiration_mm'].round(2)

        # 4. Generazione delle Etichette Target (AI) - LOGICA FINALE
        
        # 4.1. Irrigation (Logica invariata + Pioggia)
        df['Irrigation'] = np.where(
            (df['Soil_moisture_pct'] < IRRIGATION_THRESHOLD),
            'SI',
            'NO'
        )
        
        # 4.2. Fertilization (Logica invariata)
        df['Fertilization'] = np.where(
            (df['Nitrogen_mg_kg'] < N_MIN) | (df['Phosphorus_mg_kg'] < P_MIN) | 
            (df['Potassium_mg_kg'] < K_MIN) | (df['pH'] < PH_MIN) | (df['pH'] > PH_MAX),
            'SI',
            'NO'
        )

        # 4.3. Energy (Logica CORRETTA - Ottimizzazione Climatica)
        df['Energy'] = np.where(
            # Troppo freddo? (Serve riscaldamento/isolamento)
            (df['Temperature_C'] < TEMP_OPTIMAL_MIN) | 
            # Troppo caldo o troppo umido? (Serve ventilazione/raffreddamento/ombreggiatura)
            (df['Temperature_C'] > TEMP_OPTIMAL_MAX) |
            (df['Humidity_pct'] > HUMIDITY_OPTIMAL_MAX),
            'SI',
            'NO'
        )
        
        # 5. Salvataggio del dataset arricchito
        df.to_csv(OUTPUT_FILE, index=False)
        print(f"\nOperazioni terminate con successo. Dataset arricchito salvato in: {OUTPUT_FILE}")
        
    except FileNotFoundError:
        print(f"ERRORE: Assicurati che il file '{INPUT_FILE}' sia nella stessa directory dello script.")
    except Exception as e:
        print(f"Si è verificato un errore inaspettato durante l'elaborazione dei dati: {e}")

if __name__ == "__main__":
    enrich_dataset_final_robust_energy_fix()