import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
} from '@mui/material';
import { CompareArrows } from '@mui/icons-material';

interface TransformedData {
  original: any;
  transformed: any;
}

export default function ApprovalPage() {
  const [data, setData] = useState<TransformedData[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [compareItem, setCompareItem] = useState<TransformedData | null>(null);

  useEffect(() => {
    fetchMigrationData();
  }, []);

  const fetchMigrationData = async () => {
    try {
      const response = await fetch('/api/migration/status');
      const result = await response.json();
      
      if (result.data) {
        setData(result.data);
        // Restore previously approved items
        if (result.approvedItems) {
          setSelectedItems(new Set(result.approvedItems));
        }
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch migration data');
      setLoading(false);
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allIds = data.map(item => item.transformed.id);
      setSelectedItems(new Set(allIds));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleCompare = (item: TransformedData) => {
    setCompareItem(item);
    setCompareDialogOpen(true);
  };

  const handleApproveSelected = async () => {
    try {
      const response = await fetch('/api/migration/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemIds: Array.from(selectedItems),
          approved: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve items');
      }

      // Show success message or update UI
    } catch (err) {
      setError('Failed to approve selected items');
    }
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Review and Approve
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              {selectedItems.size} of {data.length} items selected
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleApproveSelected}
              disabled={selectedItems.size === 0}
            >
              Approve Selected
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedItems.size > 0 && selectedItems.size < data.length}
                      checked={data.length > 0 && selectedItems.size === data.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Cohort</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((item) => (
                  <TableRow
                    key={item.transformed.id}
                    hover
                    selected={selectedItems.has(item.transformed.id)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedItems.has(item.transformed.id)}
                        onChange={() => handleSelectItem(item.transformed.id)}
                      />
                    </TableCell>
                    <TableCell>{item.transformed.id}</TableCell>
                    <TableCell>{item.transformed.type || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={item.transformed.cohort} 
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {selectedItems.has(item.transformed.id) ? (
                        <Chip label="Approved" color="success" size="small" />
                      ) : (
                        <Chip label="Pending" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        startIcon={<CompareArrows />}
                        onClick={() => handleCompare(item)}
                        size="small"
                      >
                        Compare
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog
        open={compareDialogOpen}
        onClose={() => setCompareDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Compare Data</DialogTitle>
        <DialogContent>
          {compareItem && (
            <Box display="flex" gap={2}>
              <Card sx={{ flex: 1 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Original Data
                  </Typography>
                  <pre style={{ overflow: 'auto', maxHeight: '400px' }}>
                    {JSON.stringify(compareItem.original, null, 2)}
                  </pre>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Transformed Data
                  </Typography>
                  <pre style={{ overflow: 'auto', maxHeight: '400px' }}>
                    {JSON.stringify(compareItem.transformed, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompareDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
