import { pool } from '../config/db';

export interface EquityUser {
  investor_id: string;
  full_name: string;
  email: string;
  pan_number: string;
  demat_account: string;
  password_hash: string;
  created_at: Date;
}

export const AuthModel = {
  findUserById: (investorId: string): Promise<EquityUser | null> => {
    return new Promise(async (resolve, reject) => {
      try {
        const query = 'SELECT * FROM public.equity_users WHERE investor_id = $1';
        const result = await pool.query(query, [investorId]);
        if (result.rows.length === 0) {
          return resolve(null);
        }
        resolve(result.rows[0]);
      } catch (error) {
        reject(error);
      }
    });
  },

  saveRefreshToken: (investorId: string, token: string, expiresAt: Date): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        const query = `
          INSERT INTO public.equity_refresh_tokens (investor_id, token, expires_at) 
          VALUES ($1, $2, $3)
        `;
        await pool.query(query, [investorId, token, expiresAt]);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  findRefreshToken: (token: string): Promise<{ investor_id: string; expires_at: Date } | null> => {
    return new Promise(async (resolve, reject) => {
      try {
        const query = 'SELECT investor_id, expires_at FROM public.equity_refresh_tokens WHERE token = $1';
        const result = await pool.query(query, [token]);
        if (result.rows.length === 0) {
          return resolve(null);
        }
        resolve(result.rows[0]);
      } catch (error) {
        reject(error);
      }
    });
  },

  revokeRefreshToken: (token: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        const query = 'DELETE FROM public.equity_refresh_tokens WHERE token = $1';
        const result = await pool.query(query, [token]);
        
        // Check if a row was actually eliminated by the query criteria
        if (result.rowCount === 0) {
          return reject(new Error('DATABASE EXCLUSION ALERT: No matching token row was found to delete. Check string parameters.'));
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
};