const request = require('supertest');

// MOCK otplib to avoid ESM syntax errors in Jest
jest.mock('otplib', () => {
    return {
        authenticator: {
            generateSecret: jest.fn(() => 'mock_secret'),
            keyuri: jest.fn(() => 'mock_otp_url'),
            check: jest.fn(() => true)
        }
    };
});

// Mock Cloudinary (Multer instance) to avoid load-time errors
jest.mock('../utils/cloudinary', () => ({
  array: jest.fn(() => (req, res, next) => next()),
  single: jest.fn(() => (req, res, next) => next())
}));

const app = require('../app');
const User = require('../models/User');

describe('Auth Endpoints', () => {
    describe('POST /api/v1/auth/register', () => {
        it('should register a new user with default role "user"', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123',
                    confirmPassword: 'password123'
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body.data.user).toHaveProperty('role', 'user');

            // Verify in DB
            const user = await User.findOne({ email: 'test@example.com' });
            expect(user.role).toEqual('user');
        });

        it('should SECURITY CHECK: ignore malicious role assignment (e.g. admin)', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'Hacker User',
                    email: 'hacker@example.com',
                    password: 'password123',
                    confirmPassword: 'password123',
                    role: 'admin' // Attempting privilege escalation
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body.data.user.role).toEqual('user'); // Should stay 'user'

            // Verify in DB
            const user = await User.findOne({ email: 'hacker@example.com' });
            expect(user.role).toEqual('user');
        });

        it('should fail if passwords do not match', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'Bad User',
                    email: 'bad@example.com',
                    password: 'password123',
                    confirmPassword: 'differentpassword'
                });

            expect(res.statusCode).toEqual(400); // Validation error
        });
    });

    describe('POST /api/v1/auth/login', () => {
        beforeEach(async () => {
            // Create a user for login testing
            await User.create({
                name: 'Login User',
                email: 'login@example.com',
                password: 'password123',
                confirmPassword: 'password123',
                role: 'user'
            });
        });

        it('should login successfully with correct credentials', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
        });

        it('should fail login with incorrect password', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'wrongpassword'
                });

            expect(res.statusCode).toEqual(401);
        });
    });
});
