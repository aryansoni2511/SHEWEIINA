import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

// ─── STARTUP SECURITY GUARD ──────────────────────────────────────────────────
// Refuse to start if required secrets are not configured.
// This prevents silent insecure operation with fallback/default secrets.
if (!process.env.JWT_SECRET) {
  console.error('=================================================');
  console.error('❌ FATAL: JWT_SECRET is not set in .env');
  console.error('   Generate one with:');
  console.error('   node -e "require(\'crypto\').randomBytes(64).toString(\'hex\')"');
  console.error('   Then add it to your .env file as JWT_SECRET=<value>');
  console.error('=================================================');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 Shewwina API Server Running`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=================================`);
});
