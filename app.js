const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const compression = require('compression');
const limit = require('express-rate-limit');
const logger = require('./utils/logger');
const globalErrorHandler = require('./middlewares/errorMiddleware');
const AppError = require('./utils/AppError');

// Initialize express app
const app = express();

// 1) GLOBAL MIDDLEWARES
// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = limit({
    max: 1000,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Data sanitization against XSS
// Data sanitization against XSS
// app.use(xss()); // Removed due to conflict with req.query getters (Swagger UI crash)

// Prevent parameter pollution
app.use(hpp());

// Compression
app.use(compression());

// CORS
app.use(cors());

// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Test Middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

const authRouter = require('./routes/authRoutes');

// 2) ROUTES
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Auto-UC2 Backend API is running'
    });
});

app.use('/api/v1/auth', authRouter);
const sessionRouter = require('./routes/sessionRoutes');
app.use('/api/v1/sessions', sessionRouter);

const adminRouter = require('./routes/adminRoutes');
app.use('/api/v1/admin', adminRouter);

const managerRouter = require('./routes/managerRoutes');
app.use('/api/v1/manager', managerRouter);

const clientRouter = require('./routes/clientRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/v1/my', clientRouter);
app.use('/api/v1/notifications', notificationRoutes);

const contractRoutes = require('./routes/contractRoutes');
app.use('/api/v1/contracts', contractRoutes);

const guestRouter = require('./routes/guestRoutes');
app.use('/api/v1/public', guestRouter); // /api/v1/public/browse

const commercialRouter = require('./routes/commercialRoutes');
app.use('/api/v1', commercialRouter);

const analyticsRouter = require('./routes/analyticsRoutes');
app.use('/api/v1/analytics', analyticsRouter);

const utilityRouter = require('./routes/utilityRoutes');
app.use('/api/v1/utils', utilityRouter);

const conversationRouter = require('./routes/conversations');
app.use('/api/v1/conversations', conversationRouter);

const uploadRouter = require('./routes/upload');
app.use('/api/v1/upload', uploadRouter);

const aiRouter = require('./routes/aiRoutes');
app.use('/api/v1/ai', aiRouter);



// Note: User requirements listed "GET /dashboard/overview" not "GET /api/v1/dashboard/overview"
// But for consistency we usually prefix /api/v1. 
// "GET /auth/login" (users request) -> we implemented /api/v1/auth/login.
// I will keep the /api/v1 convention but map it cleaner.
// Actually, let's map it to /api/v1 to stay consistent with other routes.
// The user request "GET /dashboard/overview" likely implies relative to API root.
// ... other routes (commented out for now)

// 3) UNHANDLED ROUTES
app.all(/(.*)/, (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 4) GLOBAL ERROR HANDLER
app.use(globalErrorHandler);

module.exports = app;
