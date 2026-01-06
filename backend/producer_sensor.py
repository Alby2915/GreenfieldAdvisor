import json
import time
import pandas as pd
from kafka import KafkaProducer
from data_loader import load_dataset_robust 

TOPIC = "sensor-data"
BOOTSTRAP_SERVERS = "localhost:9092"

def build_producer():
    return KafkaProducer(
        bootstrap_servers=BOOTSTRAP_SERVERS,
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        key_serializer=lambda k: k.encode("utf-8") if k else None
    )

def main():
    try:
        df = load_dataset_robust("dataset/data_test.csv")
    except Exception as e:
        print(f"Errore caricamento dati: {e}")
        return

    producer = build_producer()
    print(f"Producer connected. Streaming {len(df)} rows to topic '{TOPIC}'...")

    for idx, row in df.iterrows():
        event = row.to_dict()

        # Metadati
        event["_event_type"] = "sensor_reading"
        event["_row_id"] = int(idx)
        event["_ts"] = time.time()

        producer.send(TOPIC, key="sensor", value=event)
        print(f"[Producer] sent row={idx}")
        time.sleep(5) 

    producer.flush()
    producer.close()
    print("Streaming completato.")

if __name__ == "__main__":
    main()