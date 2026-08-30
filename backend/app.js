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

// CORS Configuration
const allowedOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173'] : '*';

app.use(cors({
  origin: allowedOrigins,
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
