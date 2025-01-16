const openai = require('openai');
const fs = require('fs');

openai.apiKey = process.env.OPENAI_API_KEY || 'your_openai_api_key';

const prompts = {
    customers: (data) => 
        `Analyze the following customer data and assign it to a cohort based on account size, product type, or logical grouping: ${JSON.stringify(data)}. Return a cohort name.`,
    
    transactions: (data) =>
        `Analyze the following transaction data and assign it to a cohort based on transaction size, frequency, or type: ${JSON.stringify(data)}. Return a cohort name.`,
    
    subscriptions: (data) =>
        `Analyze the following subscription data and assign it to a cohort based on plan type, billing frequency, or subscription value: ${JSON.stringify(data)}. Return a cohort name.`,
    
    plans: (data) =>
        `Analyze the following plan data and assign it to a cohort based on pricing tier, features, or target market: ${JSON.stringify(data)}. Return a cohort name.`
};

async function analyzeAndCohort(items, dataType) {
    if (!prompts[dataType]) {
        throw new Error(`Unsupported data type: ${dataType}`);
    }

    const analyzed = [];

    for (const item of items) {
        try {
            const response = await openai.Completion.create({
                model: 'text-davinci-003',
                prompt: prompts[dataType](item),
                max_tokens: 50,
                temperature: 0.7
            });

            const cohort = response.choices[0].text.trim();
            const enrichedItem = { ...item, cohort };
            analyzed.push({
                original: item,
                enriched: enrichedItem
            });
        } catch (error) {
            console.error(`Failed to analyze item: ${item.id}`, error);
            // Continue with next item instead of failing entire batch
            analyzed.push({
                original: item,
                enriched: { ...item, cohort: 'unclassified' }
            });
        }
    }

    fs.writeFileSync(`${dataType}_cohorts.json`, JSON.stringify(analyzed, null, 2));
    console.log(`Cohorts assigned for ${analyzed.length} ${dataType}.`);
    return analyzed;
}

module.exports = analyzeAndCohort;
