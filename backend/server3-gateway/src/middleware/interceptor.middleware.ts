import { Response, NextFunction } from 'express';
import { AuthenticatedGatewayRequest } from './auth.middleware';
import { pool } from '../config/db';
import { winstonLogger } from './telemetry.middleware';

export const auditInterceptor = async (req: AuthenticatedGatewayRequest, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const originalJson = res.json;

  res.json = function (body) {
    const duration = Date.now() - startTime;
    res.json = originalJson;

    pool.query(
      `INSERT INTO public.audit_logs (trace_id, user_id, user_email, user_role, action, http_method, request_path, ip_address, user_agent, browser, os, payload, status_code, execution_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        req.traceId,
        req.userContext?.userId || null,
        req.userContext?.email || 'ANONYMOUS_CLIENT',
        req.userContext?.roles?.join(',') || 'UNASSIGNED',
        `GATEWAY_API_EXECUTION_${req.method}_${req.baseUrl || req.path}`,
        req.method,
        req.originalUrl,
        req.ip || '127.0.0.1',
        req.headers['user-agent'] || 'Unknown Agent',
        req.clientEnrichedInfo?.browser || 'Unknown',
        req.clientEnrichedInfo?.os || 'Unknown',
        req.method !== 'GET' ? JSON.stringify(req.body) : null,
        res.statusCode,
        duration
      ]
    ).catch(err => winstonLogger.error('[AUDIT STRATIFICATION TRAIL DEFEATED]', err));

    return originalJson.call(this, body);
  };

  next();
};