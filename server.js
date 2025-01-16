const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const fetchBraintreeData = require('./fetchBraintreeData');
const analyzeAndCohort = require('./analyzeAndCohort');
const mapAndTransform = require('./mapAndTransform');
const writeToNetSuite = require('./writeToNetSuite');

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend/build')));

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
app.post('/api/config/validate', async (req, res) => {
    const { braintree, netsuite, openai } = req.body;
    try {
        // Test connections here
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

// Serve React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/build/index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
