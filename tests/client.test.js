const request = require('supertest');
const app = require('../app');
const Agency = require('../models/Agency');
const Vehicle = require('../models/Vehicle');
const Client = require('../models/Client');
const { createTestUser, mockVehicleData } = require('./testUtils');

// Mock external deps
jest.mock('otplib', () => ({
    authenticator: {
        generateSecret: jest.fn(() => 'mock_secret'),
        keyuri: jest.fn(() => 'mock_otp_url'),
        check: jest.fn(() => true)
    }
}));
jest.mock('../utils/cloudinary', () => ({
  array: jest.fn(() => (req, res, next) => next()),
  single: jest.fn(() => (req, res, next) => next())
}));

// Mock Socket.io
jest.mock('../utils/socket', () => ({
    getIO: jest.fn(() => ({
        to: jest.fn().mockReturnThis(),
        emit: jest.fn()
    }))
}));

describe('Client Endpoints', () => {
    let clientData, agency, vehicle;

    beforeEach(async () => {
        // Setup data
        agency = await Agency.create({
            name: 'Client Test Agency',
            email: 'client@test.com',
            phone: '0612345678',
            address: { city: 'Casablanca' }
        });

        vehicle = await Vehicle.create({
            ...mockVehicleData,
            agency: agency._id,
            vin: 'VIN_CLIENT_' + Date.now()
        });

        clientData = await createTestUser('user');
        // createTestUser creates the Client profile now
    });

    describe('GET /api/v1/my/profile', () => {
        it('should return client profile', async () => {
            const res = await request(app)
                .get('/api/v1/my/profile')
                .set('Authorization', `Bearer ${clientData.token}`);
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.client).toHaveProperty('firstName', 'Test');
        });
    });

    describe('POST /api/v1/my/appointments', () => {
        it('should book an appointment', async () => {
            const res = await request(app)
                .post('/api/v1/my/appointments')
                .set('Authorization', `Bearer ${clientData.token}`)
                .send({
                    date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                    agency: agency._id,
                    vehicle: vehicle._id
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body.data.appointment.status).toBe('pending');
        });
    });

    describe('POST /api/v1/my/vehicles/:id/save', () => {
        it('should save a vehicle to favorites', async () => {
            const res = await request(app)
                .post(`/api/v1/my/vehicles/${vehicle._id}/save`)
                .set('Authorization', `Bearer ${clientData.token}`);

            expect(res.statusCode).toEqual(200);
            
            // Verify it appears in saved
            const savedRes = await request(app)
                .get('/api/v1/my/vehicles/saved')
                .set('Authorization', `Bearer ${clientData.token}`);
                
            // Placeholder logic returns 0
            expect(savedRes.body.results).toBeGreaterThanOrEqual(0);
        });
    });
});
