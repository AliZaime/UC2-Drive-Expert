const http = require('http');
const mongoose = require('mongoose');
const Vehicle = require('./models/Vehicle');
require('dotenv').config();

const API_PORT = 4000;

// Helper for HTTP Request
const makeRequest = (method, path, body, headers = {}) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: API_PORT,
            path: '/api/v1' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (e) => reject(e));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
};

const debug = async () => {
    try {
        console.log('1. Logging in...');
        const loginRes = await makeRequest('POST', '/auth/login', {
            email: 'john@client.com',
            password: 'password123'
        });

        if (loginRes.status !== 200) {
            console.error('Login Failed:', loginRes.data);
            return;
        }

        const token = loginRes.data.token;
        console.log('Login successful.');

        // 2. Get Vehicle from DB
        await mongoose.connect(process.env.MONGO_URI);
        const vehicle = await Vehicle.findOne();
        if (!vehicle) {
            console.error('No vehicles found in DB');
            await mongoose.disconnect();
            return;
        }
        const vehicleId = vehicle._id.toString();
        console.log(`Testing with Vehicle ID: ${vehicleId}`);
        await mongoose.disconnect();

        // 3. Call Save Endpoint
        console.log('3. Calling POST /save...');
        const saveRes = await makeRequest('POST', `/my/vehicles/${vehicleId}/save`, {}, {
            'Authorization': `Bearer ${token}`
        });

        console.log('Response Status:', saveRes.status);
        console.log('Response Data:', JSON.stringify(saveRes.data, null, 2));

    } catch (err) {
        console.error('Script Error:', err);
    }
};

debug();
