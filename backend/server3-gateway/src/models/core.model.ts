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

export interface ComprehensiveRegisterInput {
  fullName: string;
  email: string;
  passwordHash: string;
  panNumber: string;
  equityId: string;
  dematAccount: string;
  mfRef: string;
  folioNumber: string;
}

export interface CorporateStaffInput {
  fullName: string;
  email: string;
  passwordHash: string;
  assignedRole: 'OPS' | 'RM';
}

export const executeIsolatedStaffProvisioning = (input: CorporateStaffInput): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Insert strictly into public.platform_users
      const staffInsertQuery = `
        INSERT INTO public.platform_users (user_id, full_name, email, password_hash, is_active)
        VALUES (gen_random_uuid(), $1, $2, $3, true)
        RETURNING user_id
      `;
      const staffRes = await client.query(staffInsertQuery, [input.fullName, input.email, input.passwordHash]);
      const newStaffId = staffRes.rows[0].user_id;

      // 2. Bind the precise operational role (OPS or RM)
      const roleInsertQuery = `
        INSERT INTO public.platform_user_roles (user_id, role_id)
        VALUES ($1, $2)
      `;
      await client.query(roleInsertQuery, [newStaffId, input.assignedRole]);

      // 🧠 NOTE: We completely skip equity_users, mf_customers, and investor_identity_map
      // because staff nodes do not own downstream market portfolios.

      await client.query('COMMIT');
      resolve(newStaffId);
    } catch (error) {
      await client.query('ROLLBACK');
      reject(error);
    } finally {
      client.release();
    }
  });
};

export const executeComprehensiveRegistration = (input: ComprehensiveRegisterInput): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // =========================================================================
      // 1. TABLE: public.platform_users
      // =========================================================================
      const userInsertQuery = `
        INSERT INTO public.platform_users (user_id, full_name, email, password_hash, is_active)
        VALUES (gen_random_uuid(), $1, $2, $3, true)
        RETURNING user_id
      `;
      const userRes = await client.query(userInsertQuery, [input.fullName, input.email, input.passwordHash]);
      const newUserId = userRes.rows[0].user_id;

      // Assign core VIEWER role context
      const roleInsertQuery = `
        INSERT INTO public.platform_user_roles (user_id, role_id)
        VALUES ($1, 'VIEWER')
      `;
      await client.query(roleInsertQuery, [newUserId]);

      // =========================================================================
      // 2. TABLE: public.equity_users
      // =========================================================================
      const equityUserQuery = `
        INSERT INTO public.equity_users (investor_id, full_name, email, pan_number, demat_account, password_hash)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await client.query(equityUserQuery, [
        input.equityId,
        input.fullName,
        input.email,
        input.panNumber,
        input.dematAccount,
        input.passwordHash
      ]);

      // =========================================================================
      // 3. TABLE: public.mf_customers
      // =========================================================================
      const mfCustomerQuery = `
        INSERT INTO public.mf_customers (customer_ref, full_name, email, pan_number, folio_number)
        VALUES ($1, $2, $3, $4, $5)
      `;
      await client.query(mfCustomerQuery, [
        input.mfRef,
        input.fullName,
        input.email,
        input.panNumber,
        input.folioNumber
      ]);

      // =========================================================================
      // 4. TABLE: public.investor_identity_map
      // =========================================================================
      const identityMapQuery = `
        INSERT INTO public.investor_identity_map (
          pan_number, full_name, email, user_id, equity_id, mf_ref, equity_password, mf_password
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      await client.query(identityMapQuery, [
        input.panNumber,
        input.fullName,
        input.email,
        newUserId,
        input.equityId,
        input.mfRef,
        'password123', // Direct simulation fallback keys for downstream microservice routes
        'password123'
      ]);

      // =========================================================================
      // 5. TABLE: public.platform_assignments
      // =========================================================================
      const defaultAssignmentQuery = `
        INSERT INTO public.platform_assignments (rm_id, ops_id, user_id)
        VALUES (
          (SELECT user_id FROM public.platform_user_roles WHERE role_id = 'RM' LIMIT 1),
          (SELECT user_id FROM public.platform_user_roles WHERE role_id = 'OPS' LIMIT 1),
          $1
        ) ON CONFLICT (user_id) DO NOTHING
      `;
      await client.query(defaultAssignmentQuery, [newUserId]);

      await client.query('COMMIT');
      resolve(newUserId);
    } catch (error) {
      await client.query('ROLLBACK');
      reject(error);
    } finally {
      client.release();
    }
  });
};

export const getAdministrativeUserRegistry = (): Promise<any[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = `
        SELECT 
          u.user_id, u.full_name, u.email, u.is_active, u.created_at,
          r.role_id as assigned_role,
          i.pan_number, i.equity_id, i.mf_ref
        FROM public.platform_users u
        JOIN public.platform_user_roles r ON u.user_id = r.user_id
        LEFT JOIN public.investor_identity_map i ON u.user_id = i.user_id
        ORDER BY r.role_id ASC, u.full_name ASC
      `;
      const result = await pool.query(query);
      resolve(result.rows);
    } catch (error) { reject(error); }
  });
};

export const modifyUserLifecycleState = (userId: string, targetState: boolean): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      await pool.query('UPDATE public.platform_users SET is_active = $2 WHERE user_id = $1', [userId, targetState]);
      resolve();
    } catch (error) { reject(error); }
  });
};

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


// Fetches all users carrying the VIEWER (Investor) role
export const getAllActiveInvestorsList = (): Promise<any[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = `
        SELECT u.user_id, u.full_name, u.email, i.pan_number 
        FROM public.platform_users u
        JOIN public.platform_user_roles r ON u.user_id = r.user_id
        LEFT JOIN public.investor_identity_map i ON u.user_id = i.user_id
        WHERE r.role_id = 'VIEWER' AND u.is_active = true
        ORDER BY u.full_name ASC
      `;
      const result = await pool.query(query);
      resolve(result.rows);
    } catch (error) { reject(error); }
  });
};

// Fetches all users carrying the OPS (Operations Staff) role
export const getAllActiveOpsStaffList = (): Promise<any[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = `
        SELECT u.user_id, u.full_name, u.email 
        FROM public.platform_users u
        JOIN public.platform_user_roles r ON u.user_id = r.user_id
        WHERE r.role_id = 'OPS' AND u.is_active = true
        ORDER BY u.full_name ASC
      `;
      const result = await pool.query(query);
      resolve(result.rows);
    } catch (error) { reject(error); }
  });
};

// Pulls the absolute master assignment ledger mapping cross-connections
export const getMasterPlatformAssignmentsLedger = (): Promise<any[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = `
        SELECT 
          a.assignment_id,
          u_inv.user_id as investor_user_id, u_inv.full_name as investor_name, u_inv.email as investor_email,
          u_ops.user_id as ops_user_id, u_ops.full_name as ops_name, u_ops.email as ops_email,
          u_rm.full_name as rm_name
        FROM public.platform_assignments a
        JOIN public.platform_users u_inv ON a.user_id = u_inv.user_id
        LEFT JOIN public.platform_users u_ops ON a.ops_id = u_ops.user_id
        LEFT JOIN public.platform_users u_rm ON a.rm_id = u_rm.user_id
        ORDER BY u_inv.full_name ASC
      `;
      const result = await pool.query(query);
      resolve(result.rows);
    } catch (error) { reject(error); }
  });
};