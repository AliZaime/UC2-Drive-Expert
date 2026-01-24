const request = require('supertest');
const app = require('../app');
const { createTestUser } = require('./testUtils');

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


describe('Admin Endpoints', () => {
    let superAdminData, adminData;

    beforeEach(async () => {
        // Create SuperAdmin
        superAdminData = await createTestUser('superadmin');
    });

    describe('POST /api/v1/admin/users', () => {
        it('SuperAdmin should be able to create an Admin', async () => {
            const res = await request(app)
                .post('/api/v1/admin/users')
                .set('Authorization', `Bearer ${superAdminData.token}`)
                .send({
                    name: 'New Admin',
                    email: `admin.${Date.now()}@test.com`,
                    password: 'password123',
                    confirmPassword: 'password123',
                    role: 'admin'
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body.data.user.role).toEqual('admin');
        });

        it('SuperAdmin should be able to create a Manager', async () => {
             const res = await request(app)
                .post('/api/v1/admin/users')
                .set('Authorization', `Bearer ${superAdminData.token}`)
                .send({
                    name: 'New Manager',
                    email: `manager.${Date.now()}@test.com`,
                    password: 'password123',
                    confirmPassword: 'password123',
                    role: 'manager'
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body.data.user.role).toEqual('manager');
        });
    });

    describe('GET /api/v1/admin/users', () => {
         it('SuperAdmin should list users', async () => {
            const res = await request(app)
                .get('/api/v1/admin/users')
                .set('Authorization', `Bearer ${superAdminData.token}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.results).toBeGreaterThanOrEqual(1); // At least the superadmin
        });
        
         it('Regular user should fail to access admin routes', async () => {
            const userData = await createTestUser('user'); 
            const res = await request(app)
                .get('/api/v1/admin/users')
                .set('Authorization', `Bearer ${userData.token}`);

            expect(res.statusCode).toEqual(403);
        });
    });
});
