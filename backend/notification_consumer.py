import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from collections import deque
from kafka import KafkaConsumer
from datetime import datetime

# CONFIGURAZIONE EMAIL LOCALE
SMTP_SERVER = "localhost"
SMTP_PORT = 1025
SENDER_EMAIL = "system@greenfield.ai"

# Configurazione Kafka
BROKER = "localhost:9092"
TOPIC = "system-advice"

HISTORY_LEN = 15 
data_buffer = deque(maxlen=HISTORY_LEN)

def to_on_off(status):
    """Converte stati complessi in ON/OFF per il report"""
    if status in ['ON', 'ACTIVE', 'LOW']: return 'ON'
    return 'OFF'

def format_history_table(buffer):
    """
    Crea la tabella con TUTTE le colonne:
    TIME | IRR | NRG | N | P | K
    """
    header = f"{'TIME':<10} | {'IRR':<5} | {'NRG':<5} | {'N':<5} | {'P':<5} | {'K':<5}"
    rows = [header, "-" * 55]
    
    for item in buffer:
        ts_str = datetime.fromtimestamp(item.get('ts', 0)).strftime('%H:%M:%S')
        
        # Dati RAW
        rules = item.get('rules', {})
        fert = rules.get('fertilization', {})

        # Conversione stati
        v_irr = to_on_off(rules.get('irrigation', {}).get('status', 'OFF'))
        v_nrg = to_on_off(rules.get('energy', {}).get('status', 'OFF'))
        v_n = to_on_off(fert.get('N', 'OK'))
        v_p = to_on_off(fert.get('P', 'OK'))
        v_k = to_on_off(fert.get('K', 'OK'))
        
        rows.append(f"{ts_str:<10} | {v_irr:<5} | {v_nrg:<5} | {v_n:<5} | {v_p:<5} | {v_k:<5}")
        
    return "\n".join(rows)

def send_local_email(recipient, reasons_list, buffer):
    try:
        # Uniamo i motivi unici (es. "IRRIGAZIONE, FERTILIZZAZIONE")
        unique_reasons = list(set(reasons_list))
        subject_str = " + ".join(unique_reasons)
        
        print(f"\n📨 CREAZIONE REPORT CUMULATIVO ({subject_str}) per {recipient}...")
        
        table_text = format_history_table(buffer)
        
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = recipient
        msg['Subject'] = f"🚨 ALERT MULTIPLO: {subject_str}"

        body = f"""
        *** REPORT COMPLETO ATTUATORI ***
        ---------------------------------
        DESTINATARIO: {recipient}
        ALLARMI RILEVATI NELLA FINESTRA TEMPORALE:
        {', '.join(unique_reasons)}
        
        LEGENDA:
        ON  = Attuatore Attivo / Valvola Aperta / Carenza
        OFF = Parametri OK
        
        DETTAGLIO DATI (Ultimi 15 cicli):
        {table_text}
        """
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.sendmail(SENDER_EMAIL, recipient, msg.as_string())
        server.quit()
        
        print("✅ EMAIL INVIATA CORRETTAMENTE.")
        
    except ConnectionRefusedError:
        print("❌ ERRORE: Server email locale spento (lancia debug_server.py).")
    except Exception as e:
        print(f"❌ Errore generico: {e}")

def main():
    consumer = KafkaConsumer(
        TOPIC,
        bootstrap_servers=BROKER,
        auto_offset_reset="latest",
        enable_auto_commit=True,
        group_id="notification-multi-v4",
        value_deserializer=lambda v: json.loads(v.decode("utf-8")),
    )

    print(f"📡 NOTIFICATION CONSUMER (Logic: Simultaneous Triggers)")
    print(f"   In attesa di dati...")

    # Memoria stati precedenti
    last_status = {
        'irrigation': 'OFF', 'energy': 'OFF', 
        'N': 'OK', 'P': 'OK', 'K': 'OK'
    }
    
    monitoring_active = False
    monitoring_countdown = 0
    active_reasons = [] # Lista accumulativa dei motivi

    for msg in consumer:
        payload = msg.value
        data_buffer.append(payload)
        
        rules = payload.get('rules', {})
        config = payload.get('config', {})
        recipient_email = config.get('email', 'admin@local')

        # 1. Estrazione stati ATTUALI
        curr_irr = rules.get('irrigation', {}).get('status', 'OFF')
        curr_nrg = rules.get('energy', {}).get('status', 'OFF')
        fert = rules.get('fertilization', {})
        curr_n = fert.get('N', 'OK')
        curr_p = fert.get('P', 'OK')
        curr_k = fert.get('K', 'OK')

        # 2. Rilevamento TRIGGER (Fronti di Salita)
        new_triggers = []
        
        # Check Irrigazione (OFF -> ON)
        if curr_irr == 'ON' and last_status['irrigation'] == 'OFF':
            new_triggers.append("IRRIGAZIONE")

        # Check Energia (OFF -> ACTIVE)
        if curr_nrg == 'ACTIVE' and last_status['energy'] == 'OFF':
            new_triggers.append("ENERGIA")

        # Check Fertilizzanti (OK -> LOW)
        if (curr_n == 'LOW' and last_status['N'] == 'OK') or \
           (curr_p == 'LOW' and last_status['P'] == 'OK') or \
           (curr_k == 'LOW' and last_status['K'] == 'OK'):
            new_triggers.append("FERTILIZZAZIONE")

        # 3. Gestione Macchina a Stati (Senza Reset indesiderati)
        if new_triggers:
            if not monitoring_active:
                # NUOVO ALLARME: Inizia conteggio
                print(f"\n🚨 NUOVO EVENTO RILEVATO: {new_triggers}")
                monitoring_active = True
                monitoring_countdown = 10
                active_reasons = new_triggers # Inizializza lista motivi
            else:
                # GIA' IN MONITORAGGIO: Aggiungi motivo MA NON RESETTARE IL CONTEGGIO
                print(f"➕ EVENTO SOVRAPPOSTO: {new_triggers} (Aggiunto al report corrente)")
                active_reasons.extend(new_triggers)

        # 4. Avanzamento Monitoraggio
        if monitoring_active:
            print(f"   ⏳ Registrazione combinata... {monitoring_countdown}/10")
            monitoring_countdown -= 1
            
            if monitoring_countdown <= 0:
                # FINE: Invia email con TUTTI i motivi accumulati
                send_local_email(recipient_email, active_reasons, data_buffer)
                
                # Reset completo
                monitoring_active = False
                active_reasons = []
                print("✅ Ciclo concluso. Torno in ascolto.")

        # 5. Aggiornamento memorie per il prossimo ciclo
        last_status['irrigation'] = curr_irr
        last_status['energy'] = curr_nrg
        last_status['N'] = curr_n
        last_status['P'] = curr_p
        last_status['K'] = curr_k

if __name__ == "__main__":
    main()