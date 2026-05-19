import { Request, Response } from 'express';
import * as MfModel from '../models/mf.model';

export const getCustomerPortfolio = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerRef } = req.params;

    if (!customerRef) {
      res.status(400).json({ error: 'Missing required route parameter: customerRef' });
      return;
    }

    const portfolio = await MfModel.getPortfolioByCustomer(customerRef);
    res.status(200).json({ status: 'SUCCESS', count: portfolio.length, data: portfolio });
  } catch (error: any) {
    res.status(500).json({ error: 'Database pipeline exception compiling customer fund views.', details: error.message });
  }
};

export const getCustomerSips = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerRef } = req.params;

    if (!customerRef) {
      res.status(400).json({ error: 'Missing required route parameter: customerRef' });
      return;
    }

    const sips = await MfModel.getSipsByCustomer(customerRef);
    res.status(200).json({ status: 'SUCCESS', count: sips.length, data: sips });
  } catch (error: any) {
    res.status(500).json({ error: 'Database pipeline exception fetching Systematic Investment Plans.', details: error.message });
  }
};

export const getCustomerTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerRef } = req.params;

    if (!customerRef) {
      res.status(400).json({ error: 'Missing required route parameter: customerRef' });
      return;
    }

    const transactions = await MfModel.getTransactionsByCustomer(customerRef);
    res.status(200).json({ status: 'SUCCESS', count: transactions.length, data: transactions });
  } catch (error: any) {
    res.status(500).json({ error: 'Database pipeline exception looking up historical allocation transfers.', details: error.message });
  }
};