import { Request, Response } from 'express';
import { EquityModel } from '../models/equity.model';

// Explicit type extraction to fetch internal decoded authentication context safely
interface SecurityContextRequest extends Request {
  user?: { investorId: string };
}

export const EquityController = {
  getHoldings: async (req: SecurityContextRequest, res: Response): Promise<void> => {
    try {
      const investorId = req.user?.investorId;
      if (!investorId) {
        res.status(400).json({ error: 'Missing runtime identification reference mappings.' });
        return;
      }

      const holdings = await EquityModel.getHoldingsByInvestor(investorId);
      res.status(200).json({ status: 'SUCCESS', count: holdings.length, data: holdings });
    } catch (error: any) {
      res.status(500).json({ error: 'Data lookup compilation exception across database queries', details: error.message });
    }
  },

  getTransactions: async (req: SecurityContextRequest, res: Response): Promise<void> => {
    try {
      const investorId = req.user?.investorId;
      if (!investorId) {
        res.status(400).json({ error: 'Missing tracking trace identities.' });
        return;
      }

      const transactions = await EquityModel.getTransactionsByInvestor(investorId);
      res.status(200).json({ status: 'SUCCESS', count: transactions.length, data: transactions });
    } catch (error: any) {
      res.status(500).json({ error: 'Database pipeline breakdown looking up historical ledger streams', details: error.message });
    }
  },

  getMarketPrices: async (req: Request, res: Response): Promise<void> => {
    try {
      const marketPrices = await EquityModel.getAllMarketPrices();
      res.status(200).json({ status: 'SUCCESS', count: marketPrices.length, data: marketPrices });
    } catch (error: any) {
      res.status(500).json({ error: 'Ticker engine exception parsing current exchange tables', details: error.message });
    }
  },

  getWatchlist: async (req: SecurityContextRequest, res: Response): Promise<void> => {
    try {
      const investorId = req.user?.investorId;
      if (!investorId) {
        res.status(400).json({ error: 'Security validation context map error.' });
        return;
      }

      const watchlist = await EquityModel.getWatchlistByInvestor(investorId);
      res.status(200).json({ status: 'SUCCESS', count: watchlist.length, data: watchlist });
    } catch (error: any) {
      res.status(500).json({ error: 'Database tracking parsing exception handling watch list rows', details: error.message });
    }
  }
};