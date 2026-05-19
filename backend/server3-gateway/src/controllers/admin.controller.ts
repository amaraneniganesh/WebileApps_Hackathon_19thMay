import { Response } from 'express';
import { AuthenticatedGatewayRequest } from '../middleware/auth.middleware';
import * as AdminModel from '../models/admin.model';
import * as CoreModel from '../models/core.model';

export const opsOrUserAddRealEstate = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const { panNumber, propertyName, address, purchasePrice, purchaseDate, targetUserId } = req.body;
    const requesterId = req.userContext!.userId;
    const roles = req.userContext!.roles;

    if (roles.includes('OPS')) {
      const isAuthorized = await CoreModel.checkOpsUserAuthority(requesterId, targetUserId);
      if (!isAuthorized) {
        res.status(403).json({ error: 'Access Denied: OPS not assigned to this investor account.' });
        return;
      }
    }

    await AdminModel.createRealEstateProperty(panNumber, propertyName, address || '', purchasePrice, purchaseDate);
    res.status(201).json({ status: 'SUCCESS', message: 'Real estate asset created successfully.' });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
};

export const addRealEstateAsset = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const { panNumber, propertyName, address, purchasePrice, purchaseDate } = req.body;
    if (!panNumber || !propertyName || !purchasePrice || !purchaseDate) {
      res.status(400).json({ error: 'Missing mandatory allocation configuration data parameters.' });
      return;
    }
    await AdminModel.createRealEstateProperty(panNumber, propertyName, address || '', purchasePrice, purchaseDate);
    res.status(201).json({ status: 'SUCCESS', message: 'Internal real estate structural tracking position secured.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const appendValuationRevaluation = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const { propertyId, marketValue, valuationDate } = req.body;
    const operatorId = req.userContext?.userId;

    if (!propertyId || !marketValue || !valuationDate || !operatorId) {
      res.status(400).json({ error: 'Missing indexing properties.' });
      return;
    }
    await AdminModel.insertRealEstateValuation(propertyId, marketValue, valuationDate, operatorId);
    res.status(201).json({ status: 'SUCCESS', message: 'Asset appraisal update mapped onto tables cleanly.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const viewPlatformAuditLedger = async (req: AuthenticatedGatewayRequest, res: Response): Promise<void> => {
  try {
    const logs = await AdminModel.getSystemAuditLogs();
    res.status(200).json({ status: 'SUCCESS', logCount: logs.length, matrixLog: logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};