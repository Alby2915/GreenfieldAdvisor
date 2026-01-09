import os
import json
import numpy as np
import traceback
from abc import ABC, abstractmethod
try:
    import tensorflow as tf
    from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input
    from tensorflow.keras.preprocessing import image
    from tensorflow.keras.models import load_model
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("ATTENZIONE: TensorFlow non installato.")

# BASE DI CONOSCENZA AGRONOMICA (Sincronizzata con class_indices.json)

KNOWLEDGE_BASE = {
    # POMODORO (Tomato) [Indici 33-42] 
    33: {
        "title": "Pomodoro: Maculatura Batterica (Bacterial Spot)",
        "severity": "error",
        "description": "Infezione batterica (Xanthomonas). Piccole macchie scure su foglie e frutti.",
        "actions": ["Rimuovere parti infette.", "Prodotti a base di rame.", "No irrigazione a pioggia."],
        "prevention": "Rotazione colture, semi sani."
    },
    34: {
        "title": "Pomodoro: Alternariosi (Early Blight)",
        "severity": "warning",
        "description": "Fungo Alternaria. Macchie concentriche a bersaglio su foglie vecchie.",
        "actions": ["Potare foglie basse.", "Fungicidi (azoxystrobin/mancozeb).", "Concimare (Potassio)."],
        "prevention": "Pacciamatura del terreno."
    },
    35: {
        "title": "Pomodoro: Peronospora (Late Blight)",
        "severity": "error",
        "description": "Fungo devastante (Phytophthora). Macchie scure in espansione rapida.",
        "actions": ["Distruggere piante colpite.", "Fungicidi sistemici o rame.", "Ridurre umidità."],
        "prevention": "Varietà resistenti, controllo meteo."
    },
    36: {
        "title": "Pomodoro: Muffa Fogliare (Leaf Mold)",
        "severity": "warning",
        "description": "Fungo da serra. Macchie gialle sopra, feltro grigio sotto.",
        "actions": ["Ventilare la serra.", "Rimuovere foglie basse.", "Zolfo."],
        "prevention": "Distanziamento piante."
    },
    37: {
        "title": "Pomodoro: Septoriosi (Septoria)",
        "severity": "warning",
        "description": "Piccole macchie circolari con centro grigio su foglie basse.",
        "actions": ["Via foglie infette.", "Fungicidi protettivi.", "Asciugatura foglie."],
        "prevention": "Pulizia residui."
    },
    38: {
        "title": "Pomodoro: Ragnetto Rosso (Spider Mites)",
        "severity": "warning",
        "description": "Piccoli acari, puntinature gialle e ragnatele.",
        "actions": ["Aumentare umidità.", "Sapone potassico/Olio di Neem.", "Predatori naturali."],
        "prevention": "Monitoraggio col caldo."
    },
    39: {
        "title": "Pomodoro: Maculatura a Bersaglio (Target Spot)",
        "severity": "warning",
        "description": "Simile all'Alternaria ma con centro chiaro che si fessura.",
        "actions": ["Migliorare flusso aria.", "Fungicidi specifici.", "Ridurre stress."],
        "prevention": "Pulizia residui."
    },
    40: {
        "title": "Pomodoro: Virus Arricciamento Giallo (TYLCV)",
        "severity": "error",
        "description": "Trasmesso da mosca bianca. Foglie apicali gialle e ricce.",
        "actions": ["Estirpare pianta.", "Controllare mosca bianca (reti/trappole).", "Via erbe infestanti."],
        "prevention": "Varietà resistenti."
    },
    41: {
        "title": "Pomodoro: Virus del Mosaico (Mosaic Virus)",
        "severity": "warning",
        "description": "Chiazze verde chiaro/scuro, foglie deformi.",
        "actions": ["Rimuovere pianta con cura.", "Disinfettare tutto (candeggina).", "No fumatori vicino."],
        "prevention": "Semi certificati."
    },
    42: {
        "title": "Pomodoro: Pianta Sana",
        "severity": "success",
        "description": "Ottima salute! Foglie verdi e distese.",
        "actions": ["Continua così.", "Monitoraggio regolare."],
        "prevention": "-"
    },

    # PEPERONE (Pepper) [17-18] 
    17: {
        "title": "Peperone: Maculatura Batterica",
        "severity": "error",
        "description": "Macchie batteriche su foglie e frutti.",
        "actions": ["Rame.", "Rimuovere parti colpite.", "Evitare ristagni."],
        "prevention": "Semi sani."
    },
    18: {
        "title": "Peperone: Sano",
        "severity": "success",
        "description": "Pianta di peperone in salute.",
        "actions": ["Mantenere irrigazione regolare."],
        "prevention": "-"
    },

    # PATATA (Potato) [23-25] 
    23: { "title": "Patata: Alternariosi (Early Blight)", "severity": "warning", "description": "Macchie concentriche.", "actions": ["Fungicidi.", "Rotazione."], "prevention": "-" },
    24: { "title": "Patata: Peronospora (Late Blight)", "severity": "error", "description": "Grave infezione fungina.", "actions": ["Distruggere piante.", "Rame."], "prevention": "-" },
    25: { "title": "Patata: Sana", "severity": "success", "description": "Pianta sana.", "actions": ["Ok."], "prevention": "-" },

    # CLASSI SPECIALI (Soil / Plant Condition) [19-22, 27-28] 
    19: { "title": "Pianta Morta/Secca", "severity": "error", "description": "La pianta appare secca o morta.", "actions": ["Rimuovere.", "Controllare irrigazione."], "prevention": "-" },
    20: { "title": "Pianta in Vaso (Sana)", "severity": "success", "description": "Pianta ornamentale sana.", "actions": ["Ok."], "prevention": "-" },
    21: { "title": "Pianta Succulenta", "severity": "success", "description": "Pianta grassa riconosciuta.", "actions": ["Poca acqua."], "prevention": "-" },
    22: { "title": "Pianta Appassita (Wilted)", "severity": "warning", "description": "Foglie flosce, stress idrico.", "actions": ["Controllare terreno (secco o troppo zuppo?)."], "prevention": "-" },
    27: { "title": "Terreno: ASCIUTTO", "severity": "warning", "description": "Il suolo appare disidratato.", "actions": ["IRRIGARE (se la pianta lo richiede)."], "prevention": "-" },
    28: { "title": "Terreno: UMIDO/IRRIGATO", "severity": "success", "description": "Il suolo appare bagnato.", "actions": ["NON IRRIGARE (evitare marciumi)."], "prevention": "-" },
    
    # RUMORE
    43: { "title": "Soggetto Non Riconosciuto", "severity": "info", "description": "Sfondo o rumore.", "actions": ["Riprova inquadrando meglio."], "prevention": "-" }
}

