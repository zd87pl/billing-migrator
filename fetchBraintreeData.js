const braintree = require('braintree');
const fs = require('fs');

const gateway = new braintree.BraintreeGateway({
    environment: process.env.BRAINTREE_ENVIRONMENT === 'production' 
        ? braintree.Environment.Production 
        : braintree.Environment.Sandbox,
    merchantId: process.env.BRAINTREE_MERCHANT_ID || 'your_merchant_id',
    publicKey: process.env.BRAINTREE_PUBLIC_KEY || 'your_public_key',
    privateKey: process.env.BRAINTREE_PRIVATE_KEY || 'your_private_key'
});

async function fetchBraintreeData(dataType) {
    const items = [];
    
    switch (dataType) {
        case 'customers':
            await gateway.customer.search((search) => {
                search.id().exists();
            }).on('data', (customer) => {
                items.push(customer);
            });
            break;

        case 'transactions':
            await gateway.transaction.search((search) => {
                search.id().exists();
            }).on('data', (transaction) => {
                items.push(transaction);
            });
            break;

        case 'subscriptions':
            await gateway.subscription.search((search) => {
                search.id().exists();
            }).on('data', (subscription) => {
                items.push(subscription);
            });
            break;

        case 'plans':
            const plansResponse = await gateway.plan.all();
            items.push(...plansResponse.plans);
            break;

        default:
            throw new Error(`Unsupported data type: ${dataType}`);
    }

    // Save fetched data to file
    fs.writeFileSync(`braintree_${dataType}.json`, JSON.stringify(items, null, 2));
    console.log(`Fetched ${items.length} ${dataType}.`);
    return items;
}

module.exports = fetchBraintreeData;
