import json
import threading
import time
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from confluent_kafka import Consumer, Producer
from werkzeug.utils import secure_filename
from strategies_vision import DeepLearningVisionStrategy, GreenFieldImageAdvisor

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret_greenfield'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Configurazione Upload
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Kafka Producer (Per inviare i settings all'Analyzer)
producer = Producer({'bootstrap.servers': 'localhost:9092'})

# Vision AI Init (Caricata solo se presente)
vision_advisor = None
try:
    if os.path.exists("greenfield_agri_brain.h5"):
        vision_strat = DeepLearningVisionStrategy("greenfield_agri_brain.h5", "class_indices.json")
        vision_advisor = GreenFieldImageAdvisor(vision_strat)
        print("✅ VISION: Modello caricato nel Gateway.")
except Exception as e:
    print(f"⚠️ Vision non attiva: {e}")

# GATEWAY LOOP: Ascolta Risultati e Sensori -> Invia al Frontend
def gateway_listener():
    # Gruppo diverso dall'analyzer così entrambi ricevono i messaggi
    conf = {
        'bootstrap.servers': 'localhost:9092', 
        'group.id': 'gateway-frontend-v1', 
        'auto.offset.reset': 'latest'
    }
    consumer = Consumer(conf)
    
    # Ascoltiamo:
    # 1. sensor-data: per aggiornare i grafici raw in tempo reale
    # 2. system-advice: per ricevere le decisioni elaborate dall'Analyzer
    consumer.subscribe(['sensor-data', 'system-advice'])
    print("🟢 GATEWAY: In ascolto su Kafka (Bridge verso WebSocket)...")

    while True:
        msg = consumer.poll(0.1)
        if msg is None or msg.error(): continue

        topic = msg.topic()
        payload = json.loads(msg.value().decode('utf-8'))

        if topic == 'sensor-data':
            # Inoltra il dato grezzo al frontend per i grafici
            socketio.emit('sensor', payload)
        
        elif topic == 'system-advice':
            # Inoltra il consiglio elaborato (Regole + AI) al frontend
            socketio.emit('ai_advice', payload)

# Avvia il listener in background
threading.Thread(target=gateway_listener, daemon=True).start()

# API ENDPOINTS

@app.route('/api/settings', methods=['POST'])
def update_settings():
    try:
        data = request.json
        print(f"🔄 UTENTE CAMBIA SETTINGS: {data}")
        
        producer.produce('system-settings', json.dumps(data).encode('utf-8'))
        producer.flush()
        
        return jsonify({"status": "sent_to_queue"}), 200
    except Exception as e:
        print(f"❌ Errore API Settings: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/upload-image', methods=['POST'])
def upload_image():
    if not vision_advisor: return jsonify({"error": "Vision Service Unavailable"}), 503
    if 'image' not in request.files: return jsonify({"error": "No file"}), 400
    
    file = request.files['image']
    if file.filename == '': return jsonify({"error": "Empty filename"}), 400
    
    try:
        filename = secure_filename(file.filename)
        path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(path)
        
        cat, adv = vision_advisor.consult(path)
        os.remove(path) 
        return jsonify({"category": cat, "advice": adv})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 GATEWAY SERVER AVVIATO (Porta 8080)")
    socketio.run(app, host='0.0.0.0', port=8080, allow_unsafe_werkzeug=True)