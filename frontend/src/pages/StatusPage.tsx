import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

interface MigrationStats {
  totalItems: number;
  approvedItems: number;
  pendingItems: number;
  failedItems: number;
  lastRun: string | null;
  currentStatus: 'idle' | 'running' | 'complete' | 'error';
}

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'success';
}

export default function StatusPage() {
  const [stats, setStats] = useState<MigrationStats>({
    totalItems: 0,
    approvedItems: 0,
    pendingItems: 0,
    failedItems: 0,
    lastRun: null,
    currentStatus: 'idle',
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchStatus();
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'log') {
        setLogs(prev => [data.data, ...prev].slice(0, 100)); // Keep last 100 logs
      } else if (data.type === 'progress') {
        setProgress(data.data.progress);
      } else if (data.type === 'state') {
        updateStats(data.data);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Failed to connect to status updates');
    };

    return () => ws.close();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/migration/status');
      const data = await response.json();
      
      updateStats(data);
      if (data.logs) {
        setLogs(data.logs);
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch migration status');
      setLoading(false);
    }
  };

  const updateStats = (data: any) => {
    setStats({
      totalItems: data.data?.length || 0,
      approvedItems: data.approvedItems?.length || 0,
      pendingItems: (data.data?.length || 0) - (data.approvedItems?.length || 0),
      failedItems: data.failedItems?.length || 0,
      lastRun: data.lastRun,
      currentStatus: data.status,
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  const statusColor = {
    idle: 'default',
    running: 'primary',
    complete: 'success',
    error: 'error',
  } as const;

  const statusIcon = {
    idle: <ScheduleIcon />,
    running: <PendingIcon />,
    complete: <SuccessIcon />,
    error: <ErrorIcon />,
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Migration Status
      </Typography>

      <Grid container spacing={3}>
        {/* Status Overview */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Chip
                  icon={statusIcon[stats.currentStatus]}
                  label={`Status: ${stats.currentStatus.toUpperCase()}`}
                  color={statusColor[stats.currentStatus]}
                  variant="outlined"
                />
                {stats.lastRun && (
                  <Typography variant="body2" color="text.secondary">
                    Last Run: {new Date(stats.lastRun).toLocaleString()}
                  </Typography>
                )}
              </Box>

              {stats.currentStatus === 'running' && (
                <Box sx={{ mb: 3 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    align="center"
                    sx={{ mt: 1 }}
                  >
                    {progress}% Complete
                  </Typography>
                </Box>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4">{stats.totalItems}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Items
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                    <Typography variant="h4" color="white">
                      {stats.approvedItems}
                    </Typography>
                    <Typography variant="body2" color="white">
                      Approved
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
                    <Typography variant="h4" color="white">
                      {stats.pendingItems}
                    </Typography>
                    <Typography variant="body2" color="white">
                      Pending
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light' }}>
                    <Typography variant="h4" color="white">
                      {stats.failedItems}
                    </Typography>
                    <Typography variant="body2" color="white">
                      Failed
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Logs */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Paper 
                sx={{ 
                  maxHeight: 400, 
                  overflow: 'auto',
                  bgcolor: '#fafafa'
                }}
              >
                <List dense>
                  {logs.map((log, index) => (
                    <Box key={index}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box component="span" sx={{ 
                              color: log.type === 'error' ? 'error.main' : 
                                    log.type === 'success' ? 'success.main' : 
                                    'text.primary'
                            }}>
                              {log.message}
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {new Date(log.timestamp).toLocaleString()}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < logs.length - 1 && (
                        <Divider />
                      )}
                    </Box>
                  ))}
                </List>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
