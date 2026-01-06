import {
  AppBar, Toolbar, Typography, Stack, Button, Box, CircularProgress, Container
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function TopBar() {
  const { user, loading, logout } = useAuth();
  const loc = useLocation();

  return (
    <AppBar 
      position="sticky" 
      elevation={1} 
      color="transparent" 
      sx={{ 
        backdropFilter: 'blur(6px)',
        width: '100%', 
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'rgba(255, 255, 255, 0.8)' 
      }}
    >
      <Toolbar disableGutters>
        <Container
          maxWidth={false}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            px: { xs: 2, sm: 3 }, 
          }}
        >
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            GreenField Advisor
          </Typography>

          

          <Box sx={{ ml: 1, minWidth: 160, display: 'flex', justifyContent: 'flex-end' }}>
            {loading ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} color="inherit" />
                <Typography variant="body2" color="text.secondary">Verifica sessione…</Typography>
              </Stack>
            ) : user ? (
              <Stack direction="row" spacing={1.2} alignItems="center">
                <Typography variant="body2" sx={{ maxWidth: 220 }} noWrap title={user.name ?? user.email}>
                  👤 {user.name ?? user.email}
                </Typography>
                <Button size="small" variant="outlined" color="inherit" onClick={logout}>
                  Logout
                </Button>
              </Stack>
            ) : (
              <Stack direction="row" spacing={1}>
                <Button size="small" color="inherit" component={RouterLink} to="/login" state={{ from: loc }}>
                  Login
                </Button>
                <Button size="small" color="inherit" component={RouterLink} to="/register" state={{ from: loc }}>
                  Register
                </Button>
              </Stack>
            )}
          </Box>
        </Container>
      </Toolbar>
    </AppBar>
  );
}
