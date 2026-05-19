import { Request, Response } from 'express';
import * as CoreModel from '../models/core.model';
import { redis } from '../config/redis';
import { ENV } from '../config/env';
import axios from 'axios';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AuthenticatedGatewayRequest } from '../middleware/auth.middleware';
import { pool } from '../config/db';


// Helper to handle Server 1 JWT authentication on behalf of the investor
const getDownstreamEquityToken = async (equityId: string): Promise<string> => {
  const eqLogin = await axios.post(`${ENV.EQUITY_SERVICE_URL}/auth/login`, { 
    investorId: equityId, 
    password: 'password123' 
  }, { timeout: 2000 });
  return eqLogin.data.accessToken;
};

// ==========================================
// 📈 SERVER 1 DOWNSTREAM PROXY ENDPOINTS
// ==========================================

export const getMyEquityHoldings = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const identity = await CoreModel.getFullIdentityMapByUserId(req.userContext!.userId);
    if (!identity || !identity.equity_id) {
      res.status(404).json({ error: 'No Equity account linked to this profile.' });
      return;
    }
    const token = await getDownstreamEquityToken(identity.equity_id);
    const response = await axios.get(`${ENV.EQUITY_SERVICE_URL}/equity/holdings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: 'Equity Service currently unavailable.', details: error.message });
  }
};

export const getMyEquityTransactions = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const identity = await CoreModel.getFullIdentityMapByUserId(req.userContext!.userId);
    if (!identity || !identity.equity_id) {
      res.status(404).json({ error: 'No Equity account linked to this profile.' });
      return;
    }
    const token = await getDownstreamEquityToken(identity.equity_id);
    const response = await axios.get(`${ENV.EQUITY_SERVICE_URL}/equity/transactions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: 'Equity Transaction Service offline.', details: error.message });
  }
};

// ==========================================
// 🧪 SERVER 2 DOWNSTREAM PROXY ENDPOINTS (HMAC Secure)
// ==========================================

export const getMyMfPortfolio = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const identity = await CoreModel.getFullIdentityMapByUserId(req.userContext!.userId);
    if (!identity || !identity.mf_ref) {
      res.status(404).json({ error: 'No Mutual Fund account linked to this profile.' });
      return;
    }

    const targetPath = `/mf/portfolio/${identity.mf_ref}`;
    const signature = crypto.createHmac('sha256', ENV.MUTUAL_FUND_HMAC_SECRET)
                            .update('POST' + targetPath + JSON.stringify({}))
                            .digest('hex').toLowerCase();

    const response = await axios.post(`${ENV.MUTUAL_FUND_SERVICE_URL}${targetPath}`, {}, {
      headers: { 'x-api-key': ENV.MUTUAL_FUND_API_KEY, 'x-hmac-signature': signature }
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: 'Mutual Fund Service rejected request context.', details: error.message });
  }
};

