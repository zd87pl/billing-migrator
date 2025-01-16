import { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactFlow, { 
  Background, 
  Controls,
  MiniMap,
  Node,
  Edge,
  Position,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Upload as UploadIcon,
  Refresh as RefreshIcon,
  PlayArrow as StartIcon
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import * as XLSX from 'xlsx';

interface SchemaField {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
}

interface TransformationMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
}

export default function TransformationPage() {
  const [sourceData, setSourceData] = useState<any[]>([]);
  const [sourceSchema, setSourceSchema] = useState<SchemaField[]>([]);
  const [targetSchema, setTargetSchema] = useState<SchemaField[]>([]);
  const [mappings, setMappings] = useState<TransformationMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);

  // File upload handling
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    setLoading(true);

    try {
      const file = acceptedFiles[0];
      const data = await readFile(file);
      setSourceData(data);
      
      // Infer schema from data
      const schema = inferSchema(data);
      setSourceSchema(schema);

      // Request AI suggestion for mapping
      await suggestMapping(schema);

      // Set preview data to first item
      if (data.length > 0) {
        setPreviewData(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  // File reading
  const readFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          if (e.target?.result) {
            if (file.name.endsWith('.csv')) {
              // Parse CSV
              const text = e.target.result as string;
              const rows = text.split('\n').map(row => row.split(','));
              const headers = rows[0];
              const data = rows.slice(1).map(row => 
                Object.fromEntries(row.map((cell, i) => [headers[i], cell]))
              );
              resolve(data);
            } else {
              // Parse XLSX
              const data = e.target.result;
              const workbook = XLSX.read(data, { type: 'binary' });
              const sheetName = workbook.SheetNames[0];
              const sheet = workbook.Sheets[sheetName];
              resolve(XLSX.utils.sheet_to_json(sheet));
            }
          }
        } catch (err) {
          reject(new Error('Failed to parse file'));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    });
  };

  // Schema inference
  const inferSchema = (data: any[]): SchemaField[] => {
    if (!data.length) return [];

    const sample = data[0];
    return Object.entries(sample).map(([key, value]) => ({
      name: key,
      type: typeof value,
      required: true
    }));
  };

  // AI mapping suggestion
  const suggestMapping = async (schema: SchemaField[]) => {
    try {
      const response = await fetch('/api/suggest-mapping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ schema })
      });

      if (!response.ok) {
        throw new Error('Failed to get mapping suggestions');
      }

      const suggestions = await response.json();
      setMappings(suggestions.mappings);
      setTargetSchema(suggestions.targetSchema);

      // Update preview with transformed data
      if (sourceData.length > 0) {
        const transformedData = applyMappings(sourceData[0], suggestions.mappings);
        setPreviewData(transformedData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get mapping suggestions');
    }
  };

  // Apply mappings to data
  const applyMappings = (data: any, mappings: TransformationMapping[]): any => {
    const result: any = {};
    mappings.forEach(mapping => {
      const sourceValue = data[mapping.sourceField];
      result[mapping.targetField] = sourceValue;
      // TODO: Apply transformation logic if provided
    });
    return result;
  };

  // Flow chart nodes and edges
  const nodes: Node[] = useMemo(() => {
    const sourceNodes = sourceSchema.map((field, index) => ({
      id: `source-${field.name}`,
      type: 'input',
      data: { label: field.name },
      position: { x: 0, y: index * 60 },
      sourcePosition: Position.Right
    }));

    const targetNodes = targetSchema.map((field, index) => ({
      id: `target-${field.name}`,
      type: 'output',
      data: { label: field.name },
      position: { x: 400, y: index * 60 },
      targetPosition: Position.Left
    }));

    return [...sourceNodes, ...targetNodes];
  }, [sourceSchema, targetSchema]);

  const edges: Edge[] = useMemo(() => 
    mappings.map((mapping) => ({
      id: `${mapping.sourceField}-${mapping.targetField}`,
      source: `source-${mapping.sourceField}`,
      target: `target-${mapping.targetField}`,
      label: mapping.transformation,
      animated: true
    })),
    [mappings]
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Data Transformation
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* File Upload */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box
                {...getRootProps()}
                sx={{
                  border: '2px dashed',
                  borderColor: isDragActive ? 'primary.main' : 'grey.300',
                  borderRadius: 1,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                <input {...getInputProps()} />
                <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {isDragActive ? 
                    'Drop the file here...' : 
                    'Drag & drop a file here, or click to select'
                  }
                </Typography>
                <Typography color="text.secondary">
                  Supported formats: CSV, XLSX
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Schema Visualization */}
        {sourceSchema.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Schema Mapping
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ReactFlowProvider>
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      fitView
                    >
                      <Background />
                      <Controls />
                      <MiniMap />
                    </ReactFlow>
                  </ReactFlowProvider>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Data Preview */}
        {sourceData.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="h6" gutterBottom>
                      Source Data
                    </Typography>
                    <Paper sx={{ height: 400 }}>
                      <Editor
                        height="400px"
                        defaultLanguage="json"
                        value={JSON.stringify(sourceData[0], null, 2)}
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          wordWrap: 'on'
                        }}
                      />
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="h6" gutterBottom>
                      Transformed Preview
                    </Typography>
                    <Paper sx={{ height: 400 }}>
                      {previewData ? (
                        <Editor
                          height="400px"
                          defaultLanguage="json"
                          value={JSON.stringify(previewData, null, 2)}
                          options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            wordWrap: 'on'
                          }}
                        />
                      ) : (
                        <Box 
                          sx={{ 
                            height: '100%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                          }}
                        >
                          <Typography color="text.secondary">
                            No preview available
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Actions */}
        {sourceData.length > 0 && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => suggestMapping(sourceSchema)}
                disabled={loading}
              >
                Refresh Mapping
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={loading ? <CircularProgress size={20} /> : <StartIcon />}
                disabled={loading}
              >
                Start Migration
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
