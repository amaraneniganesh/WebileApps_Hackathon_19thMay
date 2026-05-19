import { Pool } from 'pg';
import dotenv from 'dotenv';
import { URL } from 'url';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('CRITICAL CONFIGURATION ERROR: DATABASE_URL is missing inside the environmental vectors.');
}

// Parse the connection string programmatically to extract raw host credentials
const dbUrl = new URL(process.env.DATABASE_URL);
const [username, password] = dbUrl.pathname ? dbUrl.username + ':' + dbUrl.password : [dbUrl.username, dbUrl.password];

export const pool = new Pool({
  user: dbUrl.username,
  password: decodeURIComponent(dbUrl.password),
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port || '5432', 10),
  database: dbUrl.pathname.split('/')[1],
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  // This explicitly overrides pg-connection-string parsing issues and forces compliance
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('UNEXPECTED SUPABASE CONNECTION POOL ERROR:', err);
});