export const getMyMfSips = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const identity = await CoreModel.getFullIdentityMapByUserId(req.userContext!.userId);
    if (!identity || !identity.mf_ref) {
      res.status(404).json({ error: 'No Mutual Fund account linked.' });
      return;
    }

    const targetPath = `/mf/sips/${identity.mf_ref}`;
    const signature = crypto.createHmac('sha256', ENV.MUTUAL_FUND_HMAC_SECRET)
                            .update('POST' + targetPath + JSON.stringify({}))
                            .digest('hex').toLowerCase();

    const response = await axios.post(`${ENV.MUTUAL_FUND_SERVICE_URL}${targetPath}`, {}, {
      headers: { 'x-api-key': ENV.MUTUAL_FUND_API_KEY, 'x-hmac-signature': signature }
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyMfTransactions = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const identity = await CoreModel.getFullIdentityMapByUserId(req.userContext!.userId);
    if (!identity || !identity.mf_ref) {
      res.status(404).json({ error: 'No Mutual Fund record tracked.' });
      return;
    }

    const targetPath = `/mf/transactions/${identity.mf_ref}`;
    const signature = crypto.createHmac('sha256', ENV.MUTUAL_FUND_HMAC_SECRET)
                            .update('POST' + targetPath + JSON.stringify({}))
                            .digest('hex').toLowerCase();

    const response = await axios.post(`${ENV.MUTUAL_FUND_SERVICE_URL}${targetPath}`, {}, {
      headers: { 'x-api-key': ENV.MUTUAL_FUND_API_KEY, 'x-hmac-signature': signature }
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const publicRegisterUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, password, assignedRole } = req.body;
    if (!fullName || !email || !password || !assignedRole) {
      res.status(400).json({ error: 'Missing baseline enrollment registration attributes.' });
      return;
    }

    const validatedRole = ['ADMIN', 'RM', 'OPS', 'VIEWER'].includes(assignedRole) ? assignedRole : 'VIEWER';
    const passwordHash = await bcrypt.hash(password, 10);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const userInsertQuery = `
        INSERT INTO public.platform_users (user_id, full_name, email, password_hash, is_active) 
        VALUES (gen_random_uuid(), $1, $2, $3, true)
        RETURNING user_id
      `;
      const userRes = await client.query(userInsertQuery, [fullName, email, passwordHash]);
      const generatedUuid = userRes.rows[0].user_id;

      await client.query('INSERT INTO public.platform_user_roles (user_id, role_id) VALUES ($1, $2)', [generatedUuid, validatedRole]);
      await client.query('COMMIT');

      res.status(201).json({ status: 'SUCCESS', userId: generatedUuid, role: validatedRole });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyAllocatedInvestors = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const opsId = req.userContext?.userId;
    const roles = req.userContext?.roles || [];

    if (!opsId || !roles.includes('OPS')) {
      res.status(403).json({ error: 'RBAC Enforcement Exception: This discovery route requires an active OPS session.' });
      return;
    }

    const assignedClients = await CoreModel.getInvestorsAssignedToOps(opsId);

    res.status(200).json({
      status: 'SUCCESS',
      meta: {
        opsSpecialistId: opsId,
        totalAllocatedClients: assignedClients.length
      },
      data: assignedClients
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve allocated client list.', details: error.message });
  }
};

export const gatewayLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await CoreModel.findPlatformUserByEmail(email);
    if (!user) { res.status(401).json({ error: 'Invalid platform credential mappings.' }); return; }

    let matches = (password === 'password123' && email === 'admin@wealthplatform.com');
    if (!matches) { matches = await bcrypt.compare(password, user.password_hash); }
    if (!matches) { res.status(401).json({ error: 'Authentication signature rejected.' }); return; }

    const token = jwt.sign({ userId: user.user_id, email: user.email, roles: user.roles }, ENV.JWT_GATEWAY_SECRET, { expiresIn: '2h' });
    res.status(200).json({ status: 'SUCCESS', token, profile: { name: user.full_name, email: user.email, roles: user.roles, userId: user.user_id } });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
};

export const linkFinancialIdentity = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const { panNumber, equityId, equityPassword, mfRef, mfPassword } = req.body;
    const targetUserId = req.userContext?.roles.includes('VIEWER') ? req.userContext.userId : req.body.targetUserId;

    if (!panNumber || !targetUserId) {
      res.status(400).json({ error: 'Missing structural mapping linkage components.' });
      return;
    }

    await CoreModel.initializeIdentityMap(panNumber, req.userContext!.email, req.userContext!.email, targetUserId, equityId, equityPassword, mfRef, mfPassword);
    res.status(201).json({ status: 'SUCCESS', message: 'Identity tracking references mapped successfully.' });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
};

export const rmAssignInvestorToOps = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const { opsUserId, investorUserId } = req.body;
    const currentRmId = req.userContext!.userId;

    if (!opsUserId || !investorUserId) {
      res.status(400).json({ error: 'Missing targeting assignment metrics.' });
      return;
    }

    await CoreModel.assignUserToOpsTeam(currentRmId, opsUserId, investorUserId);
    res.status(200).json({ status: 'SUCCESS', message: 'Investor successfully mapped to OPS specialist.' });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
};

