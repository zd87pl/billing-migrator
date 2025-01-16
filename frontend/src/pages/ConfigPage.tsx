import { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Grid, Alert, Snackbar } from '@mui/material';

interface ConfigState {
  braintree: {
    environment: string;
    merchantId: string;
    publicKey: string;
    privateKey: string;
  };
  netsuite: {
    endpoint: string;
    apiKey: string;
  };
  openai: {
    apiKey: string;
  };
}

export default function ConfigPage() {
  const [config, setConfig] = useState<ConfigState>({
    braintree: {
      environment: '',
      merchantId: '',
      publicKey: '',
      privateKey: '',
    },
    netsuite: {
      endpoint: '',
      apiKey: '',
    },
    openai: {
      apiKey: '',
    },
  });

  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const handleChange = (section: keyof ConfigState, field: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/config/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (data.success) {
        setNotification({
          open: true,
          message: 'Configuration validated successfully!',
          severity: 'success',
        });
        // Save to localStorage for persistence
        localStorage.setItem('migrationConfig', JSON.stringify(config));
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setNotification({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to validate configuration',
        severity: 'error',
      });
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Configuration
      </Typography>
      <Typography variant="body1" paragraph>
        Configure your connection settings for Braintree, NetSuite, and OpenAI.
      </Typography>

      <Grid container spacing={3}>
        {/* Braintree Configuration */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Braintree Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Environment"
                    value={config.braintree.environment}
                    onChange={(e) => handleChange('braintree', 'environment', e.target.value)}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Merchant ID"
                    value={config.braintree.merchantId}
                    onChange={(e) => handleChange('braintree', 'merchantId', e.target.value)}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Public Key"
                    value={config.braintree.publicKey}
                    onChange={(e) => handleChange('braintree', 'publicKey', e.target.value)}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Private Key"
                    value={config.braintree.privateKey}
                    onChange={(e) => handleChange('braintree', 'privateKey', e.target.value)}
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* NetSuite Configuration */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                NetSuite Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="API Endpoint"
                    value={config.netsuite.endpoint}
                    onChange={(e) => handleChange('netsuite', 'endpoint', e.target.value)}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="password"
                    label="API Key"
                    value={config.netsuite.apiKey}
                    onChange={(e) => handleChange('netsuite', 'apiKey', e.target.value)}
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* OpenAI Configuration */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                OpenAI Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="password"
                    label="API Key"
                    value={config.openai.apiKey}
                    onChange={(e) => handleChange('openai', 'apiKey', e.target.value)}
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          size="large"
        >
          Validate & Save Configuration
        </Button>
      </Box>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert severity={notification.severity} onClose={() => setNotification({ ...notification, open: false })}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
