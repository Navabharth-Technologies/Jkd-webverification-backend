const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    // No query params = All Staff / No Application Filter
    path: '/api/retailers?limit=50&offset=0',
    method: 'GET',
    headers: {
        'ngrok-skip-browser-warning': 'true'
    }
};

const req = http.request(options, (res) => {
    let data = '';

    console.log(`StatusCode: ${res.statusCode}`);

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log(`Total Records: ${json.total}`);

            // Check for specific self-registered user's retailer (from debug_retailers.json)
            // e.g., ShopName "Vinay telecom"
            const found = json.data.find(r => r.ShopName.trim() === 'Vinay telecom');
            if (found) {
                console.log("Found Self-Registered Retailer 'Vinay telecom': YES");
                console.log(JSON.stringify(found, null, 2));
            } else {
                console.log("Found Self-Registered Retailer 'Vinay telecom': NO");
            }

        } catch (e) {
            console.log("Error parsing JSON:", e.message);
        }
    });
});

req.on('error', (error) => {
    console.error(`Error: ${error.message}`);
});

req.end();
