const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Mock Environment Variables
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRE = '90d';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_REFRESH_EXPIRE = '90d';
process.env.JWT_COOKIE_EXPIRES_IN = '90';

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany();
    }
});
