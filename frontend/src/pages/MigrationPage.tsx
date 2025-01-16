import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import { PlayArrow as StartIcon, Check as DoneIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface MigrationConfig {
  dataType: string;
  schema: {
    field: string;
  };
}

export default function MigrationPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<MigrationConfig>({
    dataType: '',
    schema: {
      field: 'type'
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDataTypeChange = (event: SelectChangeEvent) => {
    setConfig(prev => ({
      ...prev,
      dataType: event.target.value
    }));
    setError(null);
  };

  const handleStartMigration = async () => {
    if (!config.dataType) {
      setError('Please select a data type');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/migration/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start migration');
      }

      setSuccess(true);
      // Navigate to status page after successful start
      setTimeout(() => {
        navigate('/status');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Start Migration
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Migration started successfully! Redirecting to status page...
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Migration Configuration
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Data Type</InputLabel>
                    <Select
                      value={config.dataType}
                      label="Data Type"
                      onChange={handleDataTypeChange}
                      disabled={loading}
                    >
                      <MenuItem value="customers">Customers</MenuItem>
                      <MenuItem value="transactions">Transactions</MenuItem>
                      <MenuItem value="subscriptions">Subscriptions</MenuItem>
                      <MenuItem value="plans">Plans</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Box sx={{ mt: 4 }}>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Selected data will be:
                </Typography>
                <ol>
                  <li>Fetched from Braintree</li>
                  <li>Analyzed and categorized using AI</li>
                  <li>Transformed to match NetSuite schema</li>
                  <li>Presented for your approval</li>
                </ol>
              </Box>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleStartMigration}
                  disabled={loading || !config.dataType || success}
                  startIcon={success ? <DoneIcon /> : <StartIcon />}
                  sx={{ minWidth: 150 }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : success ? (
                    'Started'
                  ) : (
                    'Start Migration'
                  )}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
