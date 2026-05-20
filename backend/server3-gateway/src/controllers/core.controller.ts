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
const JWT_SECRET = 'gateway_core_secret_intelligence_vector';

export const unifiedGatewayRegister = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("📥 [GATEWAY] RECEIVED DATA CONTEXT:", req.body);

    // Normalize incoming property permutations (camelCase + snake_case)
    const fullName = req.body.fullName || req.body.full_name;
    const email = req.body.email;
    const password = req.body.password;
    const panNumber = req.body.panNumber || req.body.pan_number;
    const equityId = req.body.equityId || req.body.equity_id || req.body.investorId || req.body.investor_id;
    const dematAccount = req.body.dematAccount || req.body.demat_account;
    const mfRef = req.body.mfRef || req.body.mf_ref || req.body.customerRef || req.body.customer_ref;
    const folioNumber = req.body.folioNumber || req.body.folio_number;

    // Rigid check gate matching fields to error tracking logs
    if (!fullName || !email || !password || !panNumber || !equityId || !dematAccount || !mfRef || !folioNumber) {
      console.error("❌ ENTRY VALIDATION REJECTED ON GATEWAY LAYER.");
      console.table({
        fullName: { value: fullName || "MISSING", status: !!fullName },
        email: { value: email || "MISSING", status: !!email },
        password: { value: password ? "[SECURED]" : "MISSING", status: !!password },
        panNumber: { value: panNumber || "MISSING", status: !!panNumber },
        equityId: { value: equityId || "MISSING", status: !!equityId },
        dematAccount: { value: dematAccount || "MISSING", status: !!dematAccount },
        mfRef: { value: mfRef || "MISSING", status: !!mfRef },
        folioNumber: { value: folioNumber || "MISSING", status: !!folioNumber }
      });

      res.status(400).json({ 
        error: 'Missing baseline enrollment registration attributes.',
        debugVerificationMatrix: {
          fullName: !!fullName, email: !!email, password: !!password, panNumber: !!panNumber,
          equityId: !!equityId, dematAccount: !!dematAccount, mfRef: !!mfRef, folioNumber: !!folioNumber
        }
      });
      return;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const generatedUserId = await CoreModel.executeComprehensiveRegistration({
      fullName: String(fullName).trim(),
      email: String(email).trim().toLowerCase(),
      passwordHash,
      panNumber: String(panNumber).trim().toUpperCase(),
      equityId: String(equityId).trim(),
      dematAccount: String(dematAccount).trim().toUpperCase(),
      mfRef: String(mfRef).trim(),
      folioNumber: String(folioNumber).trim().toUpperCase()
    });

    res.status(201).json({
      status: 'SUCCESS',
      message: 'Comprehensive master profile data seeded into all 3 tables seamlessly.',
      userId: generatedUserId
    });
  } catch (error: any) {
    console.error("❌ TRANSACTION ENGINE ARTIFACT ERROR:", error);
    res.status(500).json({ error: 'Database enrollment transaction failed.', details: error.message });
  }
};

export const unifiedGatewayLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    const userQuery = `
      SELECT u.*, r.role_id 
      FROM public.platform_users u
      JOIN public.platform_user_roles r ON u.user_id = r.user_id
      WHERE u.email = $1 AND u.is_active = true
    `;
    const resUser = await pool.query(userQuery, [email]);
    if (resUser.rows.length === 0) {
      res.status(401).json({ error: 'Invalid identification parameters or deactivated profile.' });
      return;
    }

    const matchedUser = resUser.rows[0];
    const passMatch = await bcrypt.compare(password, matchedUser.password_hash);
    if (!passMatch) {
      res.status(401).json({ error: 'Authentication challenge signature failed.' });
      return;
    }

    const token = jwt.sign(
      { userId: matchedUser.user_id, email: matchedUser.email, roles: [matchedUser.role_id] },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(200).json({
      status: 'SUCCESS',
      token,
      profile: { name: matchedUser.full_name, email: matchedUser.email, roles: [matchedUser.role_id], userId: matchedUser.user_id }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal login fault.', details: error.message });
  }
};

export const gatewayLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Identification email and authentication security password are mandatory.' });
      return;
    }

    // 1. Locate the master profile tracking entry by email address
    const user = await CoreModel.findPlatformUserByEmail(email.trim().toLowerCase());
    if (!user) { 
      console.error(`❌ LOGIN DENIED: Profile not found for target [${email}]`);
      res.status(401).json({ error: 'Invalid platform credential mappings.' }); 
      return; 
    }

    // 2. Perform Uniform Password Verification Gate
    let matches = false;

    // Retain backdoor presentation seed access vector for hardcoded test account
    if (email.trim().toLowerCase() === 'admin@wealthplatform.com' && password === 'password123') {
      matches = true;
    } else {
      // Validate across generated password hash keys for newly registered staff/viewers cleanly
      matches = await bcrypt.compare(password, user.password_hash);
    }

    if (!matches) { 
      console.error(`❌ LOGIN DENIED: Password challenge failed for target [${email}]`);
      res.status(401).json({ error: 'Authentication signature rejected.' }); 
      return; 
    }

    // 3. Generate Authorized RBAC Bearer Payload Token Configuration
    const token = jwt.sign(
      { 
        userId: user.user_id, 
        email: user.email, 
        roles: user.roles // Ensure this contains an array string structure matching frontend sidenav template paths
      }, 
      ENV.JWT_GATEWAY_SECRET || 'gateway_core_secret_intelligence_vector', 
      { expiresIn: '8h' }
    );

    console.log(`🚀 AUTHENTICATION SUCCESS: Token issued for node [${user.full_name}] carrying roles [${user.roles.join(', ')}]`);

    res.status(200).json({ 
      status: 'SUCCESS', 
      token, 
      profile: { 
        name: user.full_name, 
        email: user.email, 
        roles: user.roles, 
        userId: user.user_id 
      } 
    });
  } catch (error: any) { 
    console.error("❌ INTERNAL PLATFORM LOGIN ROUTER ERROR:", error);
    res.status(500).json({ error: 'Internal login fault processing session challenge.', details: error.message }); 
  }
};

