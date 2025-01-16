import { Routes, Route, Link } from 'react-router-dom';
import { AppBar, Box, Container, Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Typography } from '@mui/material';
import { Settings, Assessment, PlayArrow, CheckCircle, Home } from '@mui/icons-material';

// Import all pages from the barrel export
import { 
  LandingPage,
  ConfigPage,
  MigrationPage,
  ApprovalPage,
  StatusPage 
} from './pages';

const drawerWidth = 240;

function App() {
  const menuItems = [
    { text: 'Home', icon: <Home />, path: '/' },
    { text: 'Configuration', icon: <Settings />, path: '/config' },
    { text: 'Migration', icon: <PlayArrow />, path: '/migration' },
    { text: 'Approval', icon: <CheckCircle />, path: '/approval' },
    { text: 'Status', icon: <Assessment />, path: '/status' }
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Billing Migrator
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem button key={item.text} component={Link} to={item.path}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Container maxWidth="lg">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/migration" element={<MigrationPage />} />
            <Route path="/approval" element={<ApprovalPage />} />
            <Route path="/status" element={<StatusPage />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
}

export default App;
