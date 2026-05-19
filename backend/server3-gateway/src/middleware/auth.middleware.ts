import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { GatewayTelemetryRequest } from './telemetry.middleware';

export interface AuthenticatedGatewayRequest extends GatewayTelemetryRequest {
  userContext?: { userId: string; email: string; roles: string[] };
}

export const verifyGatewaySession = (req: AuthenticatedGatewayRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Access Denied: Missing operational session bearer handshakes.' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ENV.JWT_GATEWAY_SECRET) as any;
    req.userContext = {
      userId: decoded.userId,
      email: decoded.email,
      roles: decoded.roles
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Access Denied: Expired or corrupt platform session matrix.' });
  }
};