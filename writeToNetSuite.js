const axios = require('axios');

async function writeToNetSuite(data, netsuiteConfig) {
    const results = [];

    for (const { transformed } of data) {
        try {
            const response = await axios.post(
                netsuiteConfig.endpoint,
                transformed,
                {
                    headers: {
                        Authorization: `Bearer ${netsuiteConfig.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            results.push({ success: true, data: response.data });
        } catch (error) {
            results.push({ success: false, error: error.message });
        }
    }

    console.log('Data written to NetSuite.');
    return results;
}

module.exports = writeToNetSuite;