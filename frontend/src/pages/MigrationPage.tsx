import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  LinearProgress,
  Alert,
  Paper,
} from '@mui/material';

interface MigrationProgress {
  status: 'idle' | 'running' | 'complete' | 'error';
  progress: number;
  currentStep: string;
}

export default function MigrationPage() {
  const navigate = useNavigate();
  const [dataType, setDataType] = useState('customers');
  const [progress, setProgress] = useState<MigrationProgress>({
    status: 'idle',
    progress: 0,
    currentStep: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<Array<{ timestamp: string; message: string; type: string }>>([]);

  useEffect(() => {
    // Set up WebSocket connection
    const ws = new WebSocket(`ws://${window.location.host}/ws`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'progress':
          setProgress(prev => ({
            ...prev,
            progress: data.data.progress,
            currentStep: data.data.step
          }));
          break;
        case 'log':
          setLogs(prev => [...prev, data.data]);
          break;
        case 'error':
          setError(data.data);
          setProgress(prev => ({ ...prev, status: 'error' }));
          break;
        case 'complete':
          setProgress(prev => ({ ...prev, status: 'complete' }));
          navigate('/approval');
          break;
      }
    };

    return () => {
      ws.close();
    };
  }, [navigate]);

  const startMigration = async () => {
    try {
      const config = localStorage.getItem('migrationConfig');
      if (!config) {
        throw new Error('Please configure connection settings first');
      }

      setError(null);
      setLogs([]);
      setProgress({ status: 'running', progress: 0, currentStep: 'Initializing' });

      const response = await fetch('/api/migration/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataType,
          config: JSON.parse(config),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start migration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProgress(prev => ({ ...prev, status: 'error' }));
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Start Migration
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Data Type</InputLabel>
            <Select
              value={dataType}
              label="Data Type"
              onChange={(e) => setDataType(e.target.value)}
              disabled={progress.status === 'running'}
            >
              <MenuItem value="customers">Customers</MenuItem>
              <MenuItem value="transactions">Transactions</MenuItem>
              <MenuItem value="subscriptions">Subscriptions</MenuItem>
              <MenuItem value="plans">Plans</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            color="primary"
            onClick={startMigration}
            disabled={progress.status === 'running'}
            fullWidth
          >
            Start Migration
          </Button>
        </CardContent>
      </Card>

      {progress.status === 'running' && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Progress: {progress.currentStep}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={progress.progress} 
              sx={{ height: 10, borderRadius: 5 }}
            />
            <Typography variant="body2" color="text.secondary" align="right" sx={{ mt: 1 }}>
              {progress.progress}%
            </Typography>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper 
        sx={{ 
          p: 2, 
          maxHeight: '400px', 
          overflow: 'auto',
          backgroundColor: '#1a1a1a',
          color: '#fff',
          fontFamily: 'monospace'
        }}
      >
        {logs.map((log, index) => (
          <Box 
            key={index} 
            sx={{ 
              mb: 1,
              color: log.type === 'error' ? '#ff6b6b' : '#4caf50'
            }}
          >
            <Typography variant="body2" component="span" sx={{ opacity: 0.7 }}>
              [{new Date(log.timestamp).toLocaleTimeString()}]
            </Typography>{' '}
            <Typography variant="body2" component="span">
              {log.message}
            </Typography>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}
