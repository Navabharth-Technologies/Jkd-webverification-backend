const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/retailers?isApplication=true&limit=10&offset=0',
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
            console.log(`Data Count: ${json.data ? json.data.length : 0}`);
            if (json.data && json.data.length > 0) {
                console.log("First Record Sample:", JSON.stringify(json.data[0], null, 2));
            } else {
                console.log("No data returned.");
                console.log("Full Response:", data);
            }
        } catch (e) {
            console.log("Error parsing JSON:", e.message);
            console.log("Response:", data);
        }
    });
});

req.on('error', (error) => {
    console.error(`Error: ${error.message}`);
});

req.end();
