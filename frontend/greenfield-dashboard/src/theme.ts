
import { createTheme } from '@mui/material/styles';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1E8449' },   
    secondary: { main: '#0E6655' }, 
    background: { default: '#f7faf7' }
  },
  shape: { borderRadius: 12 }
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#58D68D' },
    secondary: { main: '#1ABC9C' }
  },
  shape: { borderRadius: 12 }
});
