import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5002,
  DATABASE_URL: process.env.DATABASE_URL || '',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_GATEWAY_SECRET: process.env.JWT_GATEWAY_SECRET || 'gateway_secret',
  EQUITY_SERVICE_URL: process.env.EQUITY_SERVICE_URL || 'http://localhost:5000',
  MUTUAL_FUND_SERVICE_URL: process.env.MUTUAL_FUND_SERVICE_URL || 'http://localhost:5001',
  MUTUAL_FUND_API_KEY: process.env.MUTUAL_FUND_API_KEY || '',
  MUTUAL_FUND_HMAC_SECRET: process.env.MUTUAL_FUND_HMAC_SECRET || '',
};