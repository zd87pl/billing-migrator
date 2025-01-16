const fetchBraintreeData = require('./fetchBraintreeData');
const analyzeAndCohort = require('./analyzeAndCohort');
const mapAndTransform = require('./mapAndTransform');
const approveData = require('./approveData');
const writeToNetSuite = require('./writeToNetSuite');

// Configuration for different Braintree data types
const dataTypeConfigs = {
    customers: {
        schema: {
            entityid: 'string',
            email: 'string',
            currency: 'string',
            balance: 'number',
            cohort: 'string'
        },
        netsuiteEndpoint: '/customers'
    },
    transactions: {
        schema: {
            id: 'string',
            amount: 'number',
            status: 'string',
            type: 'string',
            date: 'string',
            customerId: 'string',
            cohort: 'string'
        },
        netsuiteEndpoint: '/transactions'
    },
    subscriptions: {
        schema: {
            id: 'string',
            planId: 'string',
            status: 'string',
            price: 'number',
            billingPeriod: 'string',
            customerId: 'string',
            cohort: 'string'
        },
        netsuiteEndpoint: '/subscriptions'
    },
    plans: {
        schema: {
            id: 'string',
            name: 'string',
            price: 'number',
            billingFrequency: 'string',
            currency: 'string',
            cohort: 'string'
        },
        netsuiteEndpoint: '/plans'
    }
};

async function main(dataType = 'customers') {
    if (!dataTypeConfigs[dataType]) {
        throw new Error(`Unsupported data type: ${dataType}. Supported types: ${Object.keys(dataTypeConfigs).join(', ')}`);
    }

    const config = dataTypeConfigs[dataType];
    const data = await fetchBraintreeData(dataType);
    const analyzedData = await analyzeAndCohort(data, dataType);
    const mappedData = mapAndTransform(analyzedData, config.schema);
    const approvedData = await approveData(mappedData);

    const netsuiteConfig = {
        endpoint: `https://rest.netsuite.com/api${config.netsuiteEndpoint}`,
        apiKey: process.env.NETSUITE_API_KEY || 'your_netsuite_api_key'
    };

    await writeToNetSuite(approvedData, netsuiteConfig);
}

// Allow data type to be specified via command line
const dataType = process.argv[2] || 'customers';
main(dataType).catch(console.error);
