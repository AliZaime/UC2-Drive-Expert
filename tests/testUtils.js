const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

const Client = require('../models/Client');

exports.createTestUser = async (role = 'user', agencyId = null) => {
    const user = await User.create({
        name: `Test ${role}`,
        email: `${role}.${Date.now()}@test.com`,
        password: 'password123',
        confirmPassword: 'password123',
        role: role,
        agency: agencyId
    });
    
    // Create Client profile for 'user' role
    if (role === 'user') {
        await Client.create({
            user: user._id,
            firstName: 'Test',
            lastName: 'Client',
            email: user.email,
            phone: '0600000000'
        });
    }
    
    const token = signToken(user._id);
    return { user, token };
};

exports.mockVehicleData = {
    vin: 'VF1TESTVIN123456',
    make: 'Dacia',
    model: 'Logan',
    year: 2022,
    mileage: 22000,
    fuelType: 'Diesel',
    transmission: 'Manual',
    price: 135000,
    status: 'available',
    condition: 'Excellent'
};
