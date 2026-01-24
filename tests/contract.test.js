const request = require('supertest');
const app = require('../app');
const Agency = require('../models/Agency');
const Vehicle = require('../models/Vehicle');
const Negotiation = require('../models/Negotiation');
const Contract = require('../models/Contract');
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

describe('Contract Endpoints', () => {
    let clientData, agency, vehicle, contractId;

    beforeEach(async () => {
        agency = await Agency.create({
            name: 'Contract Agency',
            email: 'contract@agency.com',
            phone: '0688888888',
            address: { city: 'Tangier' }
        });

        vehicle = await Vehicle.create({
            ...mockVehicleData,
            agency: agency._id,
            vin: 'VIN_CONTRACT_' + Date.now()
        });

        clientData = await createTestUser('user');
        const clientDoc = await Client.findOne({ user: clientData.user._id });

        const negotiation = await Negotiation.create({
            client: clientDoc._id,
            vehicle: vehicle._id,
            agency: agency._id,
            initialOffer: 130000,
            status: 'deal_reached',
            finalPrice: 130000
        });

        const contract = await Contract.create({
            negotiation: negotiation._id,
            client: clientDoc._id,
            agency: agency._id,
            vehicle: vehicle._id,
            type: 'Purchase',
            content: 'Standard Contract Terms...',
            status: 'draft',
            finalPrice: 130000
        });
        contractId = contract._id;
    });

    describe('GET /api/v1/my/contracts', () => {
        it('should list my contracts', async () => {
             const res = await request(app)
                .get('/api/v1/my/contracts')
                .set('Authorization', `Bearer ${clientData.token}`);

             expect(res.statusCode).toEqual(200);
             expect(res.body.results).toBeGreaterThanOrEqual(1);
        });
    });

    describe('POST /api/v1/my/contracts/:id/sign', () => {
        it('should sign the contract', async () => {
            const res = await request(app)
                .post(`/api/v1/my/contracts/${contractId}/sign`)
                .set('Authorization', `Bearer ${clientData.token}`)
                .send({
                    signature: 'Base64SignatureHere'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.data.contract.status).toBe('signed');
            expect(res.body.data.contract.signatures.client.signedAt).toBeDefined();
        });
    });
});
