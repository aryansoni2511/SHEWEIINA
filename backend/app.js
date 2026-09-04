import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoutes from './routes/healthRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import businessQueueRoutes from './routes/businessQueueRoutes.js';
import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import { requestLogger } from './middleware/logger.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler.js';
import { authRateLimiter, queueJoinRateLimiter, generalRateLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const app = express();

// Production-Ready CORS Configuration
const frontendUrl = process.env.FRONTEND_URL;
let allowedOrigins;

if (process.env.NODE_ENV === 'production') {
  if (frontendUrl) {
    // Support single or comma-separated origins, stripping trailing slashes
    allowedOrigins = frontendUrl
      .split(',')
      .map((url) => url.trim().replace(/\/+$/, ''))
      .filter(Boolean);
  } else {
    // In production, FRONTEND_URL is strictly required; never allow '*'
    allowedOrigins = [];
  }
} else {
  // Development / Test mode
  allowedOrigins = frontendUrl
    ? [frontendUrl.trim().replace(/\/+$/, ''), 'http://localhost:5173', 'http://127.0.0.1:5173']
    : '*';
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, test runners, server-to-server without Origin header)
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins === '*') {
      return callback(null, true);
    }
    const cleanOrigin = origin.replace(/\/+$/, '');
    if (Array.isArray(allowedOrigins) && allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS Policy: Access denied for origin ${origin}.`));
  },
  credentials: true,
}));

// Parsers & Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// API Routes — with route-specific rate limiters
app.use('/api', healthRoutes);
app.use('/api/v1/auth', authRateLimiter, authRoutes);
app.use('/api/v1/customer', generalRateLimiter, customerRoutes);
app.use('/api/v1/queue', generalRateLimiter, queueRoutes);
app.use('/api/v1/business', generalRateLimiter, businessQueueRoutes);

// Fallback & Error Handlers
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
