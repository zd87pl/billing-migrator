const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');
const llmService = require('./llmService');
const fetchBraintreeData = require('./fetchBraintreeData');
const analyzeAndCohort = require('./analyzeAndCohort');
const mapAndTransform = require('./mapAndTransform');
const writeToNetSuite = require('./writeToNetSuite');

dotenv.config();

// Initialize LLM service with environment config
if (process.env.LLM_PROVIDER) {
  llmService.configure({
    provider: process.env.LLM_PROVIDER,
    apiKey: process.env.OPENAI_API_KEY,
    endpoint: process.env.LLM_ENDPOINT,
    username: process.env.LLM_USERNAME,
    password: process.env.LLM_PASSWORD
  });
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ 
  server,
  path: '/ws'
});

app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Serve static files with proper MIME types
app.use(express.static(path.join(__dirname, 'frontend/dist'), {
  setHeaders: (res, filePath) => {
    // Handle all JavaScript file types
    if (filePath.endsWith('.js') || filePath.endsWith('.mjs') || filePath.endsWith('.jsx')) {
      res.set('Content-Type', 'application/javascript; charset=utf-8');
    }
    // Handle CSS files
    else if (filePath.endsWith('.css')) {
      res.set('Content-Type', 'text/css; charset=utf-8');
    }
    // Handle source maps
    else if (filePath.endsWith('.map')) {
      res.set('Content-Type', 'application/json; charset=utf-8');
    }

    // Set caching headers for production
    if (process.env.NODE_ENV === 'production') {
      res.set('Cache-Control', 'public, max-age=31536000');
    }
  },
  fallthrough: true,
  index: false
}));

// Store migration state
let migrationState = {
    status: 'idle',
    progress: 0,
    currentStep: '',
    logs: [],
    data: null,
    approvedItems: new Set()
};

