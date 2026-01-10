import json
import time
import os
import pandas as pd
import numpy as np
from confluent_kafka import Consumer, Producer
from pipeline import DataCleaner, FeatureEngineer, ModelEstimator
from strategies_model import LogisticRegressionStrategy, RuleBasedStrategy
from data_loader import load_dataset_robust

# Configurazione Kafka
KAFKA_CONF = {
    'bootstrap.servers': 'localhost:9092', 
    'group.id': 'analyzer-brain-v1', 
    'auto.offset.reset': 'latest'
}
producer = Producer({'bootstrap.servers': 'localhost:9092'})

# Stato Interno
SYSTEM_CONFIG = {
    "moisture_threshold": 40.0, "temp_min": 18.0, "temp_max": 28.0,
    "n_threshold": 50.0, "p_threshold": 30.0, "k_threshold": 100.0,
    "email": "agronomo@greenfield.it"
}
SETTINGS_UPDATED = False # Flag: False = usa default hardcoded, True = usa SYSTEM_CONFIG


# 1. SETUP & TRAINING (Eseguito all'avvio del servizio)

print("🧠 ANALYZER: Avvio training modelli...")
FEATURES = ['Soil_moisture_pct', 'Temperature_C', 'Humidity_pct', 
            'Nitrogen_mg_kg', 'Phosphorus_mg_kg', 'Potassium_mg_kg', 'pH']

# Inizializza Strategie (Default)
rule_irr = RuleBasedStrategy('Irrigation')
rule_fert = RuleBasedStrategy('Fertilization')
rule_en = RuleBasedStrategy('Energy')

pipe_irr, pipe_fert, pipe_en = None, None, None

try:
    csv_path = "dataset/enriched_tomato_irrigation_dataset.csv"
    if not os.path.exists(csv_path): csv_path = "dataset/data_test.csv"
    
    df_raw = load_dataset_robust(csv_path)
    cleaner = DataCleaner(FeatureEngineer())
    df_train = cleaner.handle(df_raw).fillna(0)

    # Training AI
    strat_irr = LogisticRegressionStrategy(max_iter=500)
    strat_fert = LogisticRegressionStrategy(max_iter=500)
    strat_en = LogisticRegressionStrategy(max_iter=500)

    print("   ...Addestramento Logistic Regression...")
    strat_irr.train(df_train[FEATURES], rule_irr.predict(df_train))
    strat_fert.train(df_train[FEATURES], rule_fert.predict(df_train))
    strat_en.train(df_train[FEATURES], rule_en.predict(df_train))

    # Creazione Pipeline
    pipe_irr = DataCleaner(FeatureEngineer(ModelEstimator(strat_irr, FEATURES, "Irrigation")))
    pipe_fert = DataCleaner(FeatureEngineer(ModelEstimator(strat_fert, FEATURES, "Fertilization")))
    pipe_en = DataCleaner(FeatureEngineer(ModelEstimator(strat_en, FEATURES, "Energy")))
    print("✅ ANALYZER: Modelli pronti e operativi.")

except Exception as e:
    print(f"❌ Errore critico nel Training: {e}")


# 2. LOOP DI ELABORAZIONE (Event Loop)

