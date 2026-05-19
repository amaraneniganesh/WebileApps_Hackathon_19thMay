import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { ENV } from './config/env';
import { redis } from './config/redis';
import { gatewayTelemetryEngine } from './middleware/telemetry.middleware';
import coreRoutes from './routes/core.routes';
import internalRoutes from './routes/internal.routes';
import adminRoutes from './routes/admin.routes';

const app = express();
app.use(express.json());

// Load global trace, analytics, and browser parse interceptor blocks
app.use(gatewayTelemetryEngine);

// Protect server structures via sliding-window rate limit maps stored in Redis
const redisRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minute tracking intervals
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)) as Promise<any>
  }),
  message: { error: 'Abuse protection mechanism activated. API allocation throttled.' }
});
app.use(redisRateLimiter);

// Mount core domain sub-routers
app.use('/api/v1/core', coreRoutes);
app.use('/api/v1/ops', internalRoutes);
app.use('/api/v1/admin', adminRoutes);

app.listen(ENV.PORT, () => {
  console.log(`==================================================================`);
  console.log(`[SERVER 3] Core Platform Gateway active on port: ${ENV.PORT}`);
  console.log(`==================================================================`);
});