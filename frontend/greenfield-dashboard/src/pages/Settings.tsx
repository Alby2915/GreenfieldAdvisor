import { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Card, CardContent, Grid, TextField, Button, 
  Slider, Divider, Alert, Stack, Tab, Tabs, CircularProgress 
} from '@mui/material';

import PersonIcon from '@mui/icons-material/Person';
import TuneIcon from '@mui/icons-material/Tune';
import SaveIcon from '@mui/icons-material/Save';
import LockIcon from '@mui/icons-material/Lock';

import { useAuth } from '../context/AuthContext'; 

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Settings() {
  const { user, token } = useAuth(); 
  
  const [tabValue, setTabValue] = useState(0);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // 1. STATI SOGLIE 
  const [moistureThreshold, setMoistureThreshold] = useState<number>(40);
  const [tempRange, setTempRange] = useState<number[]>([18, 28]);
  const [nThreshold, setNThreshold] = useState<number>(50);
  const [pThreshold, setPThreshold] = useState<number>(30);
  const [kThreshold, setKThreshold] = useState<number>(100);

  // 2. STATI PROFILO
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);


  const sendToPython = async () => {
    const payload = {
        moisture_threshold: moistureThreshold,
        temp_min: tempRange[0],
        temp_max: tempRange[1],
        n_threshold: nThreshold,
        p_threshold: pThreshold,
        k_threshold: kThreshold,
        email: email 
    };
    
    const res = await fetch('http://localhost:8080/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) throw new Error("Errore comunicazione con IoT Engine (Python)");
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    const updates = [];

    try {

      // CASO A: SIAMO NEL TAB SOGLIE (Tab 0) -> PARLA SOLO CON PYTHON

      if (tabValue === 0) {
        await sendToPython();
        updates.push("Parametri IoT aggiornati con successo");
      }

      // CASO B: SIAMO NEL TAB PROFILO (Tab 1) -> PARLA SOLO CON NODE

      else if (tabValue === 1) {
        // 1. Aggiorna dati anagrafici (Node)
        const resProfile = await fetch('http://localhost:3000/auth/update-profile', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token || localStorage.getItem('token')}` 
            },
            body: JSON.stringify({ name, email }),
        });
        
        if (!resProfile.ok) throw new Error("Errore aggiornamento profilo");
        updates.push("Profilo utente salvato");

        // 2. Cambio Password (Opzionale)
        if (newPassword) {
            if (!oldPassword) throw new Error("Inserisci la vecchia password per confermare.");
            
            const resPwd = await fetch('http://localhost:3000/auth/change-password', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token || localStorage.getItem('token')}`
                },
                body: JSON.stringify({ oldPassword, newPassword }),
            });
            
            const dataPwd = await resPwd.json();
            if (!resPwd.ok) throw new Error(dataPwd.error || "Errore cambio password");
            
            updates.push("Password modificata");
            setOldPassword('');
            setNewPassword('');
        }
      }

      setMsg({ type: 'success', text: `Operazione completata: ${updates.join(', ')}` });

    } catch (error: any) {
      console.error("Errore salvataggio:", error);
      setMsg({ type: 'error', text: error.message || "Errore durante il salvataggio." });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 5000);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Impostazioni & Profilo ⚙️
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestisci le soglie agronomiche del sistema AI e i dettagli del tuo account.
        </Typography>
      </Box>

      {msg && (
        <Alert severity={msg.type} sx={{ mb: 3 }}>
          {msg.text}
        </Alert>
      )}

      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f5f5f5' }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} centered>
            <Tab icon={<TuneIcon />} label="Soglie Agronomiche" />
            <Tab icon={<PersonIcon />} label="Profilo Utente" />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 4 }}>
          
          {/* TAB 1: SOGLIE */}
          <CustomTabPanel value={tabValue} index={0}>
            <Typography variant="h6" gutterBottom fontWeight="bold">Calibrazione Parametri (IoT Engine)</Typography>
            <Typography paragraph color="text.secondary">
              Definisci i valori limite che attivano gli avvisi automatici.<br/>
              <b>Nota:</b> L'indirizzo per le notifiche sarà: <b>{email || '...'}</b>
            </Typography>

            <Grid container spacing={4} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography gutterBottom>Soglia Irrigazione (Umidità %)</Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="body2">0%</Typography>
                  <Slider value={moistureThreshold} onChange={(_, v) => setMoistureThreshold(v as number)} valueLabelDisplay="auto" sx={{ color: '#2e7d32' }} />
                  <Typography variant="body2">100%</Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">Attuale: Irrigare sotto il <b>{moistureThreshold}%</b></Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography gutterBottom>Range Temperatura Ottimale (°C)</Typography>
                <Slider value={tempRange} onChange={(_, v) => setTempRange(v as number[])} valueLabelDisplay="auto" min={0} max={50} sx={{ color: '#ff9800' }} />
                <Typography variant="caption" color="text.secondary">Attuale: Allarme se &lt; <b>{tempRange[0]}°C</b> o &gt; <b>{tempRange[1]}°C</b></Typography>
              </Grid>

              <Grid size={{ xs: 12 }}><Divider /></Grid>
              
              <Grid size={{ xs: 12 }}>
                <Typography gutterBottom fontWeight="bold">Soglie Nutrienti (mg/kg)</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mt: 2 }}>
                  <TextField label="Azoto (N)" type="number" value={nThreshold} onChange={(e) => setNThreshold(Number(e.target.value))} size="small" fullWidth />
                  <TextField label="Fosforo (P)" type="number" value={pThreshold} onChange={(e) => setPThreshold(Number(e.target.value))} size="small" fullWidth />
                  <TextField label="Potassio (K)" type="number" value={kThreshold} onChange={(e) => setKThreshold(Number(e.target.value))} size="small" fullWidth />
                </Stack>
              </Grid>
            </Grid>
          </CustomTabPanel>

          {/* TAB 2: PROFILO */}
          <CustomTabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom fontWeight="bold">I Tuoi Dati</Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Nome Completo" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
              </Grid>
              
              <Grid size={{ xs: 12 }}><Divider sx={{ my: 2 }} /></Grid>
              
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LockIcon fontSize="small" /> Cambio Password
                </Typography>
                <Typography variant="caption" color="text.secondary">Compila solo se vuoi modificare la password.</Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Vecchia Password" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Nuova Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} fullWidth />
              </Grid>
            </Grid>
          </CustomTabPanel>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="contained" 
              size="large" 
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
              sx={{ px: 4, borderRadius: 2 }}
            >
              {saving ? "Salvataggio..." : "Salva Modifiche"}
            </Button>
          </Box>

        </CardContent>
      </Card>
    </Container>
  );
}