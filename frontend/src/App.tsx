import { Routes, Route, Link } from 'react-router-dom';
import { AppBar, Box, Container, Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Typography } from '@mui/material';
import { Settings, Assessment, PlayArrow, CheckCircle } from '@mui/icons-material';

// Pages (we'll create these next)
import ConfigPage from './pages/ConfigPage';
import MigrationPage from './pages/MigrationPage';
import ApprovalPage from './pages/ApprovalPage';
import StatusPage from './pages/StatusPage';

const drawerWidth = 240;

function App() {
  const menuItems = [
    { text: 'Configuration', icon: <Settings />, path: '/' },
    { text: 'Migration', icon: <PlayArrow />, path: '/migration' },
    { text: 'Approval', icon: <CheckCircle />, path: '/approval' },
    { text: 'Status', icon: <Assessment />, path: '/status' }
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
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
            <Route path="/" element={<ConfigPage />} />
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
