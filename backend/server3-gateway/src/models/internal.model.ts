import { pool } from '../config/db';

export const getInterruptedSipsReport = (): Promise<any[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = `
        SELECT s.*, c.full_name, c.email, c.pan_number 
        FROM public.mf_sips s 
        JOIN public.mf_customers c ON s.customer_ref = c.customer_ref 
        WHERE s.sip_status IN ('FAILED', 'PAUSED')
        ORDER BY s.next_due_date ASC
      `;
      const result = await pool.query(query);
      resolve(result.rows);
    } catch (error) {
      reject(error);
    }
  });
};

export const getDormantInvestorsReport = (): Promise<any[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = `
        SELECT i.* FROM public.investor_identity_map i
        WHERE i.equity_id IN (
          SELECT investor_id FROM public.equity_users 
          WHERE investor_id NOT IN (
            SELECT DISTINCT investor_id FROM public.equity_transactions WHERE executed_at > NOW() - INTERVAL '180 days'
          )
        )
        ORDER BY i.full_name ASC
      `;
      const result = await pool.query(query);
      resolve(result.rows);
    } catch (error) {
      reject(error);
    }
  });
};