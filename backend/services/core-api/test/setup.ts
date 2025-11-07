import { config } from 'dotenv';
import { resolve } from 'path';

// Set NODE_ENV for tests if not already set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

// Load environment variables from .env file for tests
const result = config({ path: resolve(__dirname, '../.env') });

if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log(`Environment variables loaded for tests (NODE_ENV=${process.env.NODE_ENV})`);
  // Verify critical variables are present
  const requiredVars = ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'COOKIE_SECRET'];
  const missing = requiredVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  } else {
    console.log('✅ All required environment variables present');
  }
}
