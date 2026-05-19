import { pool } from '../config/db';

export interface PlatformUser {
  user_id: string;
  full_name: string;
  email: string;
  password_hash: string;
  is_active: boolean;
  roles: string[];
}

export interface InvestorIdentity {
  pan_number: string;
  full_name: string;
  email: string;
  equity_id: string | null;
  equity_password?: string | null;
  mf_ref: string | null;
  mf_password?: string | null;
  user_id: string;
}

export const findInvestorIdentityByPan = (panNumber: string): Promise<InvestorIdentity | null> => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = 'SELECT * FROM public.investor_identity_map WHERE pan_number = $1';
      const result = await pool.query(query, [panNumber]);
      if (result.rows.length === 0) return resolve(null);
      resolve(result.rows[0]);
    } catch (error) {
      reject(error);
    }
  });
};

// Public self-registration database tasks
export const registerPlatformUser = (userId: string, name: string, email: string, hash: string, role: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'INSERT INTO public.platform_users (user_id, full_name, email, password_hash, is_active) VALUES ($1, $2, $3, $4, true)',
        [userId, name, email, hash]
      );
      await client.query('INSERT INTO public.platform_user_roles (user_id, role_id) VALUES ($1, $2)', [userId, role]);
      await client.query('COMMIT');
      resolve();
    } catch (error) {
      await client.query('ROLLBACK');
      reject(error);
    } finally {
      client.release();
    }
  });
};

export const initializeIdentityMap = (pan: string, name: string, email: string, userId: string, eqId: string, eqPass: string, mfRef: string, mfPass: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      // 🔥 UPSERT ENGINE: If pan_number conflicts, dynamically update the existing row parameters
      const query = `
        INSERT INTO public.investor_identity_map (pan_number, full_name, email, user_id, equity_id, equity_password, mf_ref, mf_password)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (pan_number) 
        DO UPDATE SET 
          user_id = EXCLUDED.user_id,
          equity_id = EXCLUDED.equity_id,
          equity_password = EXCLUDED.equity_password,
          mf_ref = EXCLUDED.mf_ref,
          mf_password = EXCLUDED.mf_password,
          full_name = EXCLUDED.full_name,
          email = EXCLUDED.email
      `;
      await pool.query(query, [pan, name, email, userId, eqId, eqPass, mfRef, mfPass]);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export const getInvestorsAssignedToOps = (opsId: string): Promise<any[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = `
        SELECT 
          u.user_id, 
          u.full_name, 
          u.email, 
          i.pan_number,
          i.equity_id,
          i.mf_ref,
          a.assigned_at
        FROM public.platform_assignments a
        JOIN public.platform_users u ON a.user_id = u.user_id
        LEFT JOIN public.investor_identity_map i ON u.user_id = i.user_id
        WHERE a.ops_id = $1
        ORDER BY u.full_name ASC
      `;
      const result = await pool.query(query, [opsId]);
      resolve(result.rows);
    } catch (error) {
      reject(error);
    }
  });
};

export const findPlatformUserByEmail = (email: string): Promise<PlatformUser | null> => {
  return new Promise(async (resolve, reject) => {
    try {
      const userRes = await pool.query('SELECT * FROM public.platform_users WHERE email = $1 AND is_active = true', [email]);
      if (userRes.rows.length === 0) return resolve(null);
      const user = userRes.rows[0];
      const rolesRes = await pool.query('SELECT role_id FROM public.platform_user_roles WHERE user_id = $1', [user.user_id]);
      resolve({ ...user, roles: rolesRes.rows.map(r => r.role_id) });
    } catch (error) { reject(error); }
  });
};

export const getFullIdentityMapByUserId = (userId: string): Promise<InvestorIdentity | null> => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = 'SELECT pan_number, full_name, email, equity_id, equity_password, mf_ref, mf_password, user_id FROM public.investor_identity_map WHERE user_id = $1';
      const result = await pool.query(query, [userId]);
      if (result.rows.length === 0) return resolve(null);
      resolve(result.rows[0]);
    } catch (error) { reject(error); }
  });
};

// RM and OPS Structural Mapping Verifications
export const assignUserToOpsTeam = (rmId: string, opsId: string, userId: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = `
        INSERT INTO public.platform_assignments (rm_id, ops_id, user_id) 
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id) DO UPDATE SET rm_id = $1, ops_id = $2
      `;
      await pool.query(query, [rmId, opsId, userId]);
      resolve();
    } catch (error) { reject(error); }
  });
};

export const checkOpsUserAuthority = (opsId: string, userId: string): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = 'SELECT 1 FROM public.platform_assignments WHERE ops_id = $1 AND user_id = $2';
      const result = await pool.query(query, [opsId, userId]);
      resolve(result.rows.length > 0);
    } catch (error) { reject(error); }
  });
};

export const getInternalRealEstateByPan = (panNumber: string): Promise<any[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = 'SELECT * FROM public.real_estate_properties WHERE pan_number = $1';
      const properties = await pool.query(query, [panNumber]);
      const structuredProperties = [];
      for (const prop of properties.rows) {
        const valRes = await pool.query('SELECT market_value FROM public.real_estate_valuations WHERE property_id = $1 ORDER BY valuation_date DESC LIMIT 1', [prop.property_id]);
        const rentRes = await pool.query('SELECT SUM(amount) as total_rent FROM public.real_estate_rental_income WHERE property_id = $1 AND payment_status = \'RECEIVED\'', [prop.property_id]);
        structuredProperties.push({
          ...prop,
          latest_valuation: valRes.rows[0]?.market_value || prop.purchase_price,
          total_rental_collected: rentRes.rows[0]?.total_rent || 0
        });
      }
      resolve(structuredProperties);
    } catch (error) { reject(error); }
  });
};