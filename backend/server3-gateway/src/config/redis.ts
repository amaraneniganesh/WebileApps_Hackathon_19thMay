import Redis from 'ioredis';
import { ENV } from './env';

export const redis = new Redis(ENV.REDIS_URL);

redis.on('connect', () => {
  console.log('[REDIS] Distributed Memory Caching Cluster connected successfully.');
});

redis.on('error', (err) => {
  console.error('[REDIS] Memory Cluster Disruption Alert:', err);
});