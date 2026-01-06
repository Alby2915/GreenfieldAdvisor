import { useMemo, useState } from 'react';
import {
  Box, Card, CardContent, Grid, Stack, Typography, Chip, Alert, ToggleButton, ToggleButtonGroup, Paper
} from '@mui/material';

import WaterDropIcon from '@mui/icons-material/WaterDrop';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import BoltIcon from '@mui/icons-material/Bolt';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import TuneIcon from '@mui/icons-material/Tune'; 

import KpiCard from '../components/kpi/KpiCard';
import SensorChartSplitSynced, { type SeriesDef } from '../components/charts/SensorChart';
import { useLiveData } from '../hooks/useLiveData';

//  COMPONENTE PER ABBELLIRE LA REASON (SOLO RULE BASED)
const RuleConfigDisplay = ({ text }: { text: string }) => (
  <Paper 
    variant="outlined" 
    sx={{ 
      mt: 2, 
      p: 1.5, 
      bgcolor: 'rgba(0, 0, 0, 0.02)', 
      borderColor: 'divider',
      borderStyle: 'dashed',
      borderRadius: 2,
      display: 'flex',
      alignItems: 'center',
      gap: 1.5
    }}
  >
    <Box sx={{ color: 'text.secondary', display: 'flex' }}>
      <TuneIcon fontSize="small" />
    </Box>
    <Box>
      <Typography variant="caption" display="block" color="text.secondary" fontWeight="bold" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Configurazione Attiva
      </Typography>
      <Typography variant="body2" fontWeight="medium" sx={{ fontFamily: 'monospace', color: 'text.primary' }}>
        {text}
      </Typography>
    </Box>
  </Paper>
);