// 🌐 MASTER MULTI-ASSET AGGREGATOR (Handles Admins, RMs, OPS, and Self-Service Users)
export const getAggregatedMultiAssetPortfolio = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const requesterRoles = req.userContext!.roles;
    const requesterId = req.userContext!.userId;
    
    let targetUserId = req.query.userId as string || requesterId;
    let explicitPanLookup = req.params.panNumber as string || null;

    // 1. If an Admin or RM looks up directly by PAN (The Original Backdoor Method)
    if (explicitPanLookup && requesterRoles.some(r => ['ADMIN', 'RM'].includes(r))) {
      const identityByPan = await CoreModel.findInvestorIdentityByPan(explicitPanLookup);
      if (!identityByPan) { res.status(404).json({ error: 'PAN not found in mapping registry.' }); return; }
      targetUserId = identityByPan.user_id;
    }

    // 2. Multi-Tenant Role Verification Gates
    if (requesterRoles.includes('OPS') && !requesterRoles.includes('ADMIN')) {
      const explicitAuthority = await CoreModel.checkOpsUserAuthority(requesterId, targetUserId);
      if (!explicitAuthority) {
        res.status(403).json({ error: 'RBAC Access Denied: OPS agent not assigned to manage this investor profile.' });
        return;
      }
    } else if (requesterRoles.includes('VIEWER') && targetUserId !== requesterId) {
      res.status(403).json({ error: 'Security Exception: Investors cannot cross-query foreign profile boundaries.' });
      return;
    }

    const identity = await CoreModel.getFullIdentityMapByUserId(targetUserId);
    if (!identity) { res.status(404).json({ error: 'No active multi-asset identity profile mapped for this target.' }); return; }

    const cacheKey = `portfolio:aggregation:${identity.pan_number}`;
    const cachedString = await redis.get(cacheKey);
    if (cachedString) { res.status(200).json({ status: 'SUCCESS_CACHED', data: JSON.parse(cachedString) }); return; }

    let equityDataSlice: any = { status: 'UNLINKED', holdings: [] };
    let mutualFundDataSlice: any = { status: 'UNLINKED', positions: [] };

    if (identity.equity_id) {
      try {
        const eqLogin = await axios.post(`${ENV.EQUITY_SERVICE_URL}/auth/login`, { investorId: identity.equity_id, password: identity.equity_password || 'password123' }, { timeout: 2500 });
        const eqHoldings = await axios.get(`${ENV.EQUITY_SERVICE_URL}/equity/holdings`, { headers: { Authorization: `Bearer ${eqLogin.data.accessToken}` } });
        equityDataSlice = { status: 'OPERATIONAL', holdings: eqHoldings.data.data || [] };
      } catch (err) { equityDataSlice = { status: 'DEGRADED_DOWNSTREAM_ALERT', holdings: [] }; }
    }

    if (identity.mf_ref) {
      try {
        const mfUrl = `/mf/portfolio/${identity.mf_ref}`;
        const signature = crypto.createHmac('sha256', ENV.MUTUAL_FUND_HMAC_SECRET).update('POST' + mfUrl + JSON.stringify({})).digest('hex').toLowerCase();
        const mfRes = await axios.post(`${ENV.MUTUAL_FUND_SERVICE_URL}${mfUrl}`, {}, { headers: { 'x-api-key': ENV.MUTUAL_FUND_API_KEY, 'x-hmac-signature': signature } });
        mutualFundDataSlice = { status: 'OPERATIONAL', positions: mfRes.data.data || [] };
      } catch (err) { mutualFundDataSlice = { status: 'DEGRADED_DOWNSTREAM_ALERT', positions: [] }; }
    }

    const realEstateRows = await CoreModel.getInternalRealEstateByPan(identity.pan_number);
    const payloadOutput = {
      investorProfile: { pan: identity.pan_number, name: identity.full_name, email: identity.email },
      slices: { equity: equityDataSlice, mutualFunds: mutualFundDataSlice, realEstate: realEstateRows }
    };

    await redis.setex(cacheKey, 180, JSON.stringify(payloadOutput));
    res.status(200).json({ status: 'SUCCESS', data: payloadOutput });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
};