export const adminFetchUserRegistry = async (req: any, res: Response): Promise<void> => {
  try {
    const userRegistry = await CoreModel.getAdministrativeUserRegistry();
    res.status(200).json({ status: 'SUCCESS', data: userRegistry });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch tracking metrics.', details: error.message });
  }
};

export const adminProvisionCorporateStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, password, assignedRole } = req.body;

    // Strict baseline check for internal staff provisioning requirements
    if (!fullName || !email || !password || !assignedRole) {
      res.status(400).json({ 
        error: 'Missing parameters.',
        details: 'Full name, corporate email, password, and workgroup role are explicitly mandatory.' 
      });
      return;
    }

    if (!['OPS', 'RM'].includes(assignedRole)) {
      res.status(400).json({ error: 'RBAC Boundary Violation: This endpoint can only deploy OPS or RM staff components.' });
      return;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newStaffUuid = await CoreModel.executeIsolatedStaffProvisioning({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      assignedRole
    });

    console.log(`🚀 ADMIN SEEDED STAFF NODE: Created [${assignedRole}] with ID [${newStaffUuid}] scoped to Properties only.`);

    res.status(201).json({
      status: 'SUCCESS',
      message: 'Isolated corporate staff node provisioned flawlessly into user clusters.',
      staffId: newStaffUuid,
      role: assignedRole
    });
  } catch (error: any) {
    console.error("❌ STAFF PROVISIONING SCRIPT CRASHED:", error);
    res.status(500).json({ error: 'Isolated staff account creation failed.', details: error.message });
  }
};

export const adminToggleUserLifecycle = async (req: any, res: Response): Promise<void> => {
  try {
    const { targetUserId, isEnabled } = req.body;
    await CoreModel.modifyUserLifecycleState(targetUserId, isEnabled);
    res.status(200).json({ status: 'SUCCESS', message: 'Account status toggled successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Toggle adjustment execution error.', details: error.message });
  }
};

const getDownstreamEquityToken = async (equityId: string): Promise<string> => {
  const eqLogin = await axios.post(`${ENV.EQUITY_SERVICE_URL}/auth/login`, { 
    investorId: equityId, 
    password: 'password123' 
  }, { timeout: 2000 });
  return eqLogin.data.accessToken;
};

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

export const getMyAllocatedInvestors = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const opsId = req.userContext?.userId;
    const roles = req.userContext?.roles || [];

    if (!opsId || !roles.includes('OPS')) {
      res.status(403).json({ error: 'RBAC Access Denied: Requires active OPS session.' });
      return;
    }
    const assignedClients = await CoreModel.getInvestorsAssignedToOps(opsId);
    res.status(200).json({ status: 'SUCCESS', data: assignedClients });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve allocated client list.', details: error.message });
  }
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

export const getAggregatedMultiAssetPortfolio = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const requesterRoles = req.userContext!.roles;
    const requesterId = req.userContext!.userId;
    
    let targetUserId = req.query.userId as string || requesterId;
    let explicitPanLookup = req.params.panNumber as string || null;

    if (explicitPanLookup && requesterRoles.some(r => ['ADMIN', 'RM'].includes(r))) {
      const identityByPan = await CoreModel.findInvestorIdentityByPan(explicitPanLookup);
      if (!identityByPan) { res.status(404).json({ error: 'PAN not found in mapping registry.' }); return; }
      targetUserId = identityByPan.user_id;
    }

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
    if (!identity) { res.status(404).json({ error: 'No active identity profile mapped.' }); return; }

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

export const getRmLookupMetadata = async (req: Request, res: Response): Promise<void> => {
  try {
    const investors = await CoreModel.getAllActiveInvestorsList();
    const opsStaff = await CoreModel.getAllActiveOpsStaffList();
    res.status(200).json({ status: 'SUCCESS', data: { investors, opsStaff } });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to extract lookup data fields.', details: error.message });
  }
};

export const getRmAssignmentsLedger = async (req: Request, res: Response): Promise<void> => {
  try {
    const ledger = await CoreModel.getMasterPlatformAssignmentsLedger();
    res.status(200).json({ status: 'SUCCESS', data: ledger });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to compile relational map matrix.', details: error.message });
  }
};