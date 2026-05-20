import { Response, Request } from 'express';
import { AuthenticatedGatewayRequest } from '../middleware/auth.middleware';
import * as AdminModel from '../models/admin.model';
import * as CoreModel from '../models/core.model';
import { ENV } from '../config/env';
import axios from 'axios';
import crypto from 'crypto';

// 📈 ATOMIC TRANSACTION: Ingest Equity Asset Position with Historical Ledger Logs
export const opsAddEquityAssetWithLog = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const { investorId, stockSymbol, quantity, avgBuyPrice, currentMarketPrice, exchange } = req.body;
    
    if (!investorId || !stockSymbol || !quantity || !avgBuyPrice) {
      res.status(400).json({ error: 'Missing baseline equity verification attributes.' });
      return;
    }

    await AdminModel.executeAtomicEquityIngestion({
      investorId,
      stockSymbol: stockSymbol.trim().toUpperCase(),
      quantity: parseFloat(quantity),
      avgBuyPrice: parseFloat(avgBuyPrice),
      currentMarketPrice: parseFloat(currentMarketPrice || avgBuyPrice),
      exchange: exchange || 'NSE'
    });

    res.status(201).json({ status: 'SUCCESS', message: 'Equity asset position and transactional history log recorded completely.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Equity atomic ingestion transaction failed.', details: error.message });
  }
};

// 💎 ATOMIC TRANSACTION: Ingest Mutual Fund Balance with Historical Ledger Logs
export const opsAddMutualFundWithLog = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const { customerRef, schemeCode, units, investedAmount, currentValue, investmentDate } = req.body;

    if (!customerRef || !schemeCode || !units || !investedAmount) {
      res.status(400).json({ error: 'Missing mutual fund clearance attributes.' });
      return;
    }

    await AdminModel.executeAtomicMutualFundIngestion({
      customerRef,
      schemeCode,
      units: parseFloat(units),
      investedAmount: parseFloat(investedAmount),
      currentValue: parseFloat(currentValue || investedAmount),
      investmentDate: investmentDate || '2026-05-20'
    });

    res.status(201).json({ status: 'SUCCESS', message: 'Mutual Fund allocation and transaction log synced successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Mutual fund transactional ledger ingestion failed.', details: error.message });
  }
};


// Dynamic security bearer extraction for Server 1
const getDownstreamEquityToken = async (equityId: string): Promise<string> => {
  const eqLogin = await axios.post(`http://localhost:5000/auth/login`, { 
    investorId: equityId, 
    password: 'password123' 
  }, { timeout: 2000 });
  return eqLogin.data.accessToken;
};

// =========================================================================
// 🏢 LOCAL REAL ESTATE CRUD LIFE-CYCLE MANAGEMENT
// =========================================================================

export const opsOrUserAddRealEstate = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const { panNumber, propertyName, address, purchasePrice, purchaseDate, targetUserId } = req.body;
    const requesterId = req.userContext!.userId;
    const roles = req.userContext!.roles;

    if (roles.includes('OPS') && !roles.includes('ADMIN')) {
      const isAuthorized = await CoreModel.checkOpsUserAuthority(requesterId, targetUserId);
      if (!isAuthorized) {
        res.status(403).json({ error: 'Access Denied: Target user falls outside your assignment roster.' });
        return;
      }
    }
    await AdminModel.createRealEstateProperty(panNumber, propertyName, address || '', parseFloat(purchasePrice), purchaseDate || '2026-05-20');
    res.status(201).json({ status: 'SUCCESS', message: 'Property position registered securely.' });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
};

export const opsOrAdminUpdateProperty = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const { propertyId, propertyName, address, purchasePrice, currentStatus } = req.body;
    const requesterId = req.userContext!.userId;
    const roles = req.userContext!.roles;

    const currentAsset = await AdminModel.getPropertyOwnerMetadata(propertyId);
    if (!currentAsset) { res.status(404).json({ error: 'Targeted physical asset not found.' }); return; }

    if (roles.includes('OPS') && !roles.includes('ADMIN')) {
      const isAuthorized = await CoreModel.checkOpsUserAuthority(requesterId, currentAsset.user_id);
      if (!isAuthorized) { res.status(403).json({ error: 'Access Denied: Unassigned resource sector entry.' }); return; }
    }

    await AdminModel.updateRealEstatePropertyDetails(propertyId, propertyName.trim(), address || '', parseFloat(purchasePrice), currentStatus || 'OWNED');
    res.status(200).json({ status: 'SUCCESS' });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
};

export const opsOrAdminDeleteProperty = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const { propertyId } = req.params;
    const requesterId = req.userContext!.userId;
    const roles = req.userContext!.roles;

    const currentAsset = await AdminModel.getPropertyOwnerMetadata(propertyId);
    if (!currentAsset) { res.status(404).json({ error: 'Asset position unverified.' }); return; }

    if (roles.includes('OPS') && !roles.includes('ADMIN')) {
      const isAuthorized = await CoreModel.checkOpsUserAuthority(requesterId, currentAsset.user_id);
      if (!isAuthorized) { res.status(403).json({ error: 'Access Denied: Action blocked by security mapping.' }); return; }
    }

    await AdminModel.deleteRealEstatePropertyRecord(propertyId);
    res.status(200).json({ status: 'SUCCESS' });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
};

