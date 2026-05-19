import { Pool } from 'pg';
import { ENV } from './env';
import { URL } from 'url';

if (!ENV.DATABASE_URL) {
  throw new Error('CRITICAL CONFIGURATION ERROR: DATABASE_URL is missing inside the gateway environment.');
}

const dbUrl = new URL(ENV.DATABASE_URL);

export const pool = new Pool({
  user: dbUrl.username,
  password: decodeURIComponent(dbUrl.password),
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port || '5432', 10),
  database: dbUrl.pathname.split('/')[1],
  max: 30,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: {
    rejectUnauthorized: false
  }
});