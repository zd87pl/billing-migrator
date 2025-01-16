# Billing Migrator

A user-friendly tool for migrating billing data from Braintree to NetSuite with AI-powered data categorization.

## Features

- 🔄 Support for multiple Braintree data types:
  - Customers
  - Transactions
  - Subscriptions
  - Plans
- 🤖 AI-powered data categorization using OpenAI
- 📊 Real-time progress tracking
- ✅ Manual data review and approval workflow
- 📝 Detailed logging and status monitoring
- 🔒 Secure credential management
- 🎯 Data validation and transformation

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- Braintree account and API credentials
- OpenAI API key
- NetSuite account and API credentials

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/billing-migrator.git
cd billing-migrator
```

2. Install dependencies:
```bash
npm run setup
```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your API credentials:
```env
# Server Port
PORT=3000

# Braintree Configuration
BRAINTREE_ENVIRONMENT=sandbox
BRAINTREE_MERCHANT_ID=your_merchant_id
BRAINTREE_PUBLIC_KEY=your_public_key
BRAINTREE_PRIVATE_KEY=your_private_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# NetSuite Configuration
NETSUITE_API_KEY=your_netsuite_api_key
NETSUITE_ENDPOINT=https://rest.netsuite.com/api
```

## Usage

1. Start the development servers:
```bash
npm run dev
```

2. Access the application:
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000

3. Workflow:
   1. Configure API credentials in the Configuration page
   2. Start migration in the Migration page
   3. Review and approve data in the Approval page
   4. Monitor progress in the Status page

## Project Structure

```
billing-migrator/
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── App.tsx        # Main application component
│   │   └── main.tsx       # Application entry point
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
├── server.js              # Express server and WebSocket setup
├── fetchBraintreeData.js  # Braintree data fetching
├── analyzeAndCohort.js    # OpenAI data analysis
├── mapAndTransform.js     # Data transformation
├── writeToNetSuite.js     # NetSuite data upload
├── approveData.js         # Data approval handling
└── package.json           # Project dependencies
```

## API Documentation

### Configuration Endpoints

#### Validate Configuration
- **POST** `/api/config/validate`
- Validates API credentials for Braintree, NetSuite, and OpenAI
- Request Body:
```json
{
  "braintree": {
    "environment": "sandbox",
    "merchantId": "string",
    "publicKey": "string",
    "privateKey": "string"
  },
  "netsuite": {
    "endpoint": "string",
    "apiKey": "string"
  },
  "openai": {
    "apiKey": "string"
  }
}
```

### Migration Endpoints

#### Start Migration
- **POST** `/api/migration/start`
- Initiates data migration process
- Request Body:
```json
{
  "dataType": "customers | transactions | subscriptions | plans",
  "config": {
    "schema": {
      "field": "type"
    }
  }
}
```

#### Get Migration Status
- **GET** `/api/migration/status`
- Returns current migration status and progress
- Response:
```json
{
  "status": "idle | running | complete | error",
  "progress": 0-100,
  "currentStep": "string",
  "data": [],
  "logs": [],
  "approvedItems": []
}
```

#### Approve Items
- **POST** `/api/migration/approve`
- Approves selected items for migration
- Request Body:
```json
{
  "itemIds": ["string"],
  "approved": boolean
}
```

#### Complete Migration
- **POST** `/api/migration/complete`
- Finalizes migration and uploads approved data to NetSuite
- Request Body:
```json
{
  "netsuiteConfig": {
    "endpoint": "string",
    "apiKey": "string"
  }
}
```

### WebSocket Events

The application uses WebSocket for real-time updates:

- **progress**: Migration progress updates
```json
{
  "type": "progress",
  "data": {
    "progress": 0-100,
    "step": "string"
  }
}
```

- **log**: Activity logs
```json
{
  "type": "log",
  "data": {
    "timestamp": "string",
    "message": "string",
    "type": "info | error | success"
  }
}
```

- **error**: Error notifications
```json
{
  "type": "error",
  "data": "string"
}
```

## Development

1. Run in development mode:
```bash
npm run dev
```

2. Build for production:
```bash
npm run build
```

3. Start production server:
```bash
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
