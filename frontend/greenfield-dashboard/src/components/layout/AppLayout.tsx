import { Outlet } from 'react-router-dom';
import { CssBaseline, Box, Drawer, ThemeProvider } from '@mui/material';
import TopBar from './TopBar';
import SideNav from './SideNav';
import Footer from './Footer'; 
import { lightTheme } from '../../theme'; 

const drawerWidth = 240;

export default function AppLayout() {

  const theme = lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        
        {/* SIDEBAR */}
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { 
              width: drawerWidth, 
              boxSizing: 'border-box', 
              p: 1 
            },
          }}
        >
          <SideNav />
        </Drawer>

        {/* MAIN WRAPPER */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: `calc(100% - ${drawerWidth}px)`,
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            minWidth: 0,
          }}
        >
          {/* HEADER */}

          <TopBar />

          {/* CONTENUTO PAGINA */}
          <Box sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
            <Outlet />
          </Box>

          {/* FOOTER */}
          <Footer />
        </Box>
      </Box>
    </ThemeProvider>
  );
}