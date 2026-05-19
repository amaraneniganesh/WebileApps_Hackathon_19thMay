import { pool } from '../config/db';

export interface EquityHolding {
  id: number;
  investor_id: string;
  stock_symbol: string;
  quantity: number;
  avg_buy_price: number;
  current_market_price: number;
  exchange: string;
  updated_at: Date;
}

export interface EquityTransaction {
  id: number;
  investor_id: string;
  stock_symbol: string;
  transaction_type: string;
  quantity: number;
  price: number;
  exchange: string;
  realized_gain: number | null;
  executed_at: Date;
}

export interface MarketPrice {
  stock_symbol: string;
  company_name: string;
  current_price: number;
  day_change_percent: number;
  exchange: string;
  updated_at: Date;
}

export const EquityModel = {
  getHoldingsByInvestor: (investorId: string): Promise<EquityHolding[]> => {
    return new Promise(async (resolve, reject) => {
      try {
        const query = 'SELECT * FROM public.equity_holdings WHERE investor_id = $1 ORDER BY stock_symbol ASC';
        const result = await pool.query(query, [investorId]);
        resolve(result.rows);
      } catch (error) {
        reject(error);
      }
    });
  },

  getTransactionsByInvestor: (investorId: string): Promise<EquityTransaction[]> => {
    return new Promise(async (resolve, reject) => {
      try {
        const query = 'SELECT * FROM public.equity_transactions WHERE investor_id = $1 ORDER BY executed_at DESC';
        const result = await pool.query(query, [investorId]);
        resolve(result.rows);
      } catch (error) {
        reject(error);
      }
    });
  },

  getAllMarketPrices: (): Promise<MarketPrice[]> => {
    return new Promise(async (resolve, reject) => {
      try {
        const query = 'SELECT * FROM public.equity_market_prices ORDER BY stock_symbol ASC';
        const result = await pool.query(query);
        resolve(result.rows);
      } catch (error) {
        reject(error);
      }
    });
  },

  getWatchlistByInvestor: (investorId: string): Promise<any[]> => {
    return new Promise(async (resolve, reject) => {
      try {
        const query = `
          SELECT w.id, w.stock_symbol, w.added_at, m.company_name, m.current_price, m.day_change_percent
          FROM public.equity_watchlist w
          JOIN public.equity_market_prices m ON w.stock_symbol = m.stock_symbol
          WHERE w.investor_id = $1
          ORDER BY w.added_at DESC
        `;
        const result = await pool.query(query, [investorId]);
        resolve(result.rows);
      } catch (error) {
        reject(error);
      }
    });
  }
};