import { Response, NextFunction } from 'express';
import { AuthenticatedGatewayRequest } from './auth.middleware';

export const checkAccessRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedGatewayRequest, res: Response, next: NextFunction): void => {
    if (!req.userContext) {
      res.status(401).json({ error: 'RBAC Evaluation Exception: Context is unauthenticated.' });
      return;
    }
    const authorized = req.userContext.roles.some(role => allowedRoles.includes(role));
    if (!authorized) {
      res.status(403).json({ error: `RBAC Restriction: Operations require one of [${allowedRoles.join(', ')}].` });
      return;
    }
    next();
  };
};