// Broadcast to all connected clients
function broadcast(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

// Log and broadcast
function log(message, type = 'info') {
    const logEntry = {
        timestamp: new Date().toISOString(),
        message,
        type
    };
    migrationState.logs.push(logEntry);
    broadcast({ type: 'log', data: logEntry });
}

// Update and broadcast progress
function updateProgress(progress, step) {
    migrationState.progress = progress;
    migrationState.currentStep = step;
    broadcast({ 
        type: 'progress', 
        data: { progress, step } 
    });
}

// API Routes
app.post('/api/suggest-mapping', async (req, res) => {
  try {
    const { schema } = req.body;

    // Define NetSuite schema based on record type
    const netsuiteSchema = {
      customer: [
        { name: 'entityId', type: 'string', required: true },
        { name: 'companyName', type: 'string', required: true },
        { name: 'email', type: 'string', required: true },
        { name: 'phone', type: 'string' },
        { name: 'subsidiary', type: 'reference', required: true },
        { name: 'currency', type: 'reference', required: true }
      ],
      transaction: [
        { name: 'tranId', type: 'string', required: true },
        { name: 'customer', type: 'reference', required: true },
        { name: 'tranDate', type: 'date', required: true },
        { name: 'amount', type: 'decimal', required: true },
        { name: 'currency', type: 'reference', required: true },
        { name: 'status', type: 'string', required: true }
      ]
    };

    // Use OpenAI to suggest mappings
    const prompt = `Given the following source schema fields:
${JSON.stringify(schema, null, 2)}

And the following NetSuite schema:
${JSON.stringify(netsuiteSchema, null, 2)}

Suggest field mappings between the source and NetSuite schemas. Consider:
1. Field name similarities
2. Data type compatibility
3. Required fields in NetSuite
4. Common business logic transformations

Provide the response in this JSON format:
{
  "mappings": [
    {
      "sourceField": "source_field_name",
      "targetField": "netsuite_field_name",
      "transformation": "optional transformation logic"
    }
  ]
}`;

    const response = await llmService.createCompletion(prompt);
    const suggestedMappings = JSON.parse(response);

    // Determine target schema based on mappings
    const targetFields = [...new Set(suggestedMappings.mappings.map(m => m.targetField))];
    const targetSchema = targetFields.map(field => {
      const schemaField = [...netsuiteSchema.customer, ...netsuiteSchema.transaction]
        .find(f => f.name === field);
      return schemaField || { name: field, type: 'string' };
    });

    res.json({
      mappings: suggestedMappings.mappings,
      targetSchema
    });
  } catch (error) {
    console.error('Mapping suggestion error:', error);
    res.status(500).json({ 
      error: 'Failed to suggest mappings',
      details: error.message 
    });
  }
});

app.post('/api/config/validate', async (req, res) => {
    const { braintree, netsuite, llm } = req.body;
    try {
        // Test LLM connection
        if (llm) {
            const llmValid = await llmService.validateConfig(llm);
            if (!llmValid) {
                throw new Error('Failed to validate LLM configuration');
            }
            // Update service configuration if validation succeeds
            llmService.configure(llm);
        }

        // TODO: Add Braintree and NetSuite validation

        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.post('/api/migration/start', async (req, res) => {
    const { dataType, config } = req.body;
    
    if (migrationState.status === 'running') {
        return res.status(400).json({ 
            error: 'Migration already in progress' 
        });
    }

    migrationState = {
        status: 'running',
        progress: 0,
        currentStep: 'Initializing',
        logs: [],
        data: null,
        approvedItems: new Set()
    };

    // Start migration process
    try {
        // 1. Fetch Data
        updateProgress(10, 'Fetching data from Braintree');
        const items = await fetchBraintreeData(dataType);
        log(`Fetched ${items.length} ${dataType} from Braintree`);

        // 2. Analyze and Cohort
        updateProgress(30, 'Analyzing and assigning cohorts');
        const analyzed = await analyzeAndCohort(items, dataType);
        log('Cohort analysis complete');

        // 3. Transform
        updateProgress(50, 'Transforming data');
        const transformed = mapAndTransform(analyzed, config.schema);
        log('Data transformation complete');

        migrationState.data = transformed;
        updateProgress(70, 'Ready for approval');
        
        res.json({ success: true });
    } catch (error) {
        log(error.message, 'error');
        migrationState.status = 'error';
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/migration/approve', async (req, res) => {
    const { itemIds, approved } = req.body;
    
    itemIds.forEach(id => {
        if (approved) {
            migrationState.approvedItems.add(id);
        } else {
            migrationState.approvedItems.delete(id);
        }
    });

    broadcast({ 
        type: 'approvals', 
        data: Array.from(migrationState.approvedItems) 
    });
    
    res.json({ success: true });
});

app.post('/api/migration/complete', async (req, res) => {
    if (!migrationState.data) {
        return res.status(400).json({ 
            error: 'No migration in progress' 
        });
    }

    try {
        updateProgress(90, 'Writing to NetSuite');
        
        // Filter approved items
        const approvedData = migrationState.data.filter(
            item => migrationState.approvedItems.has(item.transformed.id)
        );

        await writeToNetSuite(approvedData, req.body.netsuiteConfig);
        
        updateProgress(100, 'Migration complete');
        log('Migration successfully completed');
        
        migrationState.status = 'complete';
        res.json({ success: true });
    } catch (error) {
        log(error.message, 'error');
        migrationState.status = 'error';
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/migration/status', (req, res) => {
    res.json(migrationState);
});

// WebSocket connection handling
wss.on('connection', (ws) => {
    // Send current state to new client
    ws.send(JSON.stringify({ 
        type: 'state', 
        data: migrationState 
    }));

    ws.on('error', console.error);
});

// Health check endpoint for WP Engine
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Serve React app - must be after API routes
app.get('*', (req, res) => {
    // Ensure proper headers for secure connections
    if (req.headers['x-forwarded-proto'] === 'https') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    // Set proper content type for HTML
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
