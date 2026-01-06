import { useNavigate } from 'react-router-dom';
import { 
  Box, Button, Container, Grid, Typography, Card, CardContent, Stack 
} from '@mui/material';

import PsychologyIcon from '@mui/icons-material/Psychology'; 
import PhotoCameraBackIcon from '@mui/icons-material/PhotoCameraBack';
import SpeedIcon from '@mui/icons-material/Speed';
import HubIcon from '@mui/icons-material/Hub';

export default function Home() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
      
      <Box 
        sx={{ 
          bgcolor: '#1b5e20', 
          color: 'white',
          py: 12,
          px: 2,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #1b5e20 30%, #2e7d32 90%)',
          borderRadius: '0 0 50px 50px',
          boxShadow: 6
        }}
      >
        <Container maxWidth="md">
          <Typography variant="overline" letterSpacing={2} sx={{ opacity: 0.8 }}>
            AGRICOLTURA 4.0 & INTELLIGENZA ARTIFICIALE
          </Typography>
          
          <Typography variant="h2" fontWeight="800" sx={{ my: 2 }}>
            GreenField Advisor 🍅
          </Typography>
          
          <Typography variant="h5" sx={{ opacity: 0.9, mb: 5, fontWeight: 300 }}>
            Il sistema intelligente per il monitoraggio delle colture di pomodoro.
            Dall'IoT alla Computer Vision, prendi decisioni basate sui dati.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button 
              variant="contained" 
              size="large" 
              color="warning"
              startIcon={<SpeedIcon />}
              onClick={() => navigate('/dashboard')}
              sx={{ px: 4, py: 1.5, borderRadius: 5, fontSize: '1.1rem', fontWeight: 'bold' }}
            >
              Vai alla Dashboard
            </Button>
            <Button 
              variant="outlined" 
              size="large" 
              color="inherit"
              startIcon={<PhotoCameraBackIcon />}
              onClick={() => navigate('/vision')}
              sx={{ px: 4, py: 1.5, borderRadius: 5, fontSize: '1.1rem', borderColor: 'rgba(255,255,255,0.5)' }}
            >
              Vision AI
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* FEATURES SECTION */}
      <Container maxWidth="lg" sx={{ mt: -6, mb: 8 }}>
        <Grid container spacing={3}>
          
          {/* Card 1: IoT & Kafka */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%', borderRadius: 4, boxShadow: 4 }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Box sx={{ color: '#0288d1', mb: 2 }}>
                  <HubIcon sx={{ fontSize: 60 }} />
                </Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Event-Driven IoT
                </Typography>
                <Typography color="text.secondary">
                  Un'architettura a microservizi basata su <b>Apache Kafka</b>. 
                  Ingestione dati in tempo reale dai sensori con pipeline di processamento scalabile.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 2: Dual Brain AI */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%', borderRadius: 4, boxShadow: 4, bgcolor: '#f1f8e9' }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Box sx={{ color: '#2e7d32', mb: 2 }}>
                  <PsychologyIcon sx={{ fontSize: 60 }} />
                </Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Dual Strategy AI
                </Typography>
                <Typography color="text.secondary">
                  Confronta istantaneamente le decisioni:
                  <br/>
                  <b>🤖 Machine Learning:</b> Logistic Regression addestrata.
                  <br/>
                  <b>📖 Rule Based:</b> Algoritmi deterministici classici.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 3: Computer Vision */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%', borderRadius: 4, boxShadow: 4 }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Box sx={{ color: '#d32f2f', mb: 2 }}>
                  <PhotoCameraBackIcon sx={{ fontSize: 60 }} />
                </Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Deep Vision
                </Typography>
                <Typography color="text.secondary">
                  Diagnostica visiva avanzata tramite <b>Reti Neurali Convoluzionali (CNN)</b>.
                  Riconosce 40+ patologie e fornisce cure specifiche.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
}