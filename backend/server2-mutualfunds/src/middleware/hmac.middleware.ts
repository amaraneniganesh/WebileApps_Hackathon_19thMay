import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const API_KEY = process.env.MUTUAL_FUND_API_KEY || 'fallback_key';
const HMAC_SECRET = process.env.MUTUAL_FUND_HMAC_SECRET || 'fallback_secret';

export const verifyHmacSignature = (req: Request, res: Response, next: NextFunction): void => {
  const incomingApiKey = req.headers['x-api-key'];
  const incomingSignature = req.headers['x-hmac-signature'];

  // 1. Static API Key Validation Guard [cite: 67]
  if (!incomingApiKey || incomingApiKey !== API_KEY) {
    res.status(401).json({ error: 'Access denied: Invalid or missing X-API-KEY header verification.' });
    return;
  }

  // 2. Extract payload buffer to verify data payload structure parameters 
  const requestPayload = JSON.stringify(req.body || {});
  
  // Construct the exact signature data string matching upstream proxy transmissions
  const signatureData = req.method + req.originalUrl + (req.method !== 'GET' ? requestPayload : '');
  
  // 3. Cryptographic Hashing Matrix Calculations [cite: 68]
  const computedSignature = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(signatureData)
    .digest('hex')
    .toLowerCase(); // Force lowercase hex encoding structure

  // Clean trailing artifacts from incoming parameters
  const cleanIncomingSignature = String(incomingSignature || '').trim().toLowerCase();

  // 4. Assert Cryptographic Signature Equality [cite: 68]
  if (!cleanIncomingSignature || cleanIncomingSignature !== computedSignature) {
    res.status(403).json({ 
      error: 'Access Forbidden: Cryptographic signature mismatch. Payload integrity unverified.' 
    });
    return;
  }

  next();
};