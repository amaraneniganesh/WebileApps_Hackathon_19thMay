import { Response, Request } from 'express';
import { AuthenticatedGatewayRequest } from '../middleware/auth.middleware';
import * as AdminModel from '../models/admin.model';
import * as CoreModel from '../models/core.model';

// 🏢 PROPERTY INGESTION (Supports Admin, OPS, and VIEWER roles safely)
export const opsOrUserAddRealEstate = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const { panNumber, propertyName, address, purchasePrice, purchaseDate, targetUserId } = req.body;
    const requesterId = req.userContext!.userId;
    const roles = req.userContext!.roles;

    // Security Gate: Enforce relationship check if the user is an OPS agent
    if (roles.includes('OPS') && !roles.includes('ADMIN')) {
      if (!targetUserId) {
        res.status(400).json({ error: 'Target user ID parameter is required for operational client validation.' });
        return;
      }
      const isAuthorized = await CoreModel.checkOpsUserAuthority(requesterId, targetUserId);
      if (!isAuthorized) {
        res.status(403).json({ error: 'Access Denied: Your OPS account is not assigned to manage this investor profile.' });
        return;
      }
    }

    if (!panNumber || !propertyName || !purchasePrice) {
      res.status(400).json({ error: 'Missing mandatory property description attributes.' });
      return;
    }

    await AdminModel.createRealEstateProperty(
      panNumber, 
      propertyName, 
      address || '', 
      parseFloat(purchasePrice), 
      purchaseDate || '2026-05-20'
    );

    res.status(201).json({ status: 'SUCCESS', message: 'Real estate asset created successfully across local registry tables.' });
  } catch (error: any) { 
    res.status(500).json({ error: error.message }); 
  }
};

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

// 🏢 REVALUATION MODULE (ADMIN Only context)
export const appendValuationRevaluation = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const { propertyId, marketValue, valuationDate } = req.body;
    const operatorId = req.userContext?.userId;

    if (!propertyId || !marketValue || !valuationDate || !operatorId) {
      res.status(400).json({ error: 'Missing revaluation index mapping fields.' });
      return;
    }
    await AdminModel.insertRealEstateValuation(propertyId, parseFloat(marketValue), valuationDate, operatorId);
    res.status(201).json({ status: 'SUCCESS', message: 'Asset appraisal update mapped onto tables cleanly.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 📜 INFRASTRUCTURE AUDIT LEDGER (ADMIN Only context)
export const viewPlatformAuditLedger = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const logs = await AdminModel.getSystemAuditLogs();
    res.status(200).json({ status: 'SUCCESS', logCount: logs.length, data: logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const opsOrAdminUpdateProperty = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const { propertyId, propertyName, address, purchasePrice, currentStatus } = req.body;
    const requesterId = req.userContext!.userId;
    const roles = req.userContext!.roles;

    if (!propertyId || !propertyName || !purchasePrice) {
      res.status(400).json({ error: 'Property identification tracking fields are required.' });
      return;
    }

    const currentAsset = await AdminModel.getPropertyOwnerMetadata(propertyId);
    if (!currentAsset) {
      res.status(404).json({ error: 'Targeted physical asset not found in database logs.' });
      return;
    }

    // Security check: Only validate relationship records if the request comes from an OPS user
    if (roles.includes('OPS') && !roles.includes('ADMIN')) {
      const isAuthorized = await CoreModel.checkOpsUserAuthority(requesterId, currentAsset.user_id);
      if (!isAuthorized) {
        res.status(403).json({ error: 'Access Denied: Resource is outside your operational allocation boundary.' });
        return;
      }
    }

    await AdminModel.updateRealEstatePropertyDetails(
      propertyId,
      propertyName.trim(),
      address || '',
      parseFloat(purchasePrice),
      currentStatus || 'OWNED'
    );

    res.status(200).json({ status: 'SUCCESS', message: 'Asset details updated completely.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 🗑️ DELETE CONTROLLER
export const opsOrAdminDeleteProperty = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const { propertyId } = req.params;
    const requesterId = req.userContext!.userId;
    const roles = req.userContext!.roles;

    const currentAsset = await AdminModel.getPropertyOwnerMetadata(propertyId);
    if (!currentAsset) {
      res.status(404).json({ error: 'Asset target not identified.' });
      return;
    }

    if (roles.includes('OPS') && !roles.includes('ADMIN')) {
      const isAuthorized = await CoreModel.checkOpsUserAuthority(requesterId, currentAsset.user_id);
      if (!isAuthorized) {
        res.status(403).json({ error: 'Access Denied: Cannot delete an asset belonging to an unassigned user.' });
        return;
      }
    }

    await AdminModel.deleteRealEstatePropertyRecord(propertyId);
    res.status(200).json({ status: 'SUCCESS', message: 'Asset removed successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};