// =========================================================================
// 📈 SERVER 1 PROXY DISPATCH LABELS (EQUITY OVER WIRE CRUD)
// =========================================================================

export const opsProxyAddEquityHoldings = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const { investorId, stockSymbol, quantity, avgBuyPrice, exchange } = req.body;
    const token = await getDownstreamEquityToken(investorId);
    await axios.post(`http://localhost:5000/equity/trade`, { stockSymbol, quantity: parseFloat(quantity), price: parseFloat(avgBuyPrice), transactionType: 'BUY', exchange }, { headers: { Authorization: `Bearer ${token}` } });
    res.status(201).json({ status: 'SUCCESS' });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
};

export const opsProxyUpdateEquityHoldings = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const { investorId, stockSymbol, quantity, avgBuyPrice, id } = req.body;
    const token = await getDownstreamEquityToken(investorId);
    // PUT Call updates individual holding records directly inside Server 1 memory
    await axios.put(`http://localhost:5000/equity/holdings/${id}`, { stockSymbol, quantity, avgBuyPrice }, { headers: { Authorization: `Bearer ${token}` } });
    res.status(200).json({ status: 'SUCCESS' });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
};

export const opsProxyDeleteEquityHoldings = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const { investorId, id } = req.params;
    const token = await getDownstreamEquityToken(investorId);
    // DELETE Call cancels target holdings slot on Server 1
    await axios.delete(`http://localhost:5000/equity/holdings/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    res.status(200).json({ status: 'SUCCESS' });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
};

// =========================================================================
// 💎 SERVER 2 PROXY DISPATCH LABELS (MUTUAL FUNDS OVER WIRE HMAC CRUD)
// =========================================================================

export const opsProxyAddMutualFundsHoldings = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const { customerRef, schemeCode, units, investedAmount } = req.body;
    const targetPath = `/mf/orders/record`;
    const payload = { customerRef, schemeCode, amount: parseFloat(investedAmount), units: parseFloat(units), type: 'PURCHASE' };
    const signature = crypto.createHmac('sha256', ENV.MUTUAL_FUND_HMAC_SECRET || 'secret').update('POST' + targetPath + JSON.stringify(payload)).digest('hex').toLowerCase();
    await axios.post(`http://localhost:5001${targetPath}`, payload, { headers: { 'x-api-key': ENV.MUTUAL_FUND_API_KEY, 'x-hmac-signature': signature } });
    res.status(201).json({ status: 'SUCCESS' });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
};

export const opsProxyUpdateMutualFundsHoldings = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const { customerRef, schemeCode, units, investedAmount, currentValue, id } = req.body;
    const targetPath = `/mf/portfolio/update/${id}`;
    const payload = { customerRef, schemeCode, units: parseFloat(units), investedAmount: parseFloat(investedAmount), currentValue: parseFloat(currentValue || investedAmount) };
    const signature = crypto.createHmac('sha256', ENV.MUTUAL_FUND_HMAC_SECRET || 'secret').update('PUT' + targetPath + JSON.stringify(payload)).digest('hex').toLowerCase();
    await axios.put(`http://localhost:5001${targetPath}`, payload, { headers: { 'x-api-key': ENV.MUTUAL_FUND_API_KEY, 'x-hmac-signature': signature } });
    res.status(200).json({ status: 'SUCCESS' });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
};

export const opsProxyDeleteMutualFundsHoldings = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const { customerRef, id } = req.params;
    const targetPath = `/mf/portfolio/delete/${id}`;
    const signature = crypto.createHmac('sha256', ENV.MUTUAL_FUND_HMAC_SECRET || 'secret').update('DELETE' + targetPath + JSON.stringify({ customerRef })).digest('hex').toLowerCase();
    await axios.delete(`http://localhost:5001${targetPath}`, { headers: { 'x-api-key': ENV.MUTUAL_FUND_API_KEY, 'x-hmac-signature': signature }, data: { customerRef } });
    res.status(200).json({ status: 'SUCCESS' });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
};

// =========================================================================
// 🛠️ ADMINISTRATIVE BACKENDS
// =========================================================================

export const appendValuationRevaluation = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const { propertyId, marketValue, valuationDate } = req.body;
    await AdminModel.insertRealEstateValuation(propertyId, parseFloat(marketValue), valuationDate, req.userContext!.userId);
    res.status(201).json({ status: 'SUCCESS' });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
};

export const viewPlatformAuditLedger = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const logs = await AdminModel.getSystemAuditLogs();
    res.status(200).json({ status: 'SUCCESS', logCount: logs.length, data: logs });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
};