import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Checkbox,
  IconButton,
  Collapse,
  Chip
} from '@mui/material';
import {
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
  Check as ApproveIcon,
  Clear as RejectIcon
} from '@mui/icons-material';

interface TransformedData {
  id: string;
  original: any;
  transformed: any;
  cohort: string;
}

export default function ApprovalPage() {
  const [data, setData] = useState<TransformedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/migration/status');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      if (result.data) {
        setData(result.data);
        // Initialize approved items
        if (result.approvedItems) {
          setSelectedItems(new Set(result.approvedItems));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleToggleExpand = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleApproveSelected = async () => {
    setApproving(true);
    setError(null);

    try {
      const response = await fetch('/api/migration/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          itemIds: Array.from(selectedItems),
          approved: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to approve items');
      }

      // Refresh data after approval
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!data.length) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Data Approval
        </Typography>
        <Alert severity="info">
          No data available for approval. Start a migration first.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Data Approval
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs>
              <Typography variant="h6">
                {data.length} Items Ready for Review
              </Typography>
              <Typography color="text.secondary">
                {selectedItems.size} items selected
              </Typography>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                onClick={handleApproveSelected}
                disabled={selectedItems.size === 0 || approving}
                startIcon={<ApproveIcon />}
              >
                {approving ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  `Approve Selected (${selectedItems.size})`
                )}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedItems.size > 0 && selectedItems.size < data.length}
                  checked={selectedItems.size === data.length}
                  onChange={() => {
                    if (selectedItems.size === data.length) {
                      setSelectedItems(new Set());
                    } else {
                      setSelectedItems(new Set(data.map(item => item.id)));
                    }
                  }}
                />
              </TableCell>
              <TableCell />
              <TableCell>ID</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Cohort</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item) => (
              <>
                <TableRow key={item.id}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleToggleSelect(item.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleExpand(item.id)}
                    >
                      {expandedRows.has(item.id) ? (
                        <ExpandLessIcon />
                      ) : (
                        <ExpandMoreIcon />
                      )}
                    </IconButton>
                  </TableCell>
                  <TableCell>{item.transformed.id}</TableCell>
                  <TableCell>{item.transformed.type}</TableCell>
                  <TableCell>
                    <Chip 
                      label={item.cohort}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {selectedItems.has(item.id) ? (
                      <Chip
                        label="Approved"
                        color="success"
                        size="small"
                        icon={<ApproveIcon />}
                      />
                    ) : (
                      <Chip
                        label="Pending"
                        color="warning"
                        size="small"
                        icon={<RejectIcon />}
                      />
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={expandedRows.has(item.id)} timeout="auto" unmountOnExit>
                      <Box sx={{ margin: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="h6" gutterBottom component="div">
                              Original Data
                            </Typography>
                            <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                              <pre style={{ margin: 0, overflow: 'auto' }}>
                                {JSON.stringify(item.original, null, 2)}
                              </pre>
                            </Paper>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="h6" gutterBottom component="div">
                              Transformed Data
                            </Typography>
                            <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                              <pre style={{ margin: 0, overflow: 'auto' }}>
                                {JSON.stringify(item.transformed, null, 2)}
                              </pre>
                            </Paper>
                          </Grid>
                        </Grid>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