class ImageAnalysisStrategy(ABC):
    @abstractmethod
    def analyze(self, image_path):
        pass

class DeepLearningVisionStrategy(ImageAnalysisStrategy):
    """Gestisce il caricamento del modello .h5 e la predizione numerica"""
    def __init__(self, model_path="greenfield_agri_brain.h5", json_path="class_indices.json"):
        if not TF_AVAILABLE: raise ImportError("TensorFlow mancante.")
        
        self.is_custom_ready = False
        self.model = None
        self.labels_map = {} # Indice -> Nome Classe (dal JSON)
        
        if os.path.exists(model_path) and os.path.exists(json_path):
            print(f"Caricamento Modello Agricolo: {model_path}...")
            try:
                self.model = load_model(model_path)
                
        
                with open(json_path, 'r') as f:
                    class_indices = json.load(f)
                self.labels_map = {v: k for k, v in class_indices.items()}
                
                self.is_custom_ready = True
                print("Sistema Visione: PRONTO (Modalità Diretta 44 Classi).")
            except Exception as e:
                print(f"ERRORE caricamento modello: {e}")
                traceback.print_exc()
        else:
            print(f"ERRORE CRITICO: File '{model_path}' o '{json_path}' non trovato.")

    def analyze(self, image_path):
        try:
            if not self.is_custom_ready or self.model is None:
                return -1, 0.0

            # 1. Caricamento e Preprocessing Immagine (Standard MobileNetV2/ResNet)
            img = image.load_img(image_path, target_size=(224, 224))
            x = image.img_to_array(img)
            x = np.expand_dims(x, axis=0)
            x = x / 255.0  # Normalizzazione

            # 2. Predizione
            preds = self.model.predict(x, verbose=0)
            
            top_idx = np.argmax(preds[0])
            confidence = float(preds[0][top_idx])
            
            return top_idx, confidence

        except Exception as e:
            traceback.print_exc()
            return -1, 0.0

class GreenFieldImageAdvisor:
    """Usa la strategia di visione e la Knowledge Base per dare consigli"""
    def __init__(self, vision_strategy: DeepLearningVisionStrategy):
        self.vision_strategy = vision_strategy

    def consult(self, image_path):
        print(f"  [Vision] Analisi file: {image_path} ...")
        
        idx, conf = self.vision_strategy.analyze(image_path)
        
        # 1. Cerca nella Knowledge Base Dettagliata (Priorità)
        if idx == 43:
            return KNOWLEDGE_BASE[43]["title"], KNOWLEDGE_BASE[43]

        # 2. Se la confidenza è TROPPO BASSA (< 35%) -> Riscatta foto
        if conf < 0.35:
            low_conf_advice = {
                "title": "Analisi Incerta (Bassa Confidenza)",
                "severity": "info", 
                "description": f"L'IA non è sicura (Confidenza: {conf*100:.0f}%). L'immagine potrebbe essere sfocata, buia o troppo lontana.",
                "actions": [
                    "Avvicinati alla foglia/frutto.",
                    "Assicurati che ci sia buona luce.",
                    "Metti a fuoco il soggetto e riscatta la foto."
                ],
                "prevention": "-"
            }
            # Aggiungiamo score reale
            low_conf_advice["confidence_score"] = conf
            return low_conf_advice["title"], low_conf_advice

        # 3. Lookup Standard nel Dizionario
        if idx in KNOWLEDGE_BASE:
            diagnosis_info = KNOWLEDGE_BASE[idx].copy()
        else:
            
            raw_label = self.vision_strategy.labels_map.get(idx, "Sconosciuto")
            clean_name = raw_label.replace("___", " - ").replace("_", " ")
            diagnosis_info = {
                "title": clean_name,
                "severity": "warning",
                "description": f"Rilevato: {clean_name}. (Scheda dettagliata non disponibile)",
                "actions": ["Consultare un agronomo."],
                "prevention": "-"
            }

        diagnosis_info["confidence_score"] = conf
        return diagnosis_info["title"], diagnosis_info
        
        return diagnosis_info["title"], diagnosis_info
