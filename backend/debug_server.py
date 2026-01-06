import asyncio
from aiosmtpd.controller import Controller

class DebugHandler:
    async def handle_DATA(self, server, session, envelope):
        print("\n" + "="*60)
        print("📨 NUOVA EMAIL RICEVUTA DAL SISTEMA")
        print(f"DA: {envelope.mail_from}")
        print(f"A: {envelope.rcpt_tos}")
        print("-" * 60)
        
        # Stampa il contenuto dell'email
        text = envelope.content.decode('utf8', errors='replace')
        print(text)
        
        print("="*60 + "\n")
        return '250 Message accepted for delivery'

if __name__ == '__main__':
    # Avvia il server sulla porta 1025
    controller = Controller(DebugHandler(), hostname='localhost', port=1025)
    controller.start()
    
    print("📮 POSTINO VIRTUALE ATTIVO (Python 3.13 Compatible)")
    print("   In ascolto su localhost:1025...")
    print("   Lascia questa finestra aperta per vedere le email.")
    
    try:
        asyncio.get_event_loop().run_forever()
    except KeyboardInterrupt:
        print("Stopping")