def main():
    global SETTINGS_UPDATED, SYSTEM_CONFIG
    consumer = Consumer(KAFKA_CONF)
    # Ascolta i dati dei sensori E i comandi di configurazione
    consumer.subscribe(['sensor-data', 'system-settings'])
    
    print("🟢 ANALYZER: In ascolto su Kafka...")

    while True:
        msg = consumer.poll(0.1)
        if msg is None: continue
        if msg.error(): continue

        topic = msg.topic()
        payload = json.loads(msg.value().decode('utf-8'))

        # A. GESTIONE CAMBIO SETTINGS (Evento asincrono) 
        if topic == 'system-settings':
            print(f"⚙️ RICEVUTO AGGIORNAMENTO CONFIG: {payload}")
            SYSTEM_CONFIG.update(payload)
            SETTINGS_UPDATED = True
            
            continue

        # B. ELABORAZIONE DATI SENSORE 
        if topic == 'sensor-data':
            data = payload
            
            # 1. Applica Configurazioni (Se aggiornate dall'utente)
            if SETTINGS_UPDATED:
                rule_irr.m_thr = SYSTEM_CONFIG["moisture_threshold"]
                rule_en.tmin_thr = SYSTEM_CONFIG["temp_min"]
                rule_en.tmax_thr = SYSTEM_CONFIG["temp_max"]
                rule_fert.n_thr = SYSTEM_CONFIG["n_threshold"]
                rule_fert.p_thr = SYSTEM_CONFIG["p_threshold"]
                rule_fert.k_thr = SYSTEM_CONFIG["k_threshold"]

            # 2. Preparazione Dato
            df_single = pd.DataFrame([data])
            
            # 3. Calcolo Regole (Rule Based)
            res_rules = {
                'irrigation': {
                    'status': 'ON' if rule_irr.predict(df_single)[0] == 1 else 'OFF',
                    'reason': f"Soglia attiva: < {rule_irr.m_thr}%"
                },
                'energy': {
                    'status': 'ACTIVE' if rule_en.predict(df_single)[0] == 1 else 'OFF',
                    'reason': f"Range attivo: {rule_en.tmin_thr}-{rule_en.tmax_thr}°C"
                },
                'fertilization': {
                    'N': 'LOW' if data.get('Nitrogen_mg_kg',0) < rule_fert.n_thr else 'OK',
                    'P': 'LOW' if data.get('Phosphorus_mg_kg',0) < rule_fert.p_thr else 'OK',
                    'K': 'LOW' if data.get('Potassium_mg_kg',0) < rule_fert.k_thr else 'OK',
                    'reason': f"Soglie NPK: {rule_fert.n_thr}/{rule_fert.p_thr}/{rule_fert.k_thr}"
                }
            }

            # 4. Calcolo AI (Machine Learning)
            res_ai = {'irrigation': {'status':'OFF'}, 'fertilization': {'N':'OK'}, 'energy': {'status':'OFF'}}
            if pipe_irr:
                try:
                    # Fix per colonne mancanti nel df singolo
                    cols_needed = FEATURES + ['Temp_min_C', 'Temp_max_C']
                    df_ai = pd.DataFrame({k: [float(data.get(k, 0))] for k in cols_needed})
                    
                    p_irr = pipe_irr.handle(df_ai)["Irrigation_Predicted"].iloc[0]
                    p_fert = pipe_fert.handle(df_ai)["Fertilization_Predicted"].iloc[0]
                    p_en = pipe_en.handle(df_ai)["Energy_Predicted"].iloc[0]

                    res_ai['irrigation'] = {'status': 'ON' if p_irr==1 else 'OFF', 'reason': 'AI (LogReg)'}
                    res_ai['energy'] = {'status': 'ACTIVE' if p_en==1 else 'OFF', 'reason': 'AI (LogReg)'}
                    res_ai['fertilization'] = {'N': 'CHECK' if p_fert==1 else 'OK', 'P':'OK', 'K':'OK', 'reason': 'AI (LogReg)'}
                except Exception as e:
                    print(f"⚠️ Errore AI Inference: {e}")

            # 5. Pubblicazione Risultato (System Advice)
            advice_packet = {
                'ts': data.get('ts', time.time()),
                'rules': res_rules,
                'ai': res_ai,
                'config': SYSTEM_CONFIG,
                'settings_updated': SETTINGS_UPDATED
            }
            
            # Invia al topic che il server ascolta
            producer.produce('system-advice', json.dumps(advice_packet).encode('utf-8'))
            producer.flush()

if __name__ == "__main__":
    main()