export default function Dashboard() {
  const { latest, series, isConnected, advice } = useLiveData(100);
  
  const [activeModel, setActiveModel] = useState<'ai' | 'rules'>('ai');

  const handleModelChange = (
    _event: React.MouseEvent<HTMLElement>,
    newModel: 'ai' | 'rules' | null,
  ) => {
    if (newModel !== null) {
      setActiveModel(newModel);
    }
  };

  const currentAdvice = advice ? advice[activeModel] : null;

  // Mappatura dati per i grafici
  const chartData = useMemo(() => series.map((s) => ({
        ts: s.ts,
        Soil: s.Soil_moisture_pct ?? 0,
        T: s.Temperature_C ?? 0,
        Humidity: s.Humidity_pct ?? 0,
        N: s.Nitrogen_mg_kg ?? 0,
        P: s.Phosphorus_mg_kg ?? 0,
        K: s.Potassium_mg_kg ?? 0,
  })), [series]);

  // DEFINIZIONE GRAFICI
  const splitSeries: SeriesDef[] = [
    { key: 'Soil', color: '#27ae60', name: 'Soil Moisture', unit: '%' },
    { key: 'T', color: '#e67e22', name: 'Temperature', unit: '°C' },
    { key: 'Humidity', color: '#0288d1', name: 'Humidity', unit: '%' },
    { key: 'N', color: '#d62728', name: 'Nitrogen', unit: 'mg/kg' },
    { key: 'P', color: '#8e44ad', name: 'Phosphorus', unit: 'mg/kg' },
    { key: 'K', color: '#8c564b', name: 'Potassium', unit: 'mg/kg' },
  ];

  return (
    <Stack spacing={2} sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Tomato Crops 🍅</Typography>
        <Chip 
          label={isConnected ? "LIVE (Kafka)" : "OFFLINE"} 
          color={isConnected ? "success" : "error"} 
          size="small"
        />
      </Stack>

      {/* KPI Cards */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 2 }}><KpiCard title="Soil Moisture" value={latest?.Soil_moisture_pct?.toFixed(1) ?? '--'} unit="%" /></Grid>
        <Grid size={{ xs: 6, md: 2 }}><KpiCard title="Temperature" value={latest?.Temperature_C?.toFixed(1) ?? '--'} unit="°C" /></Grid>
        <Grid size={{ xs: 6, md: 2 }}><KpiCard title="Humidity" value={latest?.Humidity_pct?.toFixed(1) ?? '--'} unit="%" /></Grid>
        <Grid size={{ xs: 6, md: 2 }}><KpiCard title="Nitrogen" value={latest?.Nitrogen_mg_kg?.toFixed(0) ?? '--'} unit="mg/kg" /></Grid>
        <Grid size={{ xs: 6, md: 2 }}><KpiCard title="Phosphorus" value={latest?.Phosphorus_mg_kg?.toFixed(0) ?? '--'} unit="mg/kg" /></Grid>
        <Grid size={{ xs: 6, md: 2 }}><KpiCard title="Potassium" value={latest?.Potassium_mg_kg?.toFixed(0) ?? '--'} unit="mg/kg" /></Grid>
      </Grid>

      <Card elevation={0} sx={{ borderRadius: 3 }}>
        <CardContent>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {chartData.length > 0 ? (
               <SensorChartSplitSynced data={chartData} series={splitSeries} height={150} />
            ) : (
               <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>In attesa di dati...</Box>
            )}
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, border: '1px solid #ddd', overflow: 'visible' }}>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
          <ToggleButtonGroup
            value={activeModel}
            exclusive
            onChange={handleModelChange}
            aria-label="model strategy"
            sx={{ bgcolor: 'white' }}
          >
            <ToggleButton value="ai" sx={{ px: 3, '&.Mui-selected': { bgcolor: '#2e7d32', color: 'white', '&:hover': { bgcolor: '#1b5e20' } } }}>
              <AutoAwesomeIcon sx={{ mr: 1 }} /> AI Model
            </ToggleButton>
            <ToggleButton value="rules" sx={{ px: 3, '&.Mui-selected': { bgcolor: '#1976d2', color: 'white', '&:hover': { bgcolor: '#1565c0' } } }}>
              <MenuBookIcon sx={{ mr: 1 }} /> Rule Based
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <CardContent>
          {!currentAdvice ? (
            <Alert severity="info">
              In attesa di analisi... Assicurati che 'analyzer_service.py' e 'server.py' siano attivi.
            </Alert>
          ) : (
            <Grid container spacing={3} alignItems="stretch">
              
              {/* 1. IRRIGAZIONE */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ p: 2, height: '100%', border: '1px solid', borderColor: currentAdvice.irrigation.status === 'ON' ? 'error.light' : 'success.light', borderRadius: 2, bgcolor: currentAdvice.irrigation.status === 'ON' ? '#ffebee' : '#f1f8e9' }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <WaterDropIcon color="primary" />
                    <Typography variant="h6">Irrigazione</Typography>
                  </Stack>
                  <Typography variant="h3" fontWeight="bold" color={currentAdvice.irrigation.status === 'ON' ? 'error' : 'success'}>
                    {currentAdvice.irrigation.status}
                  </Typography>

                 
                  {activeModel === 'rules' ? (
                    <RuleConfigDisplay text={currentAdvice.irrigation.reason} />
                  ) : (
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      {currentAdvice.irrigation.reason}
                    </Typography>
                  )}
                </Box>
              </Grid>

              {/* 2. FERTILIZZAZIONE */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ p: 2, height: '100%', border: '1px solid #e0e0e0', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <LocalFloristIcon color="secondary" />
                    <Typography variant="h6">Fertilizzazione</Typography>
                  </Stack>
                  <Stack spacing={2} sx={{ flexGrow: 1 }}>
                    {['N', 'P', 'K'].map((el) => (
                      <Stack key={el} direction="row" justifyContent="space-between" alignItems="center">
                        <Typography><b>{el}</b></Typography>
                        <Chip 
                          label={currentAdvice.fertilization[el as keyof typeof currentAdvice.fertilization]} 
                          color={currentAdvice.fertilization[el as keyof typeof currentAdvice.fertilization] !== 'OK' ? 'warning' : 'success'} 
                          size="small" 
                        />
                      </Stack>
                    ))}
                  </Stack>

                   {/* VISUALIZZAZIONE REASON */}
                   {activeModel === 'rules' ? (
                    <RuleConfigDisplay text={currentAdvice.fertilization.reason} />
                  ) : (
                    <Typography variant="caption" color="text.secondary" display="block" mt={2}>
                      Nota: {currentAdvice.fertilization.reason}
                    </Typography>
                  )}
                </Box>
              </Grid>

              {/* 3. ENERGIA */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ p: 2, height: '100%', border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: currentAdvice.energy.status !== 'OFF' ? '#fff3e0' : 'white' }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <BoltIcon color="warning" />
                    <Typography variant="h6">Energia</Typography>
                  </Stack>
                  <Typography variant="h3" fontWeight="bold" color={currentAdvice.energy.status !== 'OFF' ? 'warning.main' : 'text.disabled'}>
                    {currentAdvice.energy.status}
                  </Typography>
                  
                  {/* VISUALIZZAZIONE REASON */}
                  {activeModel === 'rules' ? (
                    <RuleConfigDisplay text={currentAdvice.energy.reason} />
                  ) : (
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      {currentAdvice.energy.reason}
                    </Typography>
                  )}
                </Box>
              </Grid>

            </Grid>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}