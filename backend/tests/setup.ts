// Set test environment variables before any module loads
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-jest';
process.env.JWT_EXPIRES_IN = '1d';
// Tests connect to a real DB — ensure DATABASE_URL is set in .env.test
// or fall back to the default .env
