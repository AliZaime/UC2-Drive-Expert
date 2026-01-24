const request = require('supertest');
const app = require('../app');
const Agency = require('../models/Agency');
const Vehicle = require('../models/Vehicle');
const Negotiation = require('../models/Negotiation');
const Client = require('../models/Client');
const { createTestUser, mockVehicleData } = require('./testUtils');

// Mock Otplib to avoid ESM syntax errors
jest.mock('otplib', () => ({
    authenticator: {
        generateSecret: jest.fn(() => 'mock_secret'),
        keyuri: jest.fn(() => 'mock_otp_url'),
        check: jest.fn(() => true)
    }
}));

// Mock Cloudinary (Multer instance) to avoid load-time errors
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

describe('Negotiation Endpoints', () => {
    let agency, managerData, clientData, agentData, vehicle;

    beforeEach(async () => {
        // 1. Setup Agency & Manager
        agency = await Agency.create({
            name: 'Nego Agency',
            email: 'nego@agency.com',
            phone: '0666666666',
            address: { city: 'Rabat' }
        });
        managerData = await createTestUser('manager', agency._id);

        // 2. Setup Agent (Employee)
        agentData = await createTestUser('user', agency._id); // Agents have role 'user' but are employees

        // 3. Setup Client
        clientData = await createTestUser('user'); // Clients also have role 'user' but no agency link (usually)
        // Adjust Client role to be distinct? The requirement says 'client' = 'user'.
        // For 'agent', they are users belonging to an agency.

        // 4. Create Vehicle
        vehicle = await Vehicle.create({
            ...mockVehicleData,
            agency: agency._id,
            vin: 'VIN_NEGO_' + Date.now()
        });
    });

    describe('POST /api/v1/my/negotiations/start', () => {
        it('Client should be able to start a negotiation', async () => {
            const res = await request(app)
                .post('/api/v1/my/negotiations/start')
                .set('Authorization', `Bearer ${clientData.token}`)
                .send({
                    vehicleId: vehicle._id,
                    agencyId: agency._id,
                    initialMessage: 'I offer 130k DH'
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body.data.negotiation).toHaveProperty('client');
        });
    });

    describe('Negotiation Flow', () => {
        let negotiationId;

        beforeEach(async () => {
            const clientDoc = await Client.findOne({ user: clientData.user._id });
            const nego = await Negotiation.create({
                client: clientDoc._id,
                vehicle: vehicle._id,
                agency: agency._id,
                initialOffer: 130000,
                status: 'open',
                history: []
            });
            negotiationId = nego._id;
        });

        it('Client should be able to get their negotiations', async () => {
            const res = await request(app)
                .get('/api/v1/my/negotiations')
                .set('Authorization', `Bearer ${clientData.token}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.results).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Manager Actions (Negotiation)', () => {
        let negotiationId;

        beforeEach(async () => {
             // Create open negotiation
             const clientDoc = await require('../models/Client').findOne({ user: clientData.user._id });
             const nego = await Negotiation.create({
                client: clientDoc._id,
                vehicle: vehicle._id,
                agency: agency._id,
                initialOffer: 130000,
                status: 'discussion',
                history: []
            });
            negotiationId = nego._id;
        });

        it('Manager should reply to negotiation', async () => {
            const res = await request(app)
                .post(`/api/v1/negotiations/${negotiationId}/messages`)
                .set('Authorization', `Bearer ${managerData.token}`)
                .send({
                    content: 'We can accept 132k'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.data.negotiation.messages).toHaveLength(1);
        });

        it('Manager should make an offer', async () => {
            const res = await request(app)
                .post(`/api/v1/negotiations/${negotiationId}/offer`)
                .set('Authorization', `Bearer ${managerData.token}`)
                .send({
                    amount: 132000,
                    terms: 'Valid for 48h'
                });
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.negotiation.currentOffer).toBe(132000);
        });
    });
});
