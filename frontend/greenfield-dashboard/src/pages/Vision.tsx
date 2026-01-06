import React, { useState } from 'react';
import { 
  Box, Button, Card, CardContent, Typography, CircularProgress, Alert, Stack, 
  Grid, AlertTitle, Chip, List, ListItem, ListItemIcon, ListItemText 
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import HealingIcon from '@mui/icons-material/Healing';
import ShieldIcon from '@mui/icons-material/Shield';


interface VisionAdvice {
  title: string;
  severity: 'error' | 'warning' | 'success' | 'info';
  description: string;
  actions: string[];
  prevention: string;
  confidence_score: number;
}

interface VisionResponse {
  category: string;
  advice: VisionAdvice;
}

export default function Vision() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VisionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null); 
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const baseUrl = import.meta.env.VITE_AI_API_BASE || 'http://localhost:8080';
      const res = await fetch(`${baseUrl}/upload-image`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(`Errore Server: ${res.statusText}`);

      const data: VisionResponse = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Impossibile completare l'analisi. Verifica che il server backend sia attivo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={3} sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Header Pagina */}
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="h3" fontWeight="bold" sx={{ color: '#1565c0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <PhotoCameraIcon fontSize="inherit" /> Vision AI Specialist
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Carica una foto della foglia o del frutto per una diagnosi agronomica istantanea.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        
        {/* COLONNA SINISTRA: UPLOAD & PREVIEW */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 3 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, p: 4 }}>
              
              <Box 
                sx={{ 
                  width: '100%', 
                  height: 300, 
                  bgcolor: '#f5f5f5', 
                  borderRadius: 2, 
                  border: '2px dashed #ccc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                {preview ? (
                  <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <Stack alignItems="center" color="text.secondary">
                    <CloudUploadIcon sx={{ fontSize: 60, mb: 1, color: '#ccc' }} />
                    <Typography>Nessuna immagine</Typography>
                  </Stack>
                )}
              </Box>

              <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                <Button 
                  variant="outlined" 
                  component="label" 
                  fullWidth 
                  startIcon={<CloudUploadIcon />}
                  sx={{ py: 1.5 }}
                >
                  Scegli Foto
                  <input hidden accept="image/*" type="file" onChange={handleFileSelect} />
                </Button>
                
                <Button 
                  variant="contained" 
                  onClick={handleAnalyze} 
                  disabled={!selectedFile || loading}
                  fullWidth
                  sx={{ py: 1.5, fontWeight: 'bold' }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Analizza'}
                </Button>
              </Stack>

              {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}
            </CardContent>
          </Card>
        </Grid>

        {/* COLONNA DESTRA: RISULTATI DIAGNOSTICI */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 3, bgcolor: '#fafafa' }}>
            <CardContent sx={{ p: 4 }}>
              {!result ? (
                <Box sx={{ height: '100%', minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
                  <Typography variant="h5" color="text.secondary" gutterBottom>In attesa di analisi...</Typography>
                  <Typography variant="body2">I risultati dell'AI appariranno qui.</Typography>
                </Box>
              ) : (
                <Box>
                  {/* TESTATA RISULTATO */}
                  <Alert 
                    severity={result.advice.severity}
                    iconMapping={{
                      success: <CheckCircleIcon fontSize="inherit" />,
                      warning: <WarningIcon fontSize="inherit" />,
                      error: <ErrorIcon fontSize="inherit" />,
                    }}
                    sx={{ mb: 3 }}
                  >
                    <AlertTitle sx={{ fontWeight: 'bold', fontSize: '1.4rem' }}>
                      {result.advice.title}
                    </AlertTitle>
                    <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                      {result.advice.description}
                    </Typography>
                    
                    <Chip 
                      label={`Confidenza IA: ${(result.advice.confidence_score * 100).toFixed(1)}%`} 
                      size="small" 
                      color={result.advice.severity} 
                      variant="filled"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Alert>

                  {/* SEZIONE AZIONI (Se necessario) */}
                  {result.advice.severity !== 'success' && (
                    <Stack spacing={3}>
                      
                      {/* Azioni Immediate */}
                      <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 2, border: '1px solid #ffcdd2' }}>
                        <Typography variant="h6" sx={{ color: '#d32f2f', display: 'flex', alignItems: 'center', mb: 1, fontWeight: 'bold' }}>
                          <HealingIcon sx={{ mr: 1 }} /> Azioni Immediate
                        </Typography>
                        <List dense>
                          {result.advice.actions.map((act, idx) => (
                            <ListItem key={idx}>
                              <ListItemIcon sx={{ minWidth: 30 }}>👉</ListItemIcon>
                              <ListItemText primary={act} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>

                      {/* Prevenzione */}
                      <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 2, border: '1px solid #bbdefb' }}>
                        <Typography variant="h6" sx={{ color: '#1976d2', display: 'flex', alignItems: 'center', mb: 1, fontWeight: 'bold' }}>
                          <ShieldIcon sx={{ mr: 1 }} /> Prevenzione Futura
                        </Typography>
                        <Alert severity="info" sx={{ bgcolor: 'transparent', p: 0 }}>
                          {result.advice.prevention}
                        </Alert>
                      </Box>
                    </Stack>
                  )}

                  {/* Messaggio se Sano */}
                  {result.advice.severity === 'success' && (
                     <Box sx={{ textAlign: 'center', mt: 4 }}>
                        <Typography variant="h6" color="success.main">
                           Nessun intervento richiesto. La pianta è in ottima salute! 🌱
                        </Typography>
                     </Box>
                  )}

                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Stack>
  );
}