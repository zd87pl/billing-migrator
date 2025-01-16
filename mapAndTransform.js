const fs = require('fs');

// Default value handlers for different field types
const defaultValueHandlers = {
    string: () => '',
    number: () => 0,
    boolean: () => false,
    array: () => [],
    object: () => ({})
};

// Field extractors for different data types
const fieldExtractors = {
    customers: {
        entityid: (item) => item.id,
        email: (item) => item.email,
        currency: (item) => item.currency || 'USD',
        balance: (item) => parseFloat(item.balance) || 0,
        cohort: (item) => item.cohort
    },
    transactions: {
        id: (item) => item.id,
        amount: (item) => parseFloat(item.amount) || 0,
        status: (item) => item.status,
        type: (item) => item.type,
        date: (item) => item.createdAt,
        customerId: (item) => item.customerId,
        cohort: (item) => item.cohort
    },
    subscriptions: {
        id: (item) => item.id,
        planId: (item) => item.planId,
        status: (item) => item.status,
        price: (item) => parseFloat(item.price) || 0,
        billingPeriod: (item) => item.billingPeriod,
        customerId: (item) => item.customerId,
        cohort: (item) => item.cohort
    },
    plans: {
        id: (item) => item.id,
        name: (item) => item.name,
        price: (item) => parseFloat(item.price) || 0,
        billingFrequency: (item) => item.billingFrequency,
        currency: (item) => item.currency || 'USD',
        cohort: (item) => item.cohort
    }
};

function mapAndTransform(data, schema) {
    // Determine data type from the first item's structure
    const dataType = determineDataType(data[0]?.enriched || {});
    const extractors = fieldExtractors[dataType] || {};

    const mappedData = data.map(({ original, enriched }) => {
        const transformed = {};
        
        // Map each field according to schema
        for (const [field, type] of Object.entries(schema)) {
            try {
                if (extractors[field]) {
                    transformed[field] = extractors[field](enriched);
                } else {
                    // Fallback to direct property access
                    transformed[field] = enriched[field] || defaultValueHandlers[type]();
                }
            } catch (error) {
                console.warn(`Failed to transform field ${field}:`, error);
                transformed[field] = defaultValueHandlers[type]();
            }
        }

        return { original, transformed };
    });

    fs.writeFileSync('mapped_data.json', JSON.stringify(mappedData, null, 2));
    console.log('Data mapped to NetSuite schema.');
    return mappedData;
}

// Helper function to determine data type from item structure
function determineDataType(item) {
    if (item.email) return 'customers';
    if (item.amount && item.type) return 'transactions';
    if (item.planId) return 'subscriptions';
    if (item.billingFrequency) return 'plans';
    throw new Error('Unable to determine data type from item structure');
}

module.exports = mapAndTransform;
