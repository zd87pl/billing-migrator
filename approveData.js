const readline = require('readline');
const fs = require('fs');

async function approveData(mappedData) {
    const approvedData = [];

    for (const entry of mappedData) {
        console.log('Original:', entry.original);
        console.log('Transformed:', entry.transformed);

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const answer = await new Promise((resolve) => {
            rl.question('Approve this entry? (yes/no): ', resolve);
        });

        rl.close();

        if (answer.toLowerCase() === 'yes') {
            approvedData.push(entry.transformed);
        }
    }

    fs.writeFileSync('approved_data.json', JSON.stringify(approvedData, null, 2));
    console.log('Data approved.');
    return approvedData;
}

module.exports = approveData;