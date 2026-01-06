import { Box, Typography } from '@mui/material';

export default function Footer() {
  return (
    <Box 
      component="footer" 
      sx={{ 
        py: 3, 
        px: 2, 
        mt: 'auto',              
        backgroundColor: '#121212', 
        color: '#b0bec5',        
        textAlign: 'center',
        borderTop: '1px solid #333',
        zIndex: 10               
      }}
    >
      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'bold' }}>
        GreenField Advisor © {new Date().getFullYear()}
      </Typography>
      
      <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.7 }}>
        Made by Francesco Colella - Alberto Vox - Samar Zaidi
      </Typography>
    </Box>
  );
}