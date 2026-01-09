import os
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, confusion_matrix
from data_loader import load_dataset_robust
from strategies_model import LogisticRegressionStrategy, RuleBasedStrategy
from strategies_vision import DeepLearningVisionStrategy, GreenFieldImageAdvisor
from pipeline import DataCleaner, FeatureEngineer, ModelEstimator
from observers import SensorDataSource, AdvisorObserver

# 1. FUNZIONE: ANALISI DATI TABELLARI (IoT / Sensori)
def run_tabular_analysis():
    print("\n" + "="*60)
    print("      📊 GREENFIELD AI - ANALISI SENSORI (TABELLARE) 📊")
    print("="*60)

    try:
        print("--- Caricamento Dataset ---")
        df_train_source = load_dataset_robust("dataset/enriched_tomato_irrigation_dataset.csv")
        df_external_test = load_dataset_robust("dataset/data_test.csv")
    except Exception as e:
        print(f"⚠️ ERRORE TABELLARE: {e}")
        print("Saltando la sezione tabellare (controlla i file CSV).")
        return

    # Pipeline preliminare per preparare i dati
    prep_pipeline = DataCleaner(FeatureEngineer())
    df_main_ready = prep_pipeline.handle(df_train_source)
    df_test_structure = prep_pipeline.handle(df_external_test.head())

    # Selezione Feature comuni
    features = [c for c in df_main_ready.columns if c in df_test_structure.columns 
                and c not in ['Irrigation', 'Fertilization', 'Energy', 'Crop_stage', 'Precipitation_mm']]

    print(f"Feature utilizzate: {features}")
    targets = ['Irrigation', 'Fertilization', 'Energy']

    for target in targets:
        print(f"\n{'-'*20} TARGET: {target} {'-'*20}")
        
        X_train_data = df_main_ready[features]
        y_train_data = df_main_ready[target]
        
        # Split Training/Test interno
        X_train, X_test_int, y_train, y_test_int = train_test_split(
            X_train_data, y_train_data, test_size=0.2, random_state=42, stratify=y_train_data
        )
        
        # Strategia principale: Logistic Regression
        strategy = LogisticRegressionStrategy(max_iter=2000)
        
        print(f">>> Addestramento Modello ML ({target})...")
        strategy.train(X_train, y_train)
        
        # Pipeline Completa
        full_pipeline = DataCleaner(
                            FeatureEngineer(
                                ModelEstimator(strategy, features, target)
                            )
                        )
        result_df = full_pipeline.handle(df_external_test)

        # DEMO OBSERVER (Solo per Irrigation)
        if target == 'Irrigation':
            print("\n--- 📡 OBSERVER PATTERN: Simulazione Sensori Real-Time ---")
            sensor = SensorDataSource()
            advisor = AdvisorObserver(full_pipeline, target_name=target)
            sensor.attach(advisor)
            sensor.stream(df_external_test, limit=3) # Simula 3 letture

        # Valutazione
        y_true_ext = result_df[target]
        y_pred_ext = result_df[f"{target}_Predicted"]
        acc_ext = accuracy_score(y_true_ext, y_pred_ext)
        
        print(f"\n-> Accuracy Test Esterno: {acc_ext:.2%}")


# 2. FUNZIONE: ANALISI VISIVA (Immagini / Visione)
def run_vision_test():
    print("\n" + "="*60)
    print("      🌱 GREENFIELD AI - VISIONE ARTIFICIALE (IMMAGINI) 🌱")
    print("="*60)

    # Configurazione File
    model_file = "greenfield_agri_brain.h5"
    json_file = "class_indices.json"
    
    test_dir = "testvisivo" 

    # 1. Controllo esistenza modello
    if not os.path.exists(model_file) or not os.path.exists(json_file):
        print(f"⚠️ ATTENZIONE: Modello '{model_file}' non trovato.")
        print("   Esegui prima 'train_agri_model.py' per creare il cervello dell'IA!")
        return
    
    # Controllo esistenza cartella immagini
    if not os.path.exists(test_dir):
        print(f"⚠️ ERRORE: La cartella '{test_dir}' non esiste.")
        print("   Crea la cartella e inserisci dentro le immagini da testare.")
        return

    print("Caricamento Rete Neurale Agricola...")
    try:
        # Istanza della strategia di visione
        vision_strat = DeepLearningVisionStrategy(model_path=model_file, json_path=json_file)
        # Istanza dell'Advisor
        advisor = GreenFieldImageAdvisor(vision_strat)
        print("Sistema Visivo: ONLINE.\n")
    except Exception as e:
        print(f"Errore inizializzazione visione: {e}")
        return

    # 2. Lista File 
    test_filenames = [
        "test1.jpg", "test2.jpg", "test3.jpg", "test4.jpg", 
        "test5.jpg", "test6.jpg", "test7.jpg", "test8.jpg", "test9.jpg"
    ]

    # 3. Ciclo di Analisi
    files_found = 0
    print(f"Analisi immagini nella cartella: '{test_dir}/' ...")
    
    for filename in test_filenames:
        img_path = os.path.join(test_dir, filename)
        
        if os.path.exists(img_path):
            files_found += 1
            print("-" * 60)
            
            # CONSULTAZIONE DELL'ADVISOR
            categoria, consiglio = advisor.consult(img_path)
            
            # OUTPUT PER L'UTENTE
            print(f"FILE:      {filename}") 
            print(f"CATEGORIA: {categoria}")
            print(f"CONSIGLIO:\n    {consiglio}")
        else:
            pass
    
    if files_found == 0:
        print(f"\nNessuna delle immagini specificate trovata in '{test_dir}'.")

if __name__ == "__main__":
    run_tabular_analysis()

    run_vision_test()
    
    print("\n" + "="*60)
    print("✅ ESECUZIONE GREENFIELD AI COMPLETATA")
    print("="*60)
