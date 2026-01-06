import { List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MemoryIcon from '@mui/icons-material/Memory';
import SettingsIcon from '@mui/icons-material/Settings';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import HomeIcon from '@mui/icons-material/Home'; 
import { NavLink } from 'react-router-dom';

export default function SideNav() {
  const items = [
    
    { to: '/', icon: <HomeIcon />, label: 'Home' },
    
    
    { to: '/dashboard', icon: <DashboardIcon />, label: 'Crops' },
    
    
    { to: '/vision', icon: <CameraAltIcon />, label: 'Vision AI' },
    { to: '/models', icon: <MemoryIcon />, label: 'Modelli AI' },
    { to: '/settings', icon: <SettingsIcon />, label: 'Settings' }
  ];

  return (
    <List sx={{ p: 1 }}>
      {items.map(i => (
        <ListItemButton 
          key={i.to} 
          component={NavLink} 
          to={i.to}
          sx={{ 
            borderRadius: 2, 
            mb: .5, 
            '&.active': { bgcolor: 'primary.main', color: 'primary.contrastText' } 
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>{i.icon}</ListItemIcon>
          <ListItemText primary={i.label} />
        </ListItemButton>
      ))}
    </List>
  );
}