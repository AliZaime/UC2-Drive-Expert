const Vehicle = require('../models/Vehicle');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const APIFeatures = require('../utils/apiFeatures');
const upload = require('../utils/cloudinary'); // Import Multer Cloudinary

// Helper class for filtering/sorting/pagination (simplified here, usually in utils)
class APIFeaturesHelper {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }
    
    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el]);

        // Advanced filtering (gte, etc.) can be added here
        
        this.query = this.query.find(queryObj);
        return this;
    }
    
    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt');
        }
        return this;
    }
    
    paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;
        
        this.query = this.query.skip(skip).limit(limit);
        return this;
    }
}

exports.getAllVehicles = catchAsync(async (req, res, next) => {
    // Agency scoped if not admin?
    // "GET /vehicles # Véhicules de l'agence"
    
    let filter = {};
    // If user belongs to an agency, filter by it (assuming user model has agency ref, which we didn't add yet explicitly but implied)
    // For now, allow filtering by agencyId query param or show all
    
    const features = new APIFeaturesHelper(Vehicle.find(filter), req.query)
        .filter()
        .sort()
        .paginate();
        
    const vehicles = await features.query.populate('agency', 'name address phone email');
    
    res.status(200).json({
        status: 'success',
        results: vehicles.length,
        data: { vehicles }
    });
});

exports.getVehicle = catchAsync(async (req, res, next) => {
    const vehicle = await Vehicle.findById(req.params.id).populate('agency', 'name address phone email');
    
    if (!vehicle) {
        return next(new AppError('No vehicle found with that ID', 404));
    }
    
    res.status(200).json({
        status: 'success',
        data: { vehicle }
    });
});

exports.createVehicle = catchAsync(async (req, res, next) => {
    // Automatically assign the agency of the logged-in user/manager
    if (req.user && req.user.agency) {
        req.body.agency = req.user.agency;
    } else if (!req.body.agency) {
        return next(new AppError('Agency is required. User must be assigned to an agency.', 400));
    }
    
    const newVehicle = await Vehicle.create(req.body);
    
    res.status(201).json({
        status: 'success',
        data: { vehicle: newVehicle }
    });
});

exports.updateVehicle = catchAsync(async (req, res, next) => {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    
    if (!vehicle) {
        return next(new AppError('No vehicle found with that ID', 404));
    }
    
    res.status(200).json({
        status: 'success',
        data: { vehicle }
    });
});

exports.deleteVehicle = catchAsync(async (req, res, next) => {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    
    if (!vehicle) {
        return next(new AppError('No vehicle found with that ID', 404));
    }
    
    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Actions


// 1) Middleware to handle file parsing (Added to route definition instead)
exports.uploadPhotosMiddleware = upload.array('photos', 5); // Max 5 photos

exports.uploadVehiclePhotos = catchAsync(async (req, res, next) => {
    // req.files is populated by the middleware
    console.log("UPLOAD DEBUG - req.files:", req.files);
    
    if (!req.files || req.files.length === 0) {
        return next(new AppError('No photos uploaded', 400));
    }

    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return next(new AppError('No vehicle found', 404));
    
    console.log("UPLOAD DEBUG - Found Vehicle:", vehicle._id);

    // Extract Cloudinary URLs
    const photoUrls = req.files.map(file => file.path);
    console.log("UPLOAD DEBUG - Photo URLs:", photoUrls);

    // Push to vehicle images array
    if (!vehicle.images) vehicle.images = []; // Safety check
    vehicle.images.push(...photoUrls);
    
    try {
        await vehicle.save();
        console.log("UPLOAD DEBUG - Save Success");
    } catch (saveError) {
        console.error("UPLOAD DEBUG - Save Error:", saveError);
        return next(new AppError('Database Save Failed: ' + saveError.message, 500));
    }

    res.status(200).json({ 
        status: 'success', 
        message: 'Photos uploaded successfully',
        data: { images: photoUrls } 
    });
});

exports.valueVehicle = catchAsync(async (req, res, next) => {
    // Call AI Valuation Service
    // Placeholder
    const valuation = {
        model: 'Estimated',
        minPrice: 15000,
        maxPrice: 17000,
        confidence: 0.85
    };
    
    res.status(200).json({ status: 'success', data: { valuation } });
});

exports.searchVehicles = catchAsync(async (req, res, next) => {
    const { query } = req.query;
    
    if (!query) {
        return next(new AppError('Search query is required', 400));
    }
    
    // Search by VIN, make (brand), or model
    const searchRegex = new RegExp(query, 'i'); // Case-insensitive search
    
    const vehicles = await Vehicle.find({
        $or: [
            { vin: searchRegex },
            { make: searchRegex },
            { model: searchRegex }
        ]
    }).limit(50);
    
    res.status(200).json({
        status: 'success',
        results: vehicles.length,
        data: { vehicles }
    });
});
