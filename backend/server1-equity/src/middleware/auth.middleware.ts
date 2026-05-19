import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback_access';

export const authenticateEquityToken = (req: Request & { user?: { investorId: string } }, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access denied: Bearer handshake verification payload missing.' });
    return;
  }

  jwt.verify(token, ACCESS_SECRET, (err: any, decoded: any) => {
    if (err) {
      res.status(403).json({ error: 'Access prohibited: Invalid execution authentication signature key.' });
      return;
    }
    
    // Attach the decoded user data directly to req
    req.user = decoded as { investorId: string };
    next();
  });
};