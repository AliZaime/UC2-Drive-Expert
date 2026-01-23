require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const connectDB = require('./config/db');

// Handle Uncaught Exceptions
process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  logger.error(err.stack);
  process.exit(1);
});

const app = require('./app');

// Connect to Database
connectDB();

// Start Server
const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  logger.info(`App running on port ${port}...`);
});

// Initialize Socket.io
const socket = require('./utils/socket');
socket.init(server);

// Handle Unhandled Rejections
process.on('unhandledRejection', err => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
