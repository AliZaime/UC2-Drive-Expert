const request = require('supertest');
const app = require('../app');
const Agency = require('../models/Agency');
const Vehicle = require('../models/Vehicle');
const { createTestUser, mockVehicleData } = require('./testUtils');

// Mock Otplib to avoid ESM syntax errors
jest.mock('otplib', () => ({
    authenticator: {
        generateSecret: jest.fn(() => 'mock_secret'),
        keyuri: jest.fn(() => 'mock_otp_url'),
        check: jest.fn(() => true)
    }
}));

// Mock Cloudinary (Multer instance)
jest.mock('../utils/cloudinary', () => ({
  array: jest.fn(() => (req, res, next) => next()),
  single: jest.fn(() => (req, res, next) => next())
}));

describe('Vehicle Endpoints', () => {
    let managerData, clientData, agency;

    beforeEach(async () => {
        // Create an Agency first
        agency = await Agency.create({
            name: 'Test Agency',
            email: 'agency@test.com',
            phone: '0600000000',
            address: { city: 'Casablanca' }
        });

        // Create Manager (linked to Agency)
        managerData = await createTestUser('manager', agency._id);
        
        // Create Client
        clientData = await createTestUser('user');
    });

    describe('POST /api/v1/vehicles', () => {
        it('Manager should create a vehicle successfully', async () => {
            const res = await request(app)
                .post('/api/v1/vehicles')
                .set('Authorization', `Bearer ${managerData.token}`)
                .send({
                    ...mockVehicleData,
                    agency: agency._id
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body.data.vehicle).toHaveProperty('vin', mockVehicleData.vin);
        });

        it('Client should NOT be able to create a vehicle', async () => {
            const res = await request(app)
                .post('/api/v1/vehicles')
                .set('Authorization', `Bearer ${clientData.token}`)
                .send(mockVehicleData);

            // Expect 403 Forbidden (RBAC)
            expect(res.statusCode).toEqual(403);
        });
    });

    describe('GET /api/v1/public/browse', () => {
        beforeEach(async () => {
            await Vehicle.create({ ...mockVehicleData, agency: agency._id });
        });

        it('Guest should fail if no query params? (Depends on logic)', async () => {
            // Testing browse endpoint
            const res = await request(app).get('/api/v1/public/browse');
            expect(res.statusCode).toBeOneOf([200, 400]); 
        });
        
        it('Guest should select vehicles', async () => {
             const res = await request(app).get('/api/v1/public/browse');
             expect(res.statusCode).toEqual(200);
             expect(res.body.results).toBeGreaterThanOrEqual(1);
        });
    });
});

// Jest helper
expect.extend({
  toBeOneOf(received, validValues) {
    const pass = validValues.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${validValues}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${validValues}`,
        pass: false,
      };
    }
  },
});
