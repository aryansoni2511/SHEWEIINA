import { checkDatabaseConnection } from '../config/db.js';

export async function getHealthStatus() {
  const dbHealth = await checkDatabaseConnection();
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    service: 'Shewwina Backend API',
    status: isProduction && !dbHealth.connected ? 'DEGRADED' : 'UP',
    database: dbHealth,
    environment: process.env.NODE_ENV || 'development',
  };
}
