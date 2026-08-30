import { checkDatabaseConnection } from '../config/db.js';

export async function getHealthStatus() {
  const dbHealth = await checkDatabaseConnection();

  return {
    service: 'Shewwina Backend API',
    status: 'UP',
    database: dbHealth,
    environment: process.env.NODE_ENV || 'development',
  };
}
