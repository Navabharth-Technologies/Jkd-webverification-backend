const http = require('http');

async function get(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error("Failed to parse JSON: " + data.substring(0, 100)));
                }
            });
        }).on('error', (err) => reject(err));
    });
}

async function verifyFilterFix() {
    const BASE_URL = 'http://localhost:5000';

    const testCases = [
        {
            name: "Vendor List - Mysuru Filter",
            url: `${BASE_URL}/api/vendors?state=Karnataka&district=Mysuru&town=Mysuru Town`,
            expectedMinCount: 1
        },
        {
            name: "Retailer List - Mysuru Filter",
            url: `${BASE_URL}/api/retailers?state=Karnataka&district=Mysuru&town=Mysuru Town`,
            expectedMinCount: 0
        },
        {
            name: "Dashboard Stats - Mysuru Filter",
            url: `${BASE_URL}/api/dashboard/stats?state=Karnataka&district=Mysuru&town=Mysuru Town`,
            checkStats: true
        }
    ];

    console.log("Starting verification of Region Filter fix...\n");

    for (const test of testCases) {
        try {
            console.log(`Testing: ${test.name}`);
            console.log(`URL: ${test.url}`);

            const json = await get(test.url);

            if (!json.success) {
                console.error(`❌ FAILED: API returned success: false`);
                continue;
            }

            if (test.checkStats) {
                const total = (json.data.vendors.Approved || 0) + (json.data.vendors.Pending || 0) + (json.data.vendors.Rejected || 0) + (json.data.vendors.New || 0);
                console.log(`✅ SUCCESS: Dashboard Stats count = ${total}`);
            } else {
                console.log(`✅ SUCCESS: Found ${json.count} results.`);
                if (test.expectedMinCount > 0 && json.count < test.expectedMinCount) {
                    console.error(`❌ FAILED: Expected at least ${test.expectedMinCount} results, got ${json.count}`);
                }
            }
            console.log("-----------------------------------\n");
        } catch (err) {
            console.error(`❌ ERROR testing ${test.name}:`, err.message);
        }
    }
}

verifyFilterFix();
