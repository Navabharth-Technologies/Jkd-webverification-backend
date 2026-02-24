const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/dashboard/staff',
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
        console.log('Response Body:');
        try {
            console.log(JSON.stringify(JSON.parse(data), null, 2));
        } catch (e) {
            console.log(data);
        }
    });
});

req.on('error', (error) => {
    console.error(`Error: ${error.message}`);
});

req.end();
