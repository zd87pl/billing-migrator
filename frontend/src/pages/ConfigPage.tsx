import { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Card, 
  CardContent,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import { Save as SaveIcon, Check as CheckIcon } from '@mui/icons-material';

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
      privateKey: ''
    },
    netsuite: {
      endpoint: '',
      apiKey: ''
    },
    openai: {
      apiKey: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (section: keyof ConfigState, field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/config/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to validate configuration');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Configuration
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Configuration validated successfully!
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Braintree Configuration */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Braintree Configuration
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Environment"
                    value={config.braintree.environment}
                    onChange={(e) => handleChange('braintree', 'environment', e.target.value)}
                    placeholder="sandbox or production"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Merchant ID"
                    value={config.braintree.merchantId}
                    onChange={(e) => handleChange('braintree', 'merchantId', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Public Key"
                    value={config.braintree.publicKey}
                    onChange={(e) => handleChange('braintree', 'publicKey', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Private Key"
                    value={config.braintree.privateKey}
                    onChange={(e) => handleChange('braintree', 'privateKey', e.target.value)}
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
                NetSuite Configuration
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="API Endpoint"
                    value={config.netsuite.endpoint}
                    onChange={(e) => handleChange('netsuite', 'endpoint', e.target.value)}
                    placeholder="https://rest.netsuite.com/api"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="password"
                    label="API Key"
                    value={config.netsuite.apiKey}
                    onChange={(e) => handleChange('netsuite', 'apiKey', e.target.value)}
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
                OpenAI Configuration
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="password"
                    label="API Key"
                    value={config.openai.apiKey}
                    onChange={(e) => handleChange('openai', 'apiKey', e.target.value)}
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
          disabled={loading}
          startIcon={success ? <CheckIcon /> : <SaveIcon />}
          sx={{ minWidth: 150 }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : success ? (
            'Validated'
          ) : (
            'Validate & Save'
          )}
        </Button>
      </Box>
    </Box>
  );
}
