import { pool } from '../config/db';

export interface MfCustomerFund {
  id: number;
  customer_ref: string;
  scheme_code: string;
  units: number;
  invested_amount: number;
  current_value: number;
  investment_date: Date;
  scheme_name?: string;
  fund_category?: string;
  nav_value?: number;
}

export interface MfSip {
  id: number;
  customer_ref: string;
  scheme_code: string;
  sip_amount: number;
  sip_status: string;
  start_date: Date;
  next_due_date: Date | null;
}

export interface MfTransaction {
  id: number;
  customer_ref: string;
  scheme_code: string;
  transaction_type: string;
  amount: number;
  units: number | null;
  redemption_status: string | null;
  executed_at: Date;
}

export const getPortfolioByCustomer = (customerRef: string): Promise<MfCustomerFund[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = `
        SELECT cf.*, s.scheme_name, s.fund_category, s.nav_value 
        FROM public.mf_customer_funds cf
        JOIN public.mf_schemes s ON cf.scheme_code = s.scheme_code
        WHERE cf.customer_ref = $1
        ORDER BY cf.id ASC
      `;
      const result = await pool.query(query, [customerRef]);
      resolve(result.rows);
    } catch (error) {
      reject(error);
    }
  });
};

export const getSipsByCustomer = (customerRef: string): Promise<MfSip[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = 'SELECT * FROM public.mf_sips WHERE customer_ref = $1 ORDER BY id ASC';
      const result = await pool.query(query, [customerRef]);
      resolve(result.rows);
    } catch (error) {
      reject(error);
    }
  });
};

export const getTransactionsByCustomer = (customerRef: string): Promise<MfTransaction[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = 'SELECT * FROM public.mf_transactions WHERE customer_ref = $1 ORDER BY executed_at DESC';
      const result = await pool.query(query, [customerRef]);
      resolve(result.rows);
    } catch (error) {
      reject(error);
    }
  });
};