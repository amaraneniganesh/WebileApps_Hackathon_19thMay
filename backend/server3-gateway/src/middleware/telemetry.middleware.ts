import { Request, Response, NextFunction } from 'express';
import { createLogger, format, transports } from 'winston';
import UAParser from 'ua-parser-js';
import crypto from 'crypto';

export const winstonLogger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()]
});

export interface GatewayTelemetryRequest extends Request {
  traceId?: string;
  clientEnrichedInfo?: { browser: string; os: string };
}

export const gatewayTelemetryEngine = (req: GatewayTelemetryRequest, res: Response, next: NextFunction): void => {
  req.traceId = crypto.randomUUID();
  const parser = new UAParser(req.headers['user-agent']);
  req.clientEnrichedInfo = {
    browser: parser.getBrowser().name || 'Unknown Browser',
    os: parser.getOS().name || 'Unknown OS'
  };
  next();
};