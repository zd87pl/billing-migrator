import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Container, 
  Grid, 
  Paper, 
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { 
  Settings, 
  PlayArrow, 
  CheckCircle, 
  Assessment,
  ArrowForward,
  Security,
  Storage,
  CloudSync
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Security sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Secure Migration',
      description: 'End-to-end secure data transfer with encryption and validation'
    },
    {
      icon: <Storage sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Multiple Data Types',
      description: 'Support for customers, transactions, subscriptions, and plans'
    },
    {
      icon: <CloudSync sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'AI-Powered',
      description: 'Intelligent data categorization and mapping using OpenAI'
    }
  ];

  const steps = [
    {
      icon: <Settings color="primary" />,
      title: 'Configure',
      description: 'Set up your API credentials for Braintree, NetSuite, and OpenAI',
      path: '/config'
    },
    {
      icon: <PlayArrow color="primary" />,
      title: 'Start Migration',
      description: 'Select data types and begin the migration process',
      path: '/migration'
    },
    {
      icon: <CheckCircle color="primary" />,
      title: 'Review & Approve',
      description: 'Verify and approve transformed data before final migration',
      path: '/approval'
    },
    {
      icon: <Assessment color="primary" />,
      title: 'Monitor Progress',
      description: 'Track migration status and view detailed logs',
      path: '/status'
    }
  ];

  return (
    <Box sx={{ py: 8 }}>
      {/* Hero Section */}
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography 
            variant="h2" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Billing Migrator
          </Typography>
          <Typography variant="h5" color="text.secondary" paragraph>
            Seamlessly migrate your billing data from Braintree to NetSuite
            with AI-powered data categorization and validation
          </Typography>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForward />}
            onClick={() => navigate('/config')}
            sx={{ mt: 2 }}
          >
            Get Started
          </Button>
        </Box>

        {/* Features Section */}
        <Grid container spacing={4} sx={{ mb: 8 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Paper 
                elevation={3}
                sx={{ 
                  p: 3, 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  background: 'linear-gradient(to bottom, rgba(33,150,243,0.1), rgba(33,203,243,0.05))'
                }}
              >
                {feature.icon}
                <Typography variant="h6" sx={{ my: 2 }}>
                  {feature.title}
                </Typography>
                <Typography color="text.secondary">
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* How It Works Section */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
            How It Works
          </Typography>
          <Card elevation={3}>
            <CardContent>
              <List>
                {steps.map((step, index) => (
                  <Box key={index}>
                    <ListItem 
                      button 
                      onClick={() => navigate(step.path)}
                      sx={{ py: 2 }}
                    >
                      <ListItemIcon>
                        {step.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Typography variant="h6">
                            {index + 1}. {step.title}
                          </Typography>
                        }
                        secondary={step.description}
                      />
                    </ListItem>
                    {index < steps.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* Getting Started Section */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Ready to Start?
          </Typography>
          <Typography color="text.secondary" paragraph>
            Begin by configuring your API credentials in the Configuration page.
            Our step-by-step process will guide you through the entire migration.
          </Typography>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForward />}
            onClick={() => navigate('/config')}
          >
            Configure Now
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
