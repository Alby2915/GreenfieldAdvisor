import { 
  Box, Container, Typography, Grid, Card, CardContent, Chip, List, ListItem, ListItemIcon, ListItemText, Stack, Paper, Divider
} from '@mui/material';

import FunctionsIcon from '@mui/icons-material/Functions';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DataObjectIcon from '@mui/icons-material/DataObject';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import LayersIcon from '@mui/icons-material/Layers';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SpeedIcon from '@mui/icons-material/Speed';

export default function Models() {
  return (
    <Container maxWidth="xl" sx={{ pb: 4 }}>
      
      {/* HEADER */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" fontWeight="bold" sx={{ color: '#1565c0', mb: 2 }}>
          Architettura AI 🧠
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto', lineHeight: 1.6 }}>
          GreenField adotta un approccio <b>Ibrido (Dual Brain)</b> per massimizzare l'efficienza:
          <br/>
          modelli statistici leggeri per l'IoT Real-Time e reti neurali profonde per la diagnostica visiva.
        </Typography>
      </Box>

      <Grid container spacing={4} alignItems="stretch">

        {/* COLONNA 1: LOGISTIC REGRESSION (Decision Engine) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%', borderRadius: 4, boxShadow: 4, display: 'flex', flexDirection: 'column' }}>
            
            {/* Header Card Blu */}
            <Box sx={{ bgcolor: '#e3f2fd', p: 4, borderBottom: '1px solid #bbdefb', textAlign: 'center' }}>
              <FunctionsIcon sx={{ fontSize: 60, color: '#1565c0', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="#0d47a1">
                Logistic Regression
              </Typography>
              <Chip label="Decision Engine (IoT)" color="primary" sx={{ mt: 1, fontWeight: 'bold' }} />
            </Box>
            
            <CardContent sx={{ p: 4, flexGrow: 1 }}>
              
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
                  <SpeedIcon sx={{ mr: 1, color: 'text.secondary' }} /> Funzionamento
                </Typography>
                <Typography paragraph color="text.secondary">
                    La Regressione Logistica è un modello statistico utilizzato per la <b>classificazione binaria</b>. 
                    Nel nostro caso, il modello riceve in input i dati dei sensori in tempo reale e calcola la 
                    probabilità che la pianta abbia bisogno di acqua o fertilizzante.
                </Typography>
                
                {/* FORMULE MATEMATICHE AGGIORNATE */}
<Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa', fontFamily: 'monospace', borderLeft: '4px solid #1565c0', fontSize: '0.75rem', overflowX: 'auto' }}>
                  <Box sx={{ mb: 1, whiteSpace: 'nowrap' }}>
                    {/* Beta weights per Soil Moisture e Temp */}
                    P(Irrigate) &nbsp;&nbsp;= σ(β₀ + β₁·Soil% + β₂·Temp)
                  </Box>
                  <Box sx={{ mb: 1, whiteSpace: 'nowrap' }}>
                    {/* Alpha weights per N, P, K */}
                    P(Fertilize) = σ(α₀ + α₁·N + α₂·P + α₃·K)
                  </Box>
                  <Box sx={{ whiteSpace: 'nowrap' }}>
                    {/* Gamma weights per Temp (HVAC activation) */}
                    P(Energy) &nbsp;&nbsp;&nbsp;&nbsp;= σ(γ₀ + γ₁·Temp + γ₂·Hum%)
                  </Box>
                </Paper>
                
                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary', fontStyle: 'italic' }}>
                  Dove σ(z) = 1 / (1 + e^-z) è la funzione sigmoide.
                </Typography>

                <Typography variant="body2" sx={{ mt: 2 }}>
                    Il modello apprende i pesi (β, α, γ) dai dati storici per determinare l'importanza di ogni sensore nella decisione finale.
                </Typography>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Sezione: Input Features */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ textTransform: 'uppercase', color: 'gray' }}>
                  Input Features (Variabili)
                </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
                    <Chip icon={<DataObjectIcon />} label="Soil Moisture (%)" color="primary" variant="outlined" />
                    <Chip icon={<DataObjectIcon />} label="Temperature (°C)" color="primary" variant="outlined" />
                    <Chip icon={<DataObjectIcon />} label="Humidity (%)" color="primary" variant="outlined" />
                    <Chip icon={<DataObjectIcon />} label="Nitrogen (N)" color="secondary" variant="outlined" />
                    <Chip icon={<DataObjectIcon />} label="Phosphorus (P)" color="secondary" variant="outlined" />
                    <Chip icon={<DataObjectIcon />} label="Potassium (K)" color="secondary" variant="outlined" />
                  </Stack>
              </Box>

              {/* Sezione: Performance */}
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ textTransform: 'uppercase', color: 'gray' }}>
                  Metriche Performance
                </Typography>
                <List dense disablePadding>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 36 }}><AutoGraphIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Accuracy: 94.2%" secondary="Su Test Set Sintetico" />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 36 }}><SpeedIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Latenza: < 10ms" secondary="Critical Real-Time Response" />
                  </ListItem>
                </List>
              </Box>

            </CardContent>
          </Card>
        </Grid>

        {/* COLONNA 2: CNN - MOBILENETV2 (Vision Engine) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%', borderRadius: 4, boxShadow: 4, display: 'flex', flexDirection: 'column' }}>
            
            {/* Header Card Verde */}
            <Box sx={{ bgcolor: '#e8f5e9', p: 4, borderBottom: '1px solid #c8e6c9', textAlign: 'center' }}>
              <VisibilityIcon sx={{ fontSize: 60, color: '#2e7d32', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="#1b5e20">
                Convolutional Neural Network
              </Typography>
              <Chip label="Vision Engine (Deep Learning)" color="success" sx={{ mt: 1, fontWeight: 'bold' }} />
            </Box>

            <CardContent sx={{ p: 4, flexGrow: 1 }}>
              
              {/* Sezione: Architettura */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
                  <LayersIcon sx={{ mr: 1, color: 'text.secondary' }} /> Architettura
                </Typography>
                <Typography paragraph color="text.secondary">
                    Utilizziamo una <b>CNN (Convolutional Neural Network)</b> basata sull'architettura <b>MobileNetV2</b>. 
                    Questa rete è ottimizzata per dispositivi mobili ed edge computing, garantendo alta precisione con un basso costo computazionale.
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#555' }}>
                  Abbiamo applicato la tecnica del <b>Transfer Learning</b>: la rete è stata pre-addestrata su milioni di immagini (ImageNet) e poi "raffinata" (Fine-Tuning) sul dataset specifico <b>PlantVillage</b> per riconoscere le patologie del pomodoro e di altre varietà di piante.
                </Typography>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Sezione: Struttura Pipeline */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ textTransform: 'uppercase', color: 'gray' }}>
                  Struttura Modello (.h5)
                </Typography>
                <List sx={{ bgcolor: '#f1f8e9', borderRadius: 2, py: 0 }}>
                    <ListItem divider>
                      <ListItemIcon><LayersIcon /></ListItemIcon>
                      <ListItemText primary="Input Layer" secondary="Image Tensor (224, 224, 3)" />
                    </ListItem>
                    <ListItem divider>
                      <ListItemIcon><LayersIcon /></ListItemIcon>
                      <ListItemText primary="Feature Extractor" secondary="MobileNetV2 (Frozen Weights)" />
                    </ListItem>
                    <ListItem divider>
                      <ListItemIcon><LayersIcon /></ListItemIcon>
                      <ListItemText primary="Global Avg Pooling" secondary="Riduzione dimensionalità" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><LayersIcon color="secondary" /></ListItemIcon>
                      <ListItemText primary="Dense Output (Softmax)" secondary="44 Classi (Probabilità)" />
                    </ListItem>
                  </List>
              </Box>

              {/* Sezione: Performance */}
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ textTransform: 'uppercase', color: 'gray' }}>
                  Metriche
                </Typography>
                <List dense disablePadding>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 36 }}><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Training Accuracy: 96.5%" secondary="Dataset PlantVillage" />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 36 }}><LayersIcon color="warning" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Model Size: ~14 MB" secondary="Lightweight Deployment" />
                  </ListItem>
                </List>
              </Box>

            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Container>